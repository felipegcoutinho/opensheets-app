import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { transacoesPendentes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notificacaoBancariaSchema } from "@/lib/schemas/transacoes-pendentes";
import {
  parseNotificationText,
  sanitizeNotificationText,
} from "@/lib/transacoes-pendentes/parser";
import { z } from "zod";
import {
  validateApiToken,
  extractTokenFromHeader,
} from "@/lib/api-tokens/validate-token";

/**
 * Autentica request via sessão (cookie) ou API token (header)
 */
async function authenticateRequest(): Promise<{
  authenticated: boolean;
  userId?: string;
}> {
  // 1. Tentar autenticar via API Token (header Authorization)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader) {
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const validation = await validateApiToken(token);
      if (validation.valid) {
        return { authenticated: true, userId: validation.userId };
      }
    }
  }

  // 2. Fallback: Tentar autenticar via sessão (cookie)
  const session = await auth.api.getSession({ headers: headersList });
  if (session?.user) {
    return { authenticated: true, userId: session.user.id };
  }

  return { authenticated: false };
}

/**
 * POST /api/transacoes-pendentes
 * Receive notification from Android app
 * Authentication: API Token (Bearer) ou Session Cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticar (API Token ou Session)
    const { authenticated, userId } = await authenticateRequest();

    if (!authenticated || !userId) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Validar body
    const body = await request.json();
    const validated = notificacaoBancariaSchema.parse(body);

    // Sanitizar texto para prevenir XSS
    const notificationText = sanitizeNotificationText(
      validated.notificationText
    );

    // Parsear notificação para extrair dados estruturados
    const parsed = parseNotificationText(
      notificationText,
      validated.notificationTitle
    );

    // Inserir no banco de dados
    const [created] = await db
      .insert(transacoesPendentes)
      .values({
        userId, // Usar userId da autenticação (token ou sessão)
        appPackageName: validated.appPackageName,
        appName: validated.appName,
        notificationText,
        notificationTitle: validated.notificationTitle ?? null,
        valor: parsed.valor?.toString() ?? null,
        estabelecimento: parsed.estabelecimento ?? null,
        tipoTransacao: parsed.tipoTransacao ?? null,
        status: "pendente",
      })
      .returning();

    return NextResponse.json(
      { success: true, data: created },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message ?? "Dados inválidos",
        },
        { status: 400 }
      );
    }

    console.error("[API] POST /api/transacoes-pendentes error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transacoes-pendentes
 * List all pending transactions for the authenticated user
 * Authentication: API Token (Bearer) ou Session Cookie
 */
export async function GET() {
  try {
    // Autenticar (API Token ou Session)
    const { authenticated, userId } = await authenticateRequest();

    if (!authenticated || !userId) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const transacoes = await db
      .select()
      .from(transacoesPendentes)
      .where(eq(transacoesPendentes.userId, userId))
      .orderBy(desc(transacoesPendentes.createdAt));

    return NextResponse.json(
      { success: true, data: transacoes },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] GET /api/transacoes-pendentes error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
