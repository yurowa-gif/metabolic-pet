import { describe, expect, it } from 'vitest';
import { DAY_MS, GAUGE } from '../data/config';
import { applyElapsed } from './catchup';
import { canTakeMedicine, chooseActivity, chooseMeal, endDay, takeMedicine, updateBio } from './engine';
import { createState } from './state';
import type { Ratios } from './types';

const at = (over: Partial<Ratios>): Ratios => ({ rE: 1, rSugar: 1, rSat: 1, rNa: 1, fiberFactor: 1, ...over });
const base = { glucose: 90, sys: 112, dia: 72, ldl: 95, weight: 60 };

describe('state and actions', () => {
  it('createState sets baseline and day 1', () => {
    const s = createState('  ', 'female', 1000);
    expect(s.name).toBe('펫');
    expect(s.day).toBe(1);
    expect(s.bio).toEqual(base);
    expect(s.gauges).toEqual({ fullness: 70, vitality: 80, health: 100 });
  });
  it('chooseMeal fills slots 0..3 then chooseActivity on slot 4', () => {
    let s = createState('a', 'female', 0);
    s = chooseMeal(s, 'ramen');
    expect(s.slot).toBe(1);
    expect(s.gauges.fullness).toBeGreaterThan(70);
    s = chooseMeal(s, null);
    s = chooseMeal(s, 'apple');
    s = chooseMeal(s, 'milk');
    expect(s.slot).toBe(4);
    expect(chooseMeal(s, 'cola').today.meals.length).toBe(4); // 더 못 넣음
    s = chooseActivity(s, 'exercise');
    expect(s.today.activity).toBe('exercise');
  });
  it('medicine is only available during onset', () => {
    const s = createState('a', 'male', 0);
    expect(canTakeMedicine(s)).toBe(false);
    expect(takeMedicine(s).today.medicine).toBe(false);
    const sick = { ...s, disease: { ...s.disease, diabetes: 'onset' as const } };
    expect(canTakeMedicine(sick)).toBe(true);
    expect(takeMedicine(sick).today.medicine).toBe(true);
  });
});

describe('updateBio (spec §5.2)', () => {
  it('does nothing at exactly the limits with rest', () => {
    const b = updateBio(base, at({}), 'rest');
    expect(b).toEqual(base);
  });
  it('sugar excess raises glucose, damped by fiber', () => {
    expect(updateBio(base, at({ rSugar: 2 }), 'rest').glucose).toBeCloseTo(106, 5);
    expect(updateBio(base, at({ rSugar: 2, fiberFactor: 0.7 }), 'rest').glucose).toBeCloseTo(101.2, 5);
  });
  it('activity never pushes a marker below its baseline', () => {
    const b = updateBio(base, at({}), 'exercise');
    expect(b.glucose).toBe(90);
    expect(b.sys).toBe(112);
    expect(updateBio({ ...base, glucose: 92 }, at({ rSugar: 1.5 }), 'exercise').glucose).toBeCloseTo(96, 5); // 92+8−4
  });
  it('sodium excess raises blood pressure; under the limit it relaxes 8% toward baseline', () => {
    const up = updateBio(base, at({ rNa: 1.5 }), 'rest');
    expect(up.sys).toBeCloseTo(117, 5);
    expect(up.dia).toBeCloseTo(75, 5);
    const down = updateBio({ ...base, sys: 137 }, at({}), 'rest');
    expect(down.sys).toBeCloseTo(135, 5); // 137 + (112-137)*0.08
  });
  it('saturated fat excess raises LDL; exercise lowers it', () => {
    expect(updateBio(base, at({ rSat: 2 }), 'rest').ldl).toBeCloseTo(105, 5);
    expect(updateBio(base, at({ rSat: 2 }), 'exercise').ldl).toBeCloseTo(103, 5);
  });
  it('energy excess gains weight (capped) and weight above baseline nudges glucose', () => {
    const w = updateBio(base, at({ rE: 2 }), 'rest');
    expect(w.weight).toBeCloseTo(60.3, 5);
    expect(updateBio({ ...base, weight: 64 }, at({}), 'rest').glucose).toBeCloseTo(92 + (90 - 92) * 0.08, 1);
  });
  it('under-eating loses at most 0.1 kg/day', () => {
    expect(updateBio(base, at({ rE: 0.3 }), 'rest').weight).toBeCloseTo(59.9, 5);
  });
});

