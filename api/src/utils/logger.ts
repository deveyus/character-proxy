import * as log from 'std/log/mod.ts';

/**
 * Valid log tags for categorizing system events.
 */
export type LogTag = 'ESI' | 'DB' | 'CACHE' | 'SYSTEM' | 'AUTH';

/**
 * Custom formatter for OTel-ready JSON logs.
 *
 * @param {log.LogRecord} record - The log record to format.
 * @returns {string} A JSON string representation of the log.
 */
function jsonFormatter(record: log.LogRecord): string {
  return JSON.stringify({
    timestamp: record.datetime.toISOString(),
    level: record.levelName,
    tag: record.loggerName,
    message: record.msg,
    // Include any extra arguments as attributes
    ...(record.args.length > 0 ? { attributes: record.args } : {}),
  });
}

/**
 * Custom formatter for human-readable pretty logs.
 *
 * @param {log.LogRecord} record - The log record to format.
 * @returns {string} A human-readable string representation of the log.
 */
function prettyFormatter(record: log.LogRecord): string {
  let msg =
    `[${record.datetime.toISOString()}] [${record.levelName}] [${record.loggerName}] ${record.msg}`;
  if (record.args.length > 0) {
    msg += ` | attributes: ${JSON.stringify(record.args)}`;
  }
  return msg;
}

const logFormat = Deno.env.get('LOG_FORMAT') || 'pretty';

/**
 * Initializes the global Deno logging system.
 *
 * Side-Effects: Configures the global `std/log` instance with custom handlers and loggers.
 */
export async function setupLogger() {
  await log.setup({
    handlers: {
      console: new log.ConsoleHandler('DEBUG', {
        formatter: logFormat === 'json' ? jsonFormatter : prettyFormatter,
      }),
    },
    loggers: {
      default: {
        level: 'INFO',
        handlers: ['console'],
      },
      ESI: {
        level: 'DEBUG',
        handlers: ['console'],
      },
      DB: {
        level: 'INFO',
        handlers: ['console'],
      },
      CACHE: {
        level: 'INFO',
        handlers: ['console'],
      },
      SYSTEM: {
        level: 'INFO',
        handlers: ['console'],
      },
      AUTH: {
        level: 'INFO',
        handlers: ['console'],
      },
    },
  });
}

/**
 * Typed logger wrapper to maintain consistent usage across the project.
 *
 * Arguments provided after the message are treated as structured attributes
 * and are serialized according to the active `LOG_FORMAT`.
 */
export const logger = {
  /**
   * Logs an informational message.
   *
   * @param {LogTag} tag - Category of the event.
   * @param {string} msg - Primary log message.
   * @param {...Record<string, unknown>[]} args - Additional structured metadata.
   */
  info: (tag: LogTag, msg: string, ...args: Record<string, unknown>[]) =>
    log.getLogger(tag).info(msg, ...args),

  /**
   * Logs a warning message.
   *
   * @param {LogTag} tag - Category of the event.
   * @param {string} msg - Primary log message.
   * @param {...Record<string, unknown>[]} args - Additional structured metadata.
   */
  warn: (tag: LogTag, msg: string, ...args: Record<string, unknown>[]) =>
    log.getLogger(tag).warn(msg, ...args),

  /**
   * Logs an error message.
   *
   * @param {LogTag} tag - Category of the event.
   * @param {string} msg - Primary log message.
   * @param {...Record<string, unknown>[]} args - Additional structured metadata.
   */
  error: (tag: LogTag, msg: string, ...args: Record<string, unknown>[]) =>
    log.getLogger(tag).error(msg, ...args),

  /**
   * Logs a debug message.
   * Note: ESI debug logs are only visible if the handler level is set to DEBUG.
   *
   * @param {LogTag} tag - Category of the event.
   * @param {string} msg - Primary log message.
   * @param {...Record<string, unknown>[]} args - Additional structured metadata.
   */
  debug: (tag: LogTag, msg: string, ...args: Record<string, unknown>[]) =>
    log.getLogger(tag).debug(msg, ...args),
};
