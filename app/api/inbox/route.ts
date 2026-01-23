/**
 * POST /api/inbox
 *
 * Recebe uma notificação do app Android.
 * Requer autenticação via API token.
 */

import { validateApiToken, extractBearerToken } from "@/lib/auth/api-token";
import { db } from "@/lib/db";
import { apiTokens, inboxItems } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { inboxItemSchema } from "@/lib/schemas/inbox";
import { z } from "zod";

// Rate limiting simples em memória (em produção, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // 100 requests
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
    const data = inboxItemSchema.parse(body);

    // Inserir item na inbox
    const [inserted] = await db
      .insert(inboxItems)
      .values({
        userId: payload.sub,
        sourceApp: data.sourceApp,
        sourceAppName: data.sourceAppName,
        deviceId: data.deviceId || payload.deviceId,
        originalTitle: data.originalTitle,
        originalText: data.originalText,
        notificationTimestamp: data.notificationTimestamp,
        parsedName: data.parsedName,
        parsedAmount: data.parsedAmount?.toString(),
        parsedDate: data.parsedDate,
        parsedCardLastDigits: data.parsedCardLastDigits,
        parsedTransactionType: data.parsedTransactionType,
        status: "pending",
      })
      .returning({ id: inboxItems.id });

    // Atualizar último uso do token
    await db
      .update(apiTokens)
      .set({
        lastUsedAt: new Date(),
        lastUsedIp: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      })
      .where(eq(apiTokens.id, payload.tokenId));

    return NextResponse.json(
      {
        id: inserted.id,
        clientId: data.clientId,
        message: "Notificação recebida",
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

    console.error("[API] Error creating inbox item:", error);
    return NextResponse.json(
      { error: "Erro ao processar notificação" },
      { status: 500 }
    );
  }
}
