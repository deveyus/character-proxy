import { Err, Ok, Result } from 'ts-results-es';

/**
 * Wraps an async operation in a Result pattern, capturing any errors.
 */
export async function wrapAsync<T>(
  fn: () => Promise<T>,
): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return Ok(data);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Standardizes error creation for consistent result patterns.
 */
export function toError(msg: string | Error): Error {
  return msg instanceof Error ? msg : new Error(msg);
}
