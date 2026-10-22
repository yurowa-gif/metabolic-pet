import type { ActivityId } from '../data/config';

export type Sex = 'male' | 'female';
export type Stage = 'none' | 'pre' | 'onset';
export type FoodId = string;
export type Marker = 'glucose' | 'bp' | 'ldl';

export interface Totals { kcal: number; sugar_g: number; sodium_mg: number; satFat_g: number; fiber_g: number }
export interface Ratios { rE: number; rSugar: number; rSat: number; rNa: number; fiberFactor: number }
export interface Bio { glucose: number; sys: number; dia: number; ldl: number; weight: number }
export interface Gauges { fullness: number; vitality: number; health: number }
export interface Diseases { diabetes: Stage; hypertension: Stage; dyslipidemia: Stage }

export interface DayRecord {
  day: number;
  meals: (FoodId | null)[];
  activity: ActivityId | null;
  medicine: boolean;
  totals: Totals;
  ratios: Ratios;
  bio: Bio;
  gauges: Gauges;
  disease: Diseases;
}

export interface PetState {
  version: 1;
  name: string;
  sex: Sex;
  /** 펫 공룡 종류(UI 전용). 예전 저장 파일에는 없을 수 있음 */
  species?: string;
  day: number;
  /** 0~3 식사(아침·점심·저녁·간식), 4 활동 */
  slot: 0 | 1 | 2 | 3 | 4;
  gauges: Gauges;
  bio: Bio;
  streak: Record<Marker, number>;
  recover: Record<Marker, number>;
  disease: Diseases;
  today: { meals: (FoodId | null)[]; activity: ActivityId | null; medicine: boolean };
  log: DayRecord[];
  ending: 'playing' | 'finished' | 'hospital';
  startedAt: number;
  updatedAt: number;
}