describe('endDay', () => {
  it('fills skipped meals, decays gauges, appends log and advances the day', () => {
    let s = createState('a', 'female', 0);
    s = chooseMeal(s, 'brownrice');
    s = chooseActivity({ ...s, slot: 4 }, 'walk');
    const n = endDay(s, 5000);
    expect(n.day).toBe(2);
    expect(n.slot).toBe(0);
    expect(n.log.length).toBe(1);
    expect(n.log[0]!.meals).toEqual(['brownrice', null, null, null]);
    expect(n.gauges.vitality).toBe(80 - GAUGE.vitalityDailyDecay + 5);
    expect(n.updatedAt).toBe(5000);
  });
  it('overfull day costs health; starving day costs health; fullness resets daily', () => {
    const s = createState('a', 'female', 0);
    const over = endDay({ ...s, gauges: { ...s.gauges, fullness: 150 } });
    expect(over.gauges.health).toBe(98);
    expect(over.gauges.fullness).toBe(0);
    expect(over.log[0]!.gauges.fullness).toBe(150);
    expect(endDay({ ...s, gauges: { ...s.gauges, fullness: 10 } }).gauges.health).toBe(99);
    expect(endDay({ ...s, gauges: { ...s.gauges, fullness: 100 } }).gauges.health).toBe(100);
  });
  it('a full day of normal portions lands near 100 fullness', () => {
    let s = createState('a', 'female', 0);
    s = { ...s, gauges: { ...s.gauges, fullness: 0 } };
    for (const m of ['brownrice', 'mackerel', 'salad', 'apple']) s = chooseMeal(s, m);
    expect(s.gauges.fullness).toBeGreaterThan(80);
    expect(s.gauges.fullness).toBeLessThan(130);
  });
  it('onset diseases drain health and cap vitality at 40; two onsets drain faster', () => {
    const s = createState('a', 'female', 0);
    const one = { ...s, disease: { ...s.disease, diabetes: 'onset' as const }, bio: { ...s.bio, glucose: 140 }, streak: { glucose: 9, bp: 0, ldl: 0 } };
    const n1 = endDay(one);
    expect(n1.gauges.health).toBe(95);
    expect(n1.gauges.vitality).toBeLessThanOrEqual(40);
    const two = { ...one, disease: { ...one.disease, hypertension: 'onset' as const }, bio: { ...one.bio, sys: 150 }, streak: { glucose: 9, bp: 9, ldl: 0 } };
    expect(endDay(two).gauges.health).toBe(80);
  });
  it('day 20 ends the game as finished; health 0 ends as hospital', () => {
    const s = createState('a', 'female', 0);
    expect(endDay({ ...s, day: 20 }).ending).toBe('finished');
    expect(endDay({ ...s, gauges: { ...s.gauges, health: 3 }, disease: { ...s.disease, diabetes: 'onset' }, bio: { ...s.bio, glucose: 140 } }).ending).toBe('hospital');
  });
});

describe('applyElapsed (timer catch-up)', () => {
  it('advances one day per 45 s and is idempotent for the same now', () => {
    const s = createState('a', 'female', 0);
    const a = applyElapsed(s, DAY_MS * 2 + 10);
    expect(a.day).toBe(3);
    expect(a.log.length).toBe(2);
    expect(applyElapsed(a, DAY_MS * 2 + 10)).toEqual(a);
  });
  it('does not exceed the game length', () => {
    const s = createState('a', 'female', 0);
    const a = applyElapsed(s, DAY_MS * 1000);
    expect(a.ending).not.toBe('playing');
    expect(a.log.length).toBeLessThanOrEqual(20);
  });
});
