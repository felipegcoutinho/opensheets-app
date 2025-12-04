import { z } from "zod";
import {
  uuidSchema,
  amountSchema,
  requiredStringSchema,
  noteSchema,
} from "./common";

export const notificacaoBancariaSchema = z.object({
  appPackageName: requiredStringSchema("o package do app"),
  appName: requiredStringSchema("o nome do app"),
  notificationText: requiredStringSchema("o texto da notificação"),
  notificationTitle: z.string().optional(),
  // Campos opcionais já parseados pelo Android (se disponíveis)
  valor: z.coerce.number().optional(),
  estabelecimento: z.string().optional(),
  dataHoraTransacao: z.string().optional(),
  tipoTransacao: z
    .enum(["debito", "credito", "pix", "transferencia"])
    .optional(),
});

export const processarTransacaoSchema = z
  .object({
    descricaoEditada: requiredStringSchema("a descrição"),
    valor: amountSchema,
    data: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Data inválida",
    }),
    categoriaId: uuidSchema("Categoria"),
    contaId: uuidSchema("Conta").optional(),
    cartaoId: uuidSchema("Cartão").optional(),
    pagadorId: uuidSchema("Pagador").optional(),
    observacoes: noteSchema,
  })
  .refine((data) => data.contaId || data.cartaoId, {
    message: "Selecione uma conta ou cartão",
    path: ["contaId"],
  });

export const editarTransacaoPendenteSchema = z.object({
  categoriaId: uuidSchema("Categoria").optional(),
  contaId: uuidSchema("Conta").optional(),
  cartaoId: uuidSchema("Cartão").optional(),
  pagadorId: uuidSchema("Pagador").optional(),
  descricaoEditada: z.string().optional(),
  observacoes: noteSchema,
});

export type NotificacaoBancaria = z.infer<typeof notificacaoBancariaSchema>;
export type ProcessarTransacaoInput = z.infer<typeof processarTransacaoSchema>;
export type EditarTransacaoPendenteInput = z.infer<
  typeof editarTransacaoPendenteSchema
>;
