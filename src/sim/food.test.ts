import { describe, expect, it } from 'vitest';
import { getFood, servingNutrients, dayTotals, dayRatios, FOODS } from './food';

describe('food data', () => {
  it('loads 16 foods with numeric per100 and serving', () => {
    expect(FOODS.length).toBe(16);
    for (const f of FOODS) {
      expect(f.serving_g).toBeGreaterThan(0);
      for (const v of Object.values(f.per100)) expect(typeof v).toBe('number');
    }
  });
  it('scales per100 to one serving (라면 550 g → 451 kcal, 나트륨 1,557 mg)', () => {
    const n = servingNutrients(getFood('ramen'));
    expect(Math.round(n.kcal)).toBe(451);
    expect(Math.round(n.sodium_mg)).toBe(1557);
  });
  it('sums a day and treats null (거름) as zero', () => {
    const t = dayTotals(['cola', null, 'apple']);
    expect(Math.round(t.kcal)).toBe(95 + 78);
    expect(t.sugar_g).toBeCloseTo(22.575 + 15.93, 1);
  });
});

describe('ratios', () => {
  it('ratio 1.0 means exactly at the limit', () => {
    // 여 EER 2000: 에너지 기준 2000×0.5 = 1000, 당류 10%E = 200 kcal = 50 g, 포화 8%E = 160 kcal = 17.8 g, 나트륨 2300
    const r = dayRatios({ kcal: 1000, sugar_g: 50, sodium_mg: 2300, satFat_g: 160 / 9, fiber_g: 0 }, 'female');
    expect(r.rE).toBeCloseTo(1, 5);
    expect(r.rSugar).toBeCloseTo(1, 5);
    expect(r.rSat).toBeCloseTo(1, 5);
    expect(r.rNa).toBeCloseTo(1, 5);
    expect(r.fiberFactor).toBe(1);
  });
  it('fiber dampens glucose rise down to 0.7 at 25 g', () => {
    expect(dayRatios({ kcal: 0, sugar_g: 0, sodium_mg: 0, satFat_g: 0, fiber_g: 25 }, 'male').fiberFactor).toBeCloseTo(0.7);
    expect(dayRatios({ kcal: 0, sugar_g: 0, sodium_mg: 0, satFat_g: 0, fiber_g: 100 }, 'male').fiberFactor).toBeCloseTo(0.7);
  });
});
