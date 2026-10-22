import { describe, expect, it } from 'vitest';
import type { ActivityId } from '../data/config';
import { chooseActivity, chooseMeal, endDay, takeMedicine } from './engine';
import { createState } from './state';
import type { FoodId, PetState } from './types';

type Day = { meals: (FoodId | null)[]; activity: ActivityId; medicine?: boolean };
function play(s: PetState, days: Day[]): PetState {
  for (const d of days) {
    if (s.ending !== 'playing') break;
    for (const m of d.meals) s = chooseMeal(s, m);
    s = chooseActivity(s, d.activity);
    if (d.medicine) s = takeMedicine(s);
    s = endDay(s);
  }
  return s;
}
const repeat = (d: Day, n: number): Day[] => Array(n).fill(d);
const SUGAR: Day = { meals: ['cola', 'tteokbokki', 'cola', 'banana'], activity: 'rest' };
const SALT: Day = { meals: ['ramen', 'gimbap', 'tteokbokki', 'pizza'], activity: 'rest' };
const FAT: Day = { meals: ['friedchicken', 'burger', 'pizza', 'milk'], activity: 'rest' };
const GOOD: Day = { meals: ['brownrice', 'mackerel', 'salad', 'apple'], activity: 'exercise' };

describe('scenario calibration (spec §10)', () => {
  it('(a) sugar-heavy days → prediabetes within 6 days and diabetes onset within 12 days', () => {
    const pre = play(createState('a', 'female', 0), repeat(SUGAR, 6));
    expect(pre.disease.diabetes).not.toBe('none');
    const onset = play(createState('a', 'female', 0), repeat(SUGAR, 12));
    expect(onset.disease.diabetes).toBe('onset');
    expect(onset.bio.glucose).toBeGreaterThanOrEqual(126);
  });
  it('(b) salt-heavy days → hypertension onset within 12 days', () => {
    const s = play(createState('a', 'female', 0), repeat(SALT, 12));
    expect(s.disease.hypertension).toBe('onset');
    expect(s.bio.sys >= 140 || s.bio.dia >= 90).toBe(true);
  });
  it('(b2) saturated-fat-heavy days → dyslipidemia onset within 12 days', () => {
    const s = play(createState('a', 'female', 0), repeat(FAT, 12));
    expect(s.disease.dyslipidemia).toBe('onset');
    expect(s.bio.ldl).toBeGreaterThanOrEqual(160);
  });
  it('(c) prediabetes reverses with 3+ good days', () => {
    const pre = play(createState('a', 'female', 0), repeat(SUGAR, 4));
    expect(pre.disease.diabetes).toBe('pre');
    const back = play(pre, repeat(GOOD, 5));
    expect(back.disease.diabetes).toBe('none');
  });
  it('(d) after onset, diet alone does not recover; medicine + diet recovers to pre', () => {
    const onset = play(createState('a', 'female', 0), repeat(SUGAR, 12));
    expect(onset.disease.diabetes).toBe('onset');
    const dietOnly = play(onset, repeat(GOOD, 4));
    expect(dietOnly.disease.diabetes).toBe('onset');
    const medDiet = play(onset, repeat({ ...GOOD, medicine: true }, 6));
    expect(medDiet.disease.diabetes).toBe('pre');
  });
  it('(e) 20 balanced days → no disease and all labels normal, game finished', () => {
    const s = play(createState('a', 'male', 0), repeat(GOOD, 20));
    expect(s.ending).toBe('finished');
    expect(s.disease).toEqual({ diabetes: 'none', hypertension: 'none', dyslipidemia: 'none' });
    expect(s.bio.glucose).toBeLessThan(100);
    expect(s.bio.sys).toBeLessThan(120);
    expect(s.bio.ldl).toBeLessThan(130);
    expect(s.gauges.health).toBeGreaterThanOrEqual(80);
  });
  it('(f) two diseases at once lead to the hospital ending before day 20', () => {
    const s = play(createState('a', 'female', 0), repeat({ meals: ['ramen', 'friedchicken', 'burger', 'cola'], activity: 'allnighter' }, 20));
    expect(s.ending).toBe('hospital');
    expect(s.day).toBeLessThan(20);
  });
});
