import { onDiscoveryEvent, DiscoveryEvent } from './extraction.ts';
import { logger } from '../../utils/logger.ts';

/**
 * Registry of active SSE client controllers.
 */
const clients = new Set<ReadableStreamDefaultController>();

/**
 * Registers an SSE client controller.
 */
export function addSseClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
  logger.debug('SYSTEM', `SSE client connected. Total clients: ${clients.size}`);
}

/**
 * Removes an SSE client controller.
 */
export function removeSseClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
  logger.debug('SYSTEM', `SSE client disconnected. Total clients: ${clients.size}`);
}

/**
 * Broadcasts a discovery event to all connected SSE clients.
 */
function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(payload);

  for (const client of clients) {
    try {
      client.enqueue(encoded);
    } catch (_err) {
      // Client likely closed, remove it
      clients.delete(client);
    }
  }
}

/**
 * Initializes the SSE event bridge.
 * Connects internal discovery events to the broadcast mechanism.
 */
export function initializeEventBridge() {
  const events: DiscoveryEvent[] = [
    'character_extracted',
    'corporation_extracted',
    'alliance_extracted',
    'queue_updated',
  ];

  for (const eventType of events) {
    onDiscoveryEvent(eventType, (id) => {
      broadcast(eventType, { id, timestamp: new Date().toISOString() });
    });
  }

  logger.info('SYSTEM', 'SSE event bridge initialized.');
}
