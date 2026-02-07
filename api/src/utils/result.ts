import { Err, Ok, Result } from 'ts-results-es';

/**
 * Wraps an asynchronous operation in a Result pattern, capturing and standardizing errors.
 *
 * This is the primary mechanism for explicit error handling across the application,
 * ensuring that all IO-bound or fallible logic returns a predictable Result type.
 *
 * @template T
 * @param {() => Promise<T>} fn - The asynchronous function to execute.
 * @returns {Promise<Result<T, Error>>} An Ok result containing the data, or an Err containing a standardized Error object.
 *
 * @example
 * const result = await wrapAsync(() => fetch('...').then(r => r.json()));
 * if (result.isOk()) {
 *   console.log('Data:', result.value);
 * } else {
 *   console.error('Failed:', result.error.message);
 * }
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
 * Standardizes a string or Error into a consistent Error object.
 *
 * @param {string | Error} msg - The error message or instance.
 * @returns {Error} A standardized Error object.
 */
export function toError(msg: string | Error): Error {
  return msg instanceof Error ? msg : new Error(msg);
}
