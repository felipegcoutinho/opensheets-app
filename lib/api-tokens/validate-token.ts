import { db } from "@/lib/db";
import { apiTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  hashToken,
  isValidTokenFormat,
  isTokenExpired,
  isTokenRevoked,
} from "./token-utils";

/**
 * Resultado da validação do token
 */
export type TokenValidationResult =
  | { valid: true; userId: string; tokenId: string }
  | {
      valid: false;
      reason:
        | "invalid_format"
        | "not_found"
        | "expired"
        | "revoked"
        | "error";
    };

/**
 * Valida um token de API e retorna o userId se válido
 * Esta função é usada pela API para autenticar requests
 */
export async function validateApiToken(
  token: string
): Promise<TokenValidationResult> {
  try {
    // 1. Validar formato
    if (!isValidTokenFormat(token)) {
      return { valid: false, reason: "invalid_format" };
    }

    // 2. Hash do token para buscar no banco
    const tokenHash = hashToken(token);

    // 3. Buscar token no banco
    const tokenRecord = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.token, tokenHash))
      .limit(1);

    if (tokenRecord.length === 0) {
      return { valid: false, reason: "not_found" };
    }

    const record = tokenRecord[0];

    // 4. Verificar se foi revogado
    if (isTokenRevoked(record.revokedAt)) {
      return { valid: false, reason: "revoked" };
    }

    // 5. Verificar expiração
    if (isTokenExpired(record.expiresAt)) {
      return { valid: false, reason: "expired" };
    }

    // 6. Token válido! Atualizar lastUsedAt
    await db
      .update(apiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiTokens.id, record.id));

    return {
      valid: true,
      userId: record.userId,
      tokenId: record.id,
    };
  } catch (error) {
    console.error("Error validating API token:", error);
    return { valid: false, reason: "error" };
  }
}

/**
 * Extrai token do header Authorization
 * Formato esperado: "Bearer os_xxxxxxxxxx"
 */
export function extractTokenFromHeader(
  authHeader: string | null
): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;
  if (scheme.toLowerCase() !== "bearer") return null;

  return token;
}
