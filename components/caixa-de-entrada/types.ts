/**
 * Types for Caixa de Entrada (Inbox) feature
 */

import type { SelectOption as LancamentoSelectOption } from "@/components/lancamentos/types";

export interface InboxItem {
  id: string;
  sourceApp: string;
  sourceAppName: string | null;
  deviceId: string | null;
  originalTitle: string | null;
  originalText: string;
  notificationTimestamp: Date;
  parsedName: string | null;
  parsedAmount: string | null;
  parsedDate: Date | null;
  parsedTransactionType: string | null;
  status: string;
  lancamentoId: string | null;
  processedAt: Date | null;
  discardedAt: Date | null;
  discardReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessInboxInput {
  inboxItemId: string;
  name: string;
  amount: number;
  purchaseDate: string;
  transactionType: "Despesa" | "Receita";
  condition: string;
  paymentMethod: string;
  categoriaId: string;
  contaId?: string;
  cartaoId?: string;
  note?: string;
}

export interface DiscardInboxInput {
  inboxItemId: string;
  reason?: string;
}

// Re-export the lancamentos SelectOption for use in inbox components
export type SelectOption = LancamentoSelectOption;
