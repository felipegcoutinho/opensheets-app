export const TRANSACAO_PENDENTE_STATUS = [
  "pendente",
  "processado",
  "ignorado",
] as const;

export const TRANSACAO_PENDENTE_TIPOS = [
  "debito",
  "credito",
  "pix",
  "transferencia",
] as const;

// Mapeamento de package names conhecidos
export const KNOWN_BANK_PACKAGES = {
  "com.nu.production": "Nubank",
  "br.com.intermedium": "Inter",
  "com.itau": "Itaú",
  "com.bradesco": "Bradesco",
  "com.santander": "Santander",
  "com.bb.android": "Banco do Brasil",
  "com.caixa": "Caixa",
  "com.picpay": "PicPay",
  "com.mercadopago": "Mercado Pago",
} as const;
