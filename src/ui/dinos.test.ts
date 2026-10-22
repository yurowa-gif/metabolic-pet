import { describe, expect, it } from 'vitest';
import { DINOS, desaturate, getDino } from './dinos';

describe('dino sprites', () => {
  it('has 5 species with rectangular grids and only known symbols', () => {
    expect(DINOS.map((d) => d.id)).toEqual(['stego', 'trike', 'brachio', 'trex', 'raptor']);
    for (const d of DINOS) {
      const w = d.body[0]!.length;
      const rows = [...d.body, ...d.legs[0], ...d.legs[1]];
      for (const r of rows) {
        expect(r.length, `${d.id}: "${r}"`).toBe(w);
        expect(r).toMatch(/^[.obdlawec]+$/);
      }
      expect(d.legs[0].length).toBe(d.legs[1].length);
      expect(rows.join('')).toContain('e');
    }
  });
  it('falls back to the first species for unknown ids (old saves)', () => {
    expect(getDino(undefined).id).toBe('stego');
    expect(getDino('nope').id).toBe('stego');
    expect(getDino('trex').id).toBe('trex');
  });
  it('desaturate keeps gray and moves color toward gray', () => {
    expect(desaturate('#808080', 0.6)).toBe('#808080');
    expect(desaturate('#ff0000', 1)).toBe('#4d4d4d');
  });
});
