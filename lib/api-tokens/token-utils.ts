import crypto from "crypto";

/**
 * Gera um token seguro de API
 * Formato: os_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (префикс + 36 caracteres)
 */
export function generateApiToken(): string {
  // Prefixo para identificar tokens do OpenSheets
  const prefix = "os_";

  // Gera 32 bytes aleatórios (256 bits) e converte para hex
  const randomBytes = crypto.randomBytes(32);
  const tokenBody = randomBytes.toString("hex");

  return prefix + tokenBody;
}

/**
 * Cria hash SHA-256 do token para armazenar no banco
 * Nunca armazenamos tokens em plaintext no banco!
 */
export function hashToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * Valida formato do token
 */
export function isValidTokenFormat(token: string): boolean {
  // Token deve ter prefixo os_ seguido de 64 caracteres hex
  const tokenRegex = /^os_[a-f0-9]{64}$/;
  return tokenRegex.test(token);
}

/**
 * Verifica se o token está dentro do prazo de validade
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false; // Sem expiração = nunca expira
  return new Date() > expiresAt;
}

/**
 * Verifica se o token foi revogado
 */
export function isTokenRevoked(revokedAt: Date | null): boolean {
  return revokedAt !== null;
}

/**
 * Mascara o token para exibição segura
 * Exemplo: os_abc...xyz (mostra apenas prefixo e últimos 3 caracteres)
 */
export function maskToken(token: string): string {
  if (token.length < 10) return "***";
  const prefix = token.slice(0, 3); // "os_"
  const suffix = token.slice(-3);    // últimos 3 chars
  return `${prefix}...${suffix}`;
}
