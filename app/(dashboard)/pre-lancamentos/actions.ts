"use server";

import { inboxItems } from "@/db/schema";
import { handleActionError } from "@/lib/actions/helpers";
import type { ActionResult } from "@/lib/actions/types";
import { getUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const markProcessedSchema = z.object({
  inboxItemId: z.string().uuid("ID do item inválido"),
});

const discardInboxSchema = z.object({
  inboxItemId: z.string().uuid("ID do item inválido"),
});

const bulkDiscardSchema = z.object({
  inboxItemIds: z.array(z.string().uuid()).min(1, "Selecione ao menos um item"),
});

function revalidateInbox() {
  revalidatePath("/pre-lancamentos");
  revalidatePath("/lancamentos");
  revalidatePath("/dashboard");
}

/**
 * Mark an inbox item as processed after a lancamento was created
 */
export async function markInboxAsProcessedAction(
  input: z.infer<typeof markProcessedSchema>,
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = markProcessedSchema.parse(input);

    // Verificar se item existe e pertence ao usuário
    const [item] = await db
      .select()
      .from(inboxItems)
      .where(
        and(
          eq(inboxItems.id, data.inboxItemId),
          eq(inboxItems.userId, user.id),
          eq(inboxItems.status, "pending"),
        ),
      )
      .limit(1);

    if (!item) {
      return { success: false, error: "Item não encontrado ou já processado." };
    }

    // Marcar item como processado
    await db
      .update(inboxItems)
      .set({
        status: "processed",
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inboxItems.id, data.inboxItemId));

    revalidateInbox();

    return { success: true, message: "Item processado com sucesso!" };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function discardInboxItemAction(
  input: z.infer<typeof discardInboxSchema>,
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = discardInboxSchema.parse(input);

    // Verificar se item existe e pertence ao usuário
    const [item] = await db
      .select()
      .from(inboxItems)
      .where(
        and(
          eq(inboxItems.id, data.inboxItemId),
          eq(inboxItems.userId, user.id),
          eq(inboxItems.status, "pending"),
        ),
      )
      .limit(1);

    if (!item) {
      return { success: false, error: "Item não encontrado ou já processado." };
    }

    // Marcar item como descartado
    await db
      .update(inboxItems)
      .set({
        status: "discarded",
        discardedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inboxItems.id, data.inboxItemId));

    revalidateInbox();

    return { success: true, message: "Item descartado." };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkDiscardInboxItemsAction(
  input: z.infer<typeof bulkDiscardSchema>,
): Promise<ActionResult> {
  try {
    const user = await getUser();
    const data = bulkDiscardSchema.parse(input);

    // Marcar todos os itens como descartados
    await db
      .update(inboxItems)
      .set({
        status: "discarded",
        discardedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(inboxItems.id, data.inboxItemIds),
          eq(inboxItems.userId, user.id),
          eq(inboxItems.status, "pending"),
        ),
      );

    revalidateInbox();

    return {
      success: true,
      message: `${data.inboxItemIds.length} item(s) descartado(s).`,
    };
  } catch (error) {
    return handleActionError(error);
  }
}
