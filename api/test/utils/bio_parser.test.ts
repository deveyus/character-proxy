import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { parseBioLinks } from '../../src/utils/bio_parser.ts';

Deno.test('BioParser - parseBioLinks', async (t) => {
  await t.step('should extract character links', () => {
    const bio = 'Contact <a href="showinfo:1373//90000001">Serafina</a> for details.';
    const results = parseBioLinks(bio);
    assertEquals(results, [{ id: 90000001, type: 'character' }]);
  });

  await t.step('should extract corporation links', () => {
    const bio = 'Join <a href="showinfo:2//1000001">Caldari Provisions</a> today!';
    const results = parseBioLinks(bio);
    assertEquals(results, [{ id: 1000001, type: 'corporation' }]);
  });

  await t.step('should extract alliance links', () => {
    const bio = 'Proud member of <a href="showinfo:16159//99000001">Pandemic Legion</a>.';
    const results = parseBioLinks(bio);
    assertEquals(results, [{ id: 99000001, type: 'alliance' }]);
  });

  await t.step('should handle multiple links and deduplicate', () => {
    const bio = `
      CEO: <a href="showinfo:1373//123">CEO A</a>
      Founder: <a href="showinfo:1373//123">CEO A</a>
      Corp: <a href="showinfo:2//456">Corp B</a>
    `;
    const results = parseBioLinks(bio);
    assertEquals(results.length, 2);
    assertEquals(results.some(r => r.id === 123 && r.type === 'character'), true);
    assertEquals(results.some(r => r.id === 456 && r.type === 'corporation'), true);
  });

  await t.step('should ignore unknown typeIDs', () => {
    const bio = 'Check out this item: <a href="showinfo:1234//5678">Some Item</a>';
    const results = parseBioLinks(bio);
    assertEquals(results, []);
  });

  await t.step('should handle empty or null text', () => {
    assertEquals(parseBioLinks(''), []);
    // @ts-ignore: testing runtime safety
    assertEquals(parseBioLinks(null), []);
  });
});
