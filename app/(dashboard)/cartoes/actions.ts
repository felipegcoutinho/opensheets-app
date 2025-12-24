"use server";

import { cartoes, contas } from "@/db/schema";
import { type ActionResult } from "@/lib/actions/types";
import { handleActionError } from "@/lib/actions/helpers";
import { revalidateForEntity } from "@/lib/actions/helpers";
import {
  optionalDayOfMonthSchema,
  noteSchema,
  optionalDecimalSchema,
  uuidSchema,
} from "@/lib/schemas/common";
import { formatDecimalForDb } from "@/lib/utils/currency";
import { normalizeFilePath } from "@/lib/utils/string";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth/server";
import { and, eq, is } from "drizzle-orm";
import { z } from "zod";

const cardBaseObject = z.object({
  name: z
    .string({ message: "Informe o nome do cartão." })
    .trim()
    .min(1, "Informe o nome do cartão."),
  brand: z
    .string({ message: "Informe a bandeira." })
    .trim()
    .min(1, "Informe a bandeira."),
  status: z
    .string({ message: "Informe o status do cartão." })
    .trim()
    .min(1, "Informe o status do cartão."),
  isPrePaid: z
    .string({ message: "Informe se o cartão é pré pago." })
    .transform((val) => val === "true"),
  closingDay: optionalDayOfMonthSchema,
  dueDay: optionalDayOfMonthSchema,
  note: noteSchema,
  limit: optionalDecimalSchema,
  logo: z
    .string({ message: "Selecione um logo." })
    .trim()
    .min(1, "Selecione um logo."),
  contaId: uuidSchema("Conta"),
});

const cardBaseSchema = cardBaseObject.refine((data) => {
  if (!data.isPrePaid) {
    return data.closingDay && data.dueDay;
  }
  return true;
}, {
  message: "Para cartões não pré-pagos, informe o dia de fechamento e vencimento.",
  path: ["closingDay"],
});

const createCardSchema = cardBaseSchema;
const updateCardSchema = cardBaseObject.extend({
  id: uuidSchema("Cartão"),
}).refine((data) => {
  if (!data.isPrePaid) {
    return data.closingDay && data.dueDay;
  }
  return true;
}, {
  message: "Para cartões não pré-pagos, informe o dia de fechamento e vencimento.",
  path: ["closingDay"],
});
const deleteCardSchema = z.object({
  id: uuidSchema("Cartão"),
});

type CardCreateInput = z.infer<typeof createCardSchema>;
type CardUpdateInput = z.infer<typeof updateCardSchema>;
type CardDeleteInput = z.infer<typeof deleteCardSchema>;

async function assertAccountOwnership(userId: string, contaId: string) {
  const account = await db.query.contas.findFirst({
    columns: { id: true },
    where: and(eq(contas.id, contaId), eq(contas.userId, userId)),
  });

  if (!account) {
    throw new Error("Conta vinculada não encontrada.");
  }
}

export async function createCardAction(
  input: CardCreateInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = createCardSchema.parse(input);

    await assertAccountOwnership(user.id, data.contaId);

    const logoFile = normalizeFilePath(data.logo);

    await db.insert(cartoes).values({
      name: data.name,
      brand: data.brand,
      status: data.status,
      closingDay: data.isPrePaid ? null : data.closingDay,
      dueDay: data.isPrePaid ? null : data.dueDay,
      note: data.note ?? null,
      limit: data.isPrePaid ? null : formatDecimalForDb(data.limit),
      logo: logoFile,
      contaId: data.contaId,
      userId: user.id,
      isPrePaid: data.isPrePaid,
    });

    revalidateForEntity("cartoes");

    return { success: true, message: "Cartão criado com sucesso." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCardAction(
  input: CardUpdateInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = updateCardSchema.parse(input);

    await assertAccountOwnership(user.id, data.contaId);

    const logoFile = normalizeFilePath(data.logo);

    const [updated] = await db
      .update(cartoes)
      .set({
        name: data.name,
        brand: data.brand,
        status: data.status,
        closingDay: data.isPrePaid ? null : data.closingDay,
        dueDay: data.isPrePaid ? null : data.dueDay,
        note: data.note ?? null,
        limit: data.isPrePaid ? null : formatDecimalForDb(data.limit),
        logo: logoFile,
        contaId: data.contaId,
      })
      .where(and(eq(cartoes.id, data.id), eq(cartoes.userId, user.id)))
      .returning();

    if (!updated) {
      return {
        success: false,
        error: "Cartão não encontrado.",
      };
    }

    revalidateForEntity("cartoes");

    return { success: true, message: "Cartão atualizado com sucesso." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteCardAction(
  input: CardDeleteInput
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = deleteCardSchema.parse(input);

    const [deleted] = await db
      .delete(cartoes)
      .where(and(eq(cartoes.id, data.id), eq(cartoes.userId, user.id)))
      .returning({ id: cartoes.id });

    if (!deleted) {
      return {
        success: false,
        error: "Cartão não encontrado.",
      };
    }

    revalidateForEntity("cartoes");

    return { success: true, message: "Cartão removido com sucesso." };
  } catch (error) {
    return handleActionError(error);
  }
}
