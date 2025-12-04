import { KNOWN_BANK_PACKAGES } from "./constants";

interface ParsedNotification {
  valor?: number;
  estabelecimento?: string;
  tipoTransacao?: "debito" | "credito" | "pix" | "transferencia";
}

/**
 * Parse notification text to extract transaction data
 * Supports Brazilian currency format (R$ 123,45 ou R$ 1.234,56)
 */
export function parseNotificationText(
  text: string,
  title?: string
): ParsedNotification {
  const result: ParsedNotification = {};

  // Parser de valor: R$ 123,45 ou R$ 1.234,56
  const valorMatch = text.match(/R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/);
  if (valorMatch) {
    const valorStr = valorMatch[1].replace(/\./g, "").replace(",", ".");
    result.valor = parseFloat(valorStr);
  }

  // Parser de estabelecimento (após "em", "para", "no", "na")
  const estabelecimentoMatch = text.match(
    /(?:em|para|no|na)\s+([A-Za-zÀ-ú0-9\s]+?)(?:\s+no valor|\s+R\$|$)/i
  );
  if (estabelecimentoMatch) {
    result.estabelecimento = estabelecimentoMatch[1].trim();
  }

  // Detecção de tipo por palavras-chave
  const textLower = text.toLowerCase();
  if (textLower.includes("pix")) {
    result.tipoTransacao = "pix";
  } else if (
    textLower.includes("débito") ||
    textLower.includes("debito")
  ) {
    result.tipoTransacao = "debito";
  } else if (
    textLower.includes("crédito") ||
    textLower.includes("credito")
  ) {
    result.tipoTransacao = "credito";
  } else if (
    textLower.includes("transferência") ||
    textLower.includes("transferencia")
  ) {
    result.tipoTransacao = "transferencia";
  }

  return result;
}

/**
 * Sanitize notification text to prevent XSS and injection attacks
 */
export function sanitizeNotificationText(text: string): string {
  return (
    text
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove dangerous characters
      .replace(/[<>]/g, "")
      // Trim whitespace
      .trim()
  );
}

/**
 * Get friendly bank name from package name
 */
export function getBankName(packageName: string): string {
  return (
    KNOWN_BANK_PACKAGES[
      packageName as keyof typeof KNOWN_BANK_PACKAGES
    ] || packageName
  );
}
