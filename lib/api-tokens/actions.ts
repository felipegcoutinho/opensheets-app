"use server";

import { db } from "@/lib/db";
import { apiTokens } from "@/db/schema";
import { getUser } from "@/lib/auth/server";
import { eq, and, isNull } from "drizzle-orm";
import { generateApiToken, hashToken, maskToken } from "./token-utils";
import type { ActionResult } from "@/lib/actions/types";
import { successResult, errorResult } from "@/lib/actions/types";
import { handleActionError } from "@/lib/actions/helpers";
import { z } from "zod";

/**
 * Schema de validação para criação de token
 */
const createTokenSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .max(50, "Nome deve ter no máximo 50 caracteres"),
  expiresInDays: z.number().int().positive().optional(),
});

/**
 * Cria um novo token de API para o usuário
 */
export async function createApiToken(input: {
  name: string;
  expiresInDays?: number;
}): Promise<
  ActionResult<{ token: string; tokenId: string; maskedToken: string }>
> {
  try {
    const user = await getUser();
    const validated = createTokenSchema.parse(input);

    // Gerar token (plaintext - mostraremos apenas uma vez)
    const token = generateApiToken();

    // Hash para armazenar no banco
    const tokenHash = hashToken(token);

    // Calcular expiração se fornecida
    let expiresAt: Date | null = null;
    if (validated.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validated.expiresInDays);
    }

    // Inserir no banco
    const result = await db
      .insert(apiTokens)
      .values({
        userId: user.id,
        name: validated.name,
        token: tokenHash, // Armazenar hash, não plaintext!
        expiresAt,
      })
      .returning({ id: apiTokens.id });

    const tokenId = result[0].id;

    // Retornar token plaintext (ÚNICA VEZ que usuário verá)
    return successResult("Token criado com sucesso!", {
      token,
      tokenId,
      maskedToken: maskToken(token),
    });
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Lista todos os tokens do usuário (sem mostrar o token plaintext)
 */
export async function listApiTokens(): Promise<
  ActionResult<
    Array<{
      id: string;
      name: string;
      createdAt: Date;
      lastUsedAt: Date | null;
      expiresAt: Date | null;
      revokedAt: Date | null;
    }>
  >
> {
  try {
    const user = await getUser();

    const tokens = await db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        createdAt: apiTokens.createdAt,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        revokedAt: apiTokens.revokedAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, user.id))
      .orderBy(apiTokens.createdAt);

    return successResult("Tokens carregados", tokens);
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Revoga um token (marca como revoked, não deleta)
 */
export async function revokeApiToken(
  tokenId: string
): Promise<ActionResult<void>> {
  try {
    const user = await getUser();

    // Verificar se o token pertence ao usuário
    const token = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, user.id)))
      .limit(1);

    if (token.length === 0) {
      return errorResult("Token não encontrado");
    }

    // Marcar como revogado
    await db
      .update(apiTokens)
      .set({ revokedAt: new Date() })
      .where(eq(apiTokens.id, tokenId));

    return successResult("Token revogado com sucesso");
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Deleta permanentemente um token
 */
export async function deleteApiToken(
  tokenId: string
): Promise<ActionResult<void>> {
  try {
    const user = await getUser();

    // Verificar se o token pertence ao usuário
    const token = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, user.id)))
      .limit(1);

    if (token.length === 0) {
      return errorResult("Token não encontrado");
    }

    // Deletar permanentemente
    await db.delete(apiTokens).where(eq(apiTokens.id, tokenId));

    return successResult("Token deletado com sucesso");
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Restaura um token revogado (remove flag de revoked)
 */
export async function restoreApiToken(
  tokenId: string
): Promise<ActionResult<void>> {
  try {
    const user = await getUser();

    // Verificar se o token pertence ao usuário e está revogado
    const token = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, user.id)))
      .limit(1);

    if (token.length === 0) {
      return errorResult("Token não encontrado");
    }

    if (!token[0].revokedAt) {
      return errorResult("Token não está revogado");
    }

    // Remover flag de revogado
    await db
      .update(apiTokens)
      .set({ revokedAt: null })
      .where(eq(apiTokens.id, tokenId));

    return successResult("Token restaurado com sucesso");
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Conta quantos tokens ativos o usuário possui
 */
export async function countActiveTokens(): Promise<ActionResult<number>> {
  try {
    const user = await getUser();

    const result = await db
      .select({ id: apiTokens.id })
      .from(apiTokens)
      .where(
        and(
          eq(apiTokens.userId, user.id),
          isNull(apiTokens.revokedAt)
        )
      );

    return successResult("Contagem realizada", result.length);
  } catch (error) {
    return handleActionError(error);
  }
}
