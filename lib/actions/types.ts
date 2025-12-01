/**
 * Standard action result type
 */
export type ActionResult<TData = void> =
  | { success: true; message: string; data?: TData }
  | { success: false; error: string };

/**
 * Success result helper
 */
export function successResult<TData = void>(
  message: string,
  data?: TData
): ActionResult<TData> {
  return { success: true, message, data };
}

/**
 * Error result helper
 */
export function errorResult(error: string): ActionResult {
  return { success: false, error };
}
