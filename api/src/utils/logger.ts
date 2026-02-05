export type LogTag = 'ESI' | 'DB' | 'CACHE' | 'SYSTEM';

function formatMessage(tag: LogTag, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${tag}] ${message}`;
}

export const logger = {
  info: (tag: LogTag, message: string) => {
    console.log(formatMessage(tag, message));
  },
  warn: (tag: LogTag, message: string) => {
    console.warn(formatMessage(tag, message));
  },
  error: (tag: LogTag, message: string, error?: Error) => {
    console.error(formatMessage(tag, message));
    if (error) {
      console.error(error);
    }
  },
  debug: (tag: LogTag, message: string) => {
    // We could hide debug logs based on an env var if needed
    console.debug(formatMessage(tag, message));
  },
};
