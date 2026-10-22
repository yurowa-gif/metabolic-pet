import type { PetState } from '../sim/types';

export const STORAGE_KEY = 'metabolic-pet/v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function looksLikeState(x: unknown): x is PetState {
  if (!x || typeof x !== 'object') return false;
  const s = x as Partial<PetState>;
  return s.version === 1 && typeof s.day === 'number' && !!s.bio && !!s.gauges && Array.isArray(s.log) && !!s.disease;
}

/** 저장 성공 여부를 돌려준다(사생활 모드 등에서는 false). */
export function saveState(storage: StorageLike, s: PetState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function loadState(storage: StorageLike): PetState | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return looksLikeState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearState(storage: StorageLike): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** 브라우저 localStorage가 막혀 있으면 메모리 저장소로 대체 */
export function pickStorage(): { storage: StorageLike; persistent: boolean } {
  try {
    const ls = globalThis.localStorage;
    const probe = '__mp_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return { storage: ls, persistent: true };
  } catch {
    const m = new Map<string, string>();
    return { storage: { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }, persistent: false };
  }
}
