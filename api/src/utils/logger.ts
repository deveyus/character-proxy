import * as log from 'std/log/mod.ts';

export type LogTag = 'ESI' | 'DB' | 'CACHE' | 'SYSTEM' | 'AUTH';

/**
 * Custom formatter for OTel-ready JSON logs.
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
 * Initializes the global logging system.
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
 * Typed logger wrapper to maintain consistent usage.
 * Arguments are treated as structured attributes.
 */
export const logger = {
  info: (tag: LogTag, msg: string, ...args: Record<string, unknown>[]) =>
    log.getLogger(tag).info(msg, ...args),
  warn: (tag: LogTag, msg: string, ...args: Record<string, unknown>[]) =>
    log.getLogger(tag).warn(msg, ...args),
  error: (tag: LogTag, msg: string, ...args: Record<string, unknown>[]) =>
    log.getLogger(tag).error(msg, ...args),
  debug: (tag: LogTag, msg: string, ...args: Record<string, unknown>[]) =>
    log.getLogger(tag).debug(msg, ...args),
};