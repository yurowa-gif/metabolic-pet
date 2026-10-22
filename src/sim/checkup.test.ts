import { describe, expect, it } from 'vitest';
import { checkup, isCheckupDay, summarize } from './checkup';
import { chooseActivity, chooseMeal, endDay } from './engine';
import { createState } from './state';

describe('checkup', () => {
  it('checkup days are 5, 10, 15, 20 (evaluated after endDay, so log length)', () => {
    expect([4, 5, 6, 10, 15, 20, 21].map(isCheckupDay)).toEqual([false, true, false, true, true, true, false]);
  });
  it('builds rows with guideline labels and weight delta', () => {
    const s = createState('a', 'female', 0);
    const c = checkup({ ...s, bio: { glucose: 110, sys: 128, dia: 79, ldl: 165, weight: 61.5 } });
    expect(c.rows.map((r) => r.key)).toEqual(['glucose', 'bp', 'ldl', 'weight']);
    expect(c.rows[0]).toMatchObject({ value: '110', unit: 'mg/dL', label: '공복혈당장애(당뇨병전단계)', stage: 'pre' });
    expect(c.rows[1]).toMatchObject({ value: '128/79', unit: 'mmHg', label: '주의 혈압', stage: 'pre' });
    expect(c.rows[2]).toMatchObject({ value: '165', label: '높음', stage: 'onset' });
    expect(c.rows[3]).toMatchObject({ value: '61.5', unit: 'kg', label: '+1.5 kg', stage: 'none' });
  });
});

describe('summarize', () => {
  it('reports the first day each stage was reached and the worst daily driver', () => {
    let s = createState('a', 'female', 0);
    for (let d = 0; d < 8; d++) {
      for (const m of ['cola', 'tteokbokki', 'cola', 'banana']) s = chooseMeal(s, m);
      s = chooseActivity(s, 'rest');
      s = endDay(s);
    }
    const sum = summarize(s);
    expect(sum.days).toBe(8);
    expect(sum.firstDay.diabetes.pre).toBe(4);
    expect(sum.firstDay.diabetes.onset).toBeGreaterThanOrEqual(6);
    expect(sum.series.glucose.length).toBe(8);
    expect(sum.topDriver).toBe('sugar');
    expect(sum.mealCounts.cola).toBe(16);
  });
});
