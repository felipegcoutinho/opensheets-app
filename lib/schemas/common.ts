import { z } from "zod";

/**
 * Common Zod schemas for reuse across the application
 */

/**
 * UUID schema with custom error message
 */
export const uuidSchema = (entityName: string = "ID") =>
  z.string({ message: `${entityName} inválido.` }).uuid(`${entityName} inválido.`);

/**
 * Decimal string schema - parses string with comma/period to number
 */
export const decimalSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s/g, "").replace(",", "."))
  .refine(
    (value) => !Number.isNaN(Number.parseFloat(value)),
    "Informe um valor numérico válido."
  )
  .transform((value) => Number.parseFloat(value));

/**
 * Optional/nullable decimal string schema
 */
export const optionalDecimalSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) =>
    value && value.length > 0 ? value.replace(",", ".") : null
  )
  .refine(
    (value) => value === null || !Number.isNaN(Number.parseFloat(value)),
    "Informe um valor numérico válido."
  )
  .transform((value) => (value === null ? null : Number.parseFloat(value)));

/**
 * Day of month schema (1-31)
 */
export const dayOfMonthSchema = z
  .string({ message: "Informe o dia." })
  .trim()
  .min(1, "Informe o dia.")
  .refine((value) => {
    const parsed = Number.parseInt(value, 10);
    return !Number.isNaN(parsed) && parsed >= 1 && parsed <= 31;
  }, "Informe um dia entre 1 e 31.");

  
export const optionalDayOfMonthSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => {
    if (!value) return true;
    const parsed = Number.parseInt(value, 10);
    return !Number.isNaN(parsed) && parsed >= 1 && parsed <= 31;
  }, "Informe um dia entre 1 e 31.");

/**
 * Period schema (YYYY-MM format)
 */
export const periodSchema = z
  .string({ message: "Informe o período." })
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Período inválido.");

/**
 * Optional period schema
 */
export const optionalPeriodSchema = z
  .string()
  .trim()
  .regex(/^(\d{4})-(\d{2})$/, {
    message: "Selecione um período válido.",
  })
  .optional();

/**
 * Date string schema
 */
export const dateStringSchema = z
  .string({ message: "Informe a data." })
  .trim()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Data inválida.",
  });

/**
 * Optional date string schema
 */
export const optionalDateStringSchema = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: "Informe uma data válida.",
  })
  .optional();

/**
 * Note/observation schema (max 500 chars, trimmed, nullable)
 */
export const noteSchema = z
  .string()
  .trim()
  .max(500, "A anotação deve ter no máximo 500 caracteres.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

/**
 * Optional string that becomes null if empty
 */
export const optionalStringToNull = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

/**
 * Required non-empty string schema
 */
export const requiredStringSchema = (fieldName: string) =>
  z
    .string({ message: `Informe ${fieldName}.` })
    .trim()
    .min(1, `Informe ${fieldName}.`);

/**
 * Amount schema with minimum value validation
 */
export const amountSchema = z.coerce
  .number({ message: "Informe o valor." })
  .min(0, "Informe um valor maior ou igual a zero.");

/**
 * Positive amount schema
 */
export const positiveAmountSchema = z.coerce
  .number({ message: "Informe o valor." })
  .positive("Informe um valor maior que zero.");
