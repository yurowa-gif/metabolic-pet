import { mkdirSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { chooseActivity, chooseMeal, endDay } from '../sim/engine';
import { createState } from '../sim/state';
import type { PetState } from '../sim/types';

/** UI 검증용 저장 상태 생성. 실행: npx vitest run src/dev */
function play(s: PetState, meals: string[], activity: 'rest' | 'exercise', days: number): PetState {
  for (let d = 0; d < days && s.ending === 'playing'; d++) {
    for (const m of meals) s = chooseMeal(s, m);
    s = chooseActivity(s, activity);
    s = endDay(s, Date.now());
  }
  return s;
}

it('writes fixture states for UI checks', () => {
  const now = Date.now();
  const dir = 'artifacts/runs/2026-10-20-ui-check';
  mkdirSync(dir, { recursive: true });
  const d4 = play(createState('콩이', 'female', now), ['cola', 'tteokbokki', 'cola', 'banana'], 'rest', 4);
  const d12 = play(createState('콩이', 'female', now), ['ramen', 'gimbap', 'tteokbokki', 'pizza'], 'rest', 12);
  const d19 = play(createState('콩이', 'male', now), ['brownrice', 'mackerel', 'salad', 'apple'], 'exercise', 19);
  writeFileSync(`${dir}/state-day4-sugar.json`, JSON.stringify({ ...d4, updatedAt: now }));
  writeFileSync(`${dir}/state-day12-salt.json`, JSON.stringify({ ...d12, updatedAt: now }));
  writeFileSync(`${dir}/state-day19-good.json`, JSON.stringify({ ...d19, updatedAt: now }));
});
