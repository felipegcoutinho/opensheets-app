"use server";

import { lancamentos, transacoesPendentes } from "@/db/schema";
import { handleActionError, revalidateForEntity } from "@/lib/actions/helpers";
import {
  errorResult,
  successResult,
  type ActionResult,
} from "@/lib/actions/types";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import {
  editarTransacaoPendenteSchema,
  processarTransacaoSchema,
} from "@/lib/schemas/transacoes-pendentes";
import { and, eq } from "drizzle-orm";

/**
 * Revalidate helper para transações pendentes
 */
const revalidate = () => {
  revalidateForEntity("transacoesPendentes");
  revalidateForEntity("lancamentos");
};

/**
 * Process pending transaction and convert to lancamento
 */
export async function processarTransacaoPendente(
  pendenteId: string,
  dadosEditados: unknown
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const validated = processarTransacaoSchema.parse(dadosEditados);

    // Buscar transação pendente
    const pendente = await db.query.transacoesPendentes.findFirst({
      where: and(
        eq(transacoesPendentes.id, pendenteId),
        eq(transacoesPendentes.userId, user.id)
      ),
    });

    if (!pendente) {
      return errorResult("Transação pendente não encontrada");
    }

    if (pendente.status !== "pendente") {
      return errorResult("Esta transação já foi processada");
    }

    // Determinar tipo de lançamento baseado no tipo de transação
    let tipoLancamento = "Despesa";
    if (pendente.tipoTransacao === "credito") {
      tipoLancamento = "Receita";
    } else if (pendente.tipoTransacao === "transferencia") {
      tipoLancamento = "Transferência";
    }

    // Criar lançamento
    const [lancamento] = await db
      .insert(lancamentos)
      .values({
        userId: user.id,
        name: validated.descricaoEditada,
        amount: validated.valor.toString(),
        purchaseDate: new Date(validated.data),
        transactionType: tipoLancamento,
        paymentMethod:
          pendente.tipoTransacao === "pix"
            ? "Pix"
            : validated.cartaoId
            ? "Cartão de crédito"
            : "Transferência bancária",
        condition: "À vista",
        isSettled: true,
        categoriaId: validated.categoriaId,
        contaId: validated.contaId ?? null,
        cartaoId: validated.cartaoId ?? null,
        pagadorId: validated.pagadorId ?? null,
        note: validated.observacoes ?? null,
        period: new Date(validated.data).toISOString().slice(0, 7), // YYYY-MM
      })
      .returning();

    // Atualizar transação pendente
    await db
      .update(transacoesPendentes)
      .set({
        status: "processado",
        processadoEm: new Date(),
        lancamentoId: lancamento.id,
        categoriaId: validated.categoriaId,
        contaId: validated.contaId ?? null,
        cartaoId: validated.cartaoId ?? null,
        pagadorId: validated.pagadorId ?? null,
        descricaoEditada: validated.descricaoEditada,
        observacoes: validated.observacoes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(transacoesPendentes.id, pendenteId));

    revalidate();
    return successResult("Transação processada com sucesso!");
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Mark pending transaction as ignored
 */
export async function ignorarTransacaoPendente(
  pendenteId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();

    const pendente = await db.query.transacoesPendentes.findFirst({
      where: and(
        eq(transacoesPendentes.id, pendenteId),
        eq(transacoesPendentes.userId, user.id)
      ),
    });

    if (!pendente) {
      return errorResult("Transação pendente não encontrada");
    }

    await db
      .update(transacoesPendentes)
      .set({
        status: "ignorado",
        processadoEm: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(transacoesPendentes.id, pendenteId));

    revalidate();
    return successResult("Transação ignorada");
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Edit pending transaction fields
 */
export async function editarTransacaoPendente(
  pendenteId: string,
  dados: unknown
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const validated = editarTransacaoPendenteSchema.parse(dados);

    const pendente = await db.query.transacoesPendentes.findFirst({
      where: and(
        eq(transacoesPendentes.id, pendenteId),
        eq(transacoesPendentes.userId, user.id)
      ),
    });

    if (!pendente) {
      return errorResult("Transação pendente não encontrada");
    }

    if (pendente.status !== "pendente") {
      return errorResult("Não é possível editar uma transação já processada");
    }

    await db
      .update(transacoesPendentes)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(transacoesPendentes.id, pendenteId));

    revalidate();
    return successResult("Transação atualizada");
  } catch (error) {
    return handleActionError(error);
  }
}

/**
 * Delete pending transaction
 */
export async function excluirTransacaoPendente(
  pendenteId: string
): Promise<ActionResult> {
  try {
    const user = await getUser();

    const pendente = await db.query.transacoesPendentes.findFirst({
      where: and(
        eq(transacoesPendentes.id, pendenteId),
        eq(transacoesPendentes.userId, user.id)
      ),
    });

    if (!pendente) {
      return errorResult("Transação pendente não encontrada");
    }

    await db
      .delete(transacoesPendentes)
      .where(eq(transacoesPendentes.id, pendenteId));

    revalidate();
    return successResult("Transação excluída");
  } catch (error) {
    return handleActionError(error);
  }
}
