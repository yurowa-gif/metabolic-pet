import foodsJson from '../data/foods.json';
import { EER, ENERGY_COVERAGE, LIMITS } from '../data/config';
import type { FoodId, Ratios, Sex, Totals } from './types';

export interface Food {
  id: FoodId;
  name: string;
  emoji: string;
  tag: string;
  kfindCode: string;
  origin: string;
  serving_g: number;
  servingBasis: string;
  per100: { kcal: number; sugar_g: number; sodium_mg: number; satFat_g: number; fiber_g: number; fat_g: number; carb_g: number; protein_g: number };
}

const NUMERIC: (keyof Food['per100'])[] = ['kcal', 'sugar_g', 'sodium_mg', 'satFat_g', 'fiber_g', 'fat_g', 'carb_g', 'protein_g'];

function isValid(f: unknown): f is Food {
  if (!f || typeof f !== 'object') return false;
  const x = f as Partial<Food>;
  if (typeof x.id !== 'string' || typeof x.serving_g !== 'number' || !(x.serving_g > 0) || !x.per100) return false;
  return NUMERIC.every((k) => typeof x.per100![k] === 'number' && Number.isFinite(x.per100![k]));
}

/** 유효한 카드만 노출. 깨진 항목은 콘솔 오류 후 제외(스펙 §9). */
export const FOODS: Food[] = (foodsJson.foods as unknown[]).filter((f) => {
  const ok = isValid(f);
  if (!ok) console.error('foods.json: invalid entry skipped', f);
  return ok;
}) as Food[];

const BY_ID = new Map(FOODS.map((f) => [f.id, f]));

export function getFood(id: FoodId): Food {
  const f = BY_ID.get(id);
  if (!f) throw new Error(`unknown food: ${id}`);
  return f;
}

export const EMPTY_TOTALS: Totals = { kcal: 0, sugar_g: 0, sodium_mg: 0, satFat_g: 0, fiber_g: 0 };

/** 1인분 영양값 = per100 × serving_g / 100 */
export function servingNutrients(f: Food): Totals {
  const s = f.serving_g / 100;
  return {
    kcal: f.per100.kcal * s,
    sugar_g: f.per100.sugar_g * s,
    sodium_mg: f.per100.sodium_mg * s,
    satFat_g: f.per100.satFat_g * s,
    fiber_g: f.per100.fiber_g * s,
  };
}

export function addTotals(a: Totals, b: Totals): Totals {
  return { kcal: a.kcal + b.kcal, sugar_g: a.sugar_g + b.sugar_g, sodium_mg: a.sodium_mg + b.sodium_mg, satFat_g: a.satFat_g + b.satFat_g, fiber_g: a.fiber_g + b.fiber_g };
}

/** 하루 식사 합계. null(거름)은 0. */
export function dayTotals(meals: (FoodId | null)[]): Totals {
  return meals.reduce<Totals>((acc, id) => (id ? addTotals(acc, servingNutrients(getFood(id))) : acc), EMPTY_TOTALS);
}

/** 기준 대비 비율(1 = 기준). 당류·포화지방은 에너지 비율 기준, 나트륨은 2,300 mg, 식이섬유는 완화 계수. */
export function dayRatios(t: Totals, sex: Sex): Ratios {
  const eer = EER[sex];
  const rE = t.kcal / (eer * ENERGY_COVERAGE);
  const rSugar = (t.sugar_g * 4) / (LIMITS.sugarPctEnergy * eer);
  const rSat = (t.satFat_g * 9) / (LIMITS.satFatPctEnergy * eer);
  const rNa = t.sodium_mg / LIMITS.sodiumMg;
  const fiberFactor = Math.max(1 - LIMITS.fiberDamping, 1 - LIMITS.fiberDamping * (t.fiber_g / LIMITS.fiberG));
  return { rE, rSugar, rSat, rNa, fiberFactor };
}

/** 1일 영양성분 기준치 대비 %(음식 카드 표시용). */
export function percentOfDaily(n: Totals, daily: { energy_kcal: number; sugars_g: number; sodium_mg: number; saturatedFat_g: number; fiber_g: number }) {
  return {
    kcal: Math.round((n.kcal / daily.energy_kcal) * 100),
    sugar: Math.round((n.sugar_g / daily.sugars_g) * 100),
    sodium: Math.round((n.sodium_mg / daily.sodium_mg) * 100),
    satFat: Math.round((n.satFat_g / daily.saturatedFat_g) * 100),
    fiber: Math.round((n.fiber_g / daily.fiber_g) * 100),
  };
}
