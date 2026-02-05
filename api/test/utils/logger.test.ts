import { logger, setupLogger } from '../../src/utils/logger.ts';

Deno.test('Logger Utility', async (t) => {
  await setupLogger();

  await t.step('should log info messages with the correct format', () => {
    // We can't easily capture stdout without redirecting it,
    // but we can check if it runs without error.
    logger.info('SYSTEM', 'Test info message');
  });

  await t.step('should log debug messages for ESI', () => {
    logger.debug('ESI', 'Test debug message');
  });

  await t.step('should handle extra attributes', () => {
    logger.info('DB', 'Query executed', { query: 'SELECT 1', duration: '5ms' });
  });
});
