import { DAY_MS, TOTAL_DAYS } from '../data/config';
import { endDay } from './engine';
import type { PetState } from './types';

/**
 * 재개 시 경과 시간 보정(원본의 round(diff/period) 틱 반복 차용).
 * 45초 단위로 지나간 날은 남은 슬롯을 거름으로 endDay. 같은 now로 두 번 불러도 결과가 같다(멱등).
 */
export function applyElapsed(s: PetState, now: number): PetState {
  if (s.ending !== 'playing') return s;
  const elapsedDays = Math.min(Math.floor((now - s.updatedAt) / DAY_MS), TOTAL_DAYS);
  let state = s;
  for (let i = 0; i < elapsedDays && state.ending === 'playing'; i++) {
    state = endDay(state, state.updatedAt + DAY_MS);
  }
  return state === s ? s : { ...state, updatedAt: s.updatedAt + elapsedDays * DAY_MS };
}

/** 현재 날의 남은 시간(ms) */
export function remainingMs(s: PetState, now: number): number {
  return Math.max(0, DAY_MS - (now - s.updatedAt));
}
