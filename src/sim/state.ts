import { BASELINE, INITIAL_GAUGES } from '../data/config';
import type { PetState, Sex } from './types';

export function createState(name: string, sex: Sex, now: number): PetState {
  return {
    version: 1,
    name: name.trim() || '펫',
    sex,
    day: 1,
    slot: 0,
    gauges: { ...INITIAL_GAUGES },
    bio: { ...BASELINE },
    streak: { glucose: 0, bp: 0, ldl: 0 },
    recover: { glucose: 0, bp: 0, ldl: 0 },
    disease: { diabetes: 'none', hypertension: 'none', dyslipidemia: 'none' },
    today: { meals: [], activity: null, medicine: false },
    log: [],
    ending: 'playing',
    startedAt: now,
    updatedAt: now,
  };
}

export function hasOnset(s: PetState): boolean {
  return Object.values(s.disease).includes('onset');
}

export function onsetCount(s: PetState): number {
  return Object.values(s.disease).filter((d) => d === 'onset').length;
}
