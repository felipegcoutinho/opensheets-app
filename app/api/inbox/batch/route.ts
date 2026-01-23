/**
 * POST /api/inbox/batch
 *
 * Recebe múltiplas notificações do app Android (sync offline).
 * Requer autenticação via API token.
 */

import { validateApiToken, extractBearerToken } from "@/lib/auth/api-token";
import { db } from "@/lib/db";
import { apiTokens, inboxItems } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { inboxBatchSchema } from "@/lib/schemas/inbox";
import { z } from "zod";

// Rate limiting simples em memória
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // 20 batch requests
const RATE_WINDOW = 60 * 1000; // por minuto

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

interface BatchResult {
  clientId?: string;
  serverId?: string;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  try {
    // Extrair token do header
    const authHeader = request.headers.get("Authorization");
    const token = extractBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      );
    }

    // Validar JWT
    const payload = validateApiToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }

    // Verificar se token não foi revogado
    const tokenRecord = await db.query.apiTokens.findFirst({
      where: and(
        eq(apiTokens.id, payload.tokenId),
        eq(apiTokens.userId, payload.sub),
        isNull(apiTokens.revokedAt)
      ),
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Token revogado ou não encontrado" },
        { status: 401 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(payload.sub)) {
      return NextResponse.json(
        { error: "Limite de requisições excedido", retryAfter: 60 },
        { status: 429 }
      );
    }

    // Validar body
    const body = await request.json();
    const { items } = inboxBatchSchema.parse(body);

    // Processar cada item
    const results: BatchResult[] = [];

    for (const item of items) {
      try {
        const [inserted] = await db
          .insert(inboxItems)
          .values({
            userId: payload.sub,
            sourceApp: item.sourceApp,
            sourceAppName: item.sourceAppName,
            deviceId: item.deviceId || payload.deviceId,
            originalTitle: item.originalTitle,
            originalText: item.originalText,
            notificationTimestamp: item.notificationTimestamp,
            parsedName: item.parsedName,
            parsedAmount: item.parsedAmount?.toString(),
            parsedDate: item.parsedDate,
            parsedCardLastDigits: item.parsedCardLastDigits,
            parsedTransactionType: item.parsedTransactionType,
            status: "pending",
          })
          .returning({ id: inboxItems.id });

        results.push({
          clientId: item.clientId,
          serverId: inserted.id,
          success: true,
        });
      } catch (error) {
        results.push({
          clientId: item.clientId,
          success: false,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    // Atualizar último uso do token
    await db
      .update(apiTokens)
      .set({
        lastUsedAt: new Date(),
        lastUsedIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })
      .where(eq(apiTokens.id, payload.tokenId));

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json(
      {
        message: `${successCount} notificações processadas${failCount > 0 ? `, ${failCount} falharam` : ""}`,
        total: items.length,
        success: successCount,
        failed: failCount,
        results,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }

    console.error("[API] Error creating batch inbox items:", error);
    return NextResponse.json(
      { error: "Erro ao processar notificações" },
      { status: 500 }
    );
  }
}
