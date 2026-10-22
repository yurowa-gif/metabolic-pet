import { describe, expect, it } from 'vitest';
import { createState } from '../sim/state';
import { clearState, loadState, saveState, type StorageLike } from './local';

function memory(): StorageLike {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

describe('localStorage persistence', () => {
  it('round-trips a state', () => {
    const st = memory();
    const s = createState('하늘', 'male', 123);
    expect(saveState(st, s)).toBe(true);
    expect(loadState(st)).toEqual(s);
  });
  it('returns null for missing, corrupt or wrong-version data', () => {
    const st = memory();
    expect(loadState(st)).toBeNull();
    st.setItem('metabolic-pet/v1', '{not json');
    expect(loadState(st)).toBeNull();
    st.setItem('metabolic-pet/v1', JSON.stringify({ ...createState('x', 'female', 1), version: 2 }));
    expect(loadState(st)).toBeNull();
  });
  it('reports false when storage throws (private mode) and clear removes', () => {
    const throwing: StorageLike = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => {} };
    expect(saveState(throwing, createState('x', 'female', 1))).toBe(false);
    expect(loadState(throwing)).toBeNull();
    const st = memory();
    saveState(st, createState('x', 'female', 1));
    clearState(st);
    expect(loadState(st)).toBeNull();
  });
});
