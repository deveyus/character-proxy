/**
 * Represents an entity match discovered within a text block.
 */
export interface DiscoveryMatch {
  id: number;
  type: 'character' | 'corporation' | 'alliance';
}

const TYPE_MAP: Record<string, 'character' | 'corporation' | 'alliance'> = {
  '1373': 'character',
  '2': 'corporation',
  '16159': 'alliance',
};

/**
 * Extracts EVE Online `showinfo:` links from raw HTML or text.
 *
 * Performance: Low -- Regex Scan
 * Scans the provided text using a global regular expression. Deduplicates matches
 * before returning.
 *
 * @param {string} text - The raw text or HTML (e.g., a character bio) to scan.
 * @returns {DiscoveryMatch[]} A list of unique discovered entity IDs and their types.
 *
 * @example
 * const links = parseBioLinks('<a href="showinfo:1373//2112024646">Me</a>');
 * // Returns [{ id: 2112024646, type: 'character' }]
 */
export function parseBioLinks(text: string): DiscoveryMatch[] {
  if (!text) return [];

  const matches: DiscoveryMatch[] = [];
  // Regex explanation:
  // showinfo: - literal
  // (\d+) - group 1: typeID
  // // - literal separator
  // (\d+) - group 2: itemID
  const regex = /showinfo:(\d+)\/\/(\d+)/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const typeId = match[1];
    const itemId = parseInt(match[2]);
    const entityType = TYPE_MAP[typeId];

    if (entityType && !isNaN(itemId)) {
      matches.push({ id: itemId, type: entityType });
    }
  }

  // Deduplicate matches
  return matches.filter((v, i, a) =>
    a.findIndex((t) => (t.id === v.id && t.type === v.type)) === i
  );
}
