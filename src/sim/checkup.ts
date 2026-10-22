import { BASELINE, TOTAL_DAYS } from '../data/config';
import { labelBP, labelGlucose, labelLDL } from './labels';
import type { PetState, Stage } from './types';

export interface CheckupRow { key: 'glucose' | 'bp' | 'ldl' | 'weight'; name: string; value: string; unit: string; label: string; stage: Stage }
export interface Checkup { day: number; rows: CheckupRow[] }

const CHECKUP_EVERY = 5;

/** 검진은 5·10·15·20일차가 끝났을 때(log.length 기준) */
export function isCheckupDay(completedDays: number): boolean {
  return completedDays > 0 && completedDays % CHECKUP_EVERY === 0 && completedDays <= TOTAL_DAYS;
}

export function checkup(s: PetState): Checkup {
  const b = s.bio;
  const g = labelGlucose(b.glucose);
  const p = labelBP(b.sys, b.dia);
  const l = labelLDL(b.ldl);
  const dw = b.weight - BASELINE.weight;
  return {
    day: s.log.length,
    rows: [
      { key: 'glucose', name: '공복혈당', value: `${Math.round(b.glucose)}`, unit: 'mg/dL', label: g.text, stage: g.stage },
      { key: 'bp', name: '혈압', value: `${Math.round(b.sys)}/${Math.round(b.dia)}`, unit: 'mmHg', label: p.text, stage: p.stage },
      { key: 'ldl', name: 'LDL 콜레스테롤', value: `${Math.round(b.ldl)}`, unit: 'mg/dL', label: l.text, stage: l.stage },
      { key: 'weight', name: '체중', value: b.weight.toFixed(1), unit: 'kg', label: `${dw >= 0 ? '+' : ''}${dw.toFixed(1)} kg`, stage: 'none' },
    ],
  };
}

export type Driver = 'sugar' | 'sodium' | 'satFat' | 'energy' | 'none';
export interface Summary {
  days: number;
  ending: PetState['ending'];
  firstDay: Record<'diabetes' | 'hypertension' | 'dyslipidemia', { pre: number | null; onset: number | null }>;
  series: { glucose: number[]; sys: number[]; ldl: number[]; weight: number[] };
  mealCounts: Record<string, number>;
  /** 평균 초과 비율이 가장 큰 영양 요인 */
  topDriver: Driver;
  avgRatios: { rE: number; rSugar: number; rSat: number; rNa: number };
  skippedMeals: number;
  exerciseDays: number;
}

export function summarize(s: PetState): Summary {
  const log = s.log;
  const first = (key: keyof PetState['disease'], stage: Stage) => {
    const i = log.findIndex((r) => r.disease[key] === stage);
    return i < 0 ? null : log[i]!.day;
  };
  const mealCounts: Record<string, number> = {};
  let skipped = 0;
  for (const r of log) for (const m of r.meals) { if (m) mealCounts[m] = (mealCounts[m] ?? 0) + 1; else skipped++; }
  const n = Math.max(log.length, 1);
  const avg = (f: (r: PetState['log'][number]) => number) => log.reduce((a, r) => a + f(r), 0) / n;
  const avgRatios = { rE: avg((r) => r.ratios.rE), rSugar: avg((r) => r.ratios.rSugar), rSat: avg((r) => r.ratios.rSat), rNa: avg((r) => r.ratios.rNa) };
  const candidates: [Driver, number][] = [['sugar', avgRatios.rSugar], ['sodium', avgRatios.rNa], ['satFat', avgRatios.rSat], ['energy', avgRatios.rE]];
  const top = candidates.sort((a, b) => b[1] - a[1])[0]!;
  return {
    days: log.length,
    ending: s.ending,
    firstDay: {
      diabetes: { pre: first('diabetes', 'pre'), onset: first('diabetes', 'onset') },
      hypertension: { pre: first('hypertension', 'pre'), onset: first('hypertension', 'onset') },
      dyslipidemia: { pre: first('dyslipidemia', 'pre'), onset: first('dyslipidemia', 'onset') },
    },
    series: { glucose: log.map((r) => r.bio.glucose), sys: log.map((r) => r.bio.sys), ldl: log.map((r) => r.bio.ldl), weight: log.map((r) => r.bio.weight) },
    mealCounts,
    topDriver: top[1] > 1 ? top[0] : 'none',
    avgRatios,
    skippedMeals: skipped,
    exerciseDays: log.filter((r) => r.activity === 'exercise' || r.activity === 'walk').length,
  };
}
