import thresholds from '../data/thresholds.json';
import type { Bio, Marker, Stage } from './types';

export interface Label { stage: Stage; text: string }

const G = thresholds.fastingGlucose_mgdl;
const BP = thresholds.bloodPressure_mmHg;
const L = thresholds.ldl_mgdl;
const lo = (range: number[]): number => range[0] ?? Number.POSITIVE_INFINITY;

/** 임계값을 한 곳에 모아 UI·테스트에서 재사용 */
export const T = {
  glucosePre: lo(G.prediabetes),
  glucoseOnset: G.diabetesFrom,
  sysElevated: lo(BP.elevated.sys),
  sysPre: lo(BP.preHypertension.sys),
  diaPre: lo(BP.preHypertension.dia),
  sysStage1: lo(BP.stage1.sys),
  diaStage1: lo(BP.stage1.dia),
  sysStage2: BP.stage2.sysFrom,
  diaStage2: BP.stage2.diaFrom,
  ldlNormal: lo(L.normal),
  ldlPre: lo(L.borderline),
  ldlOnset: lo(L.high),
  ldlVeryHigh: L.veryHighFrom,
} as const;

/** 대한당뇨병학회 2023: <100 정상, 100–125 공복혈당장애, ≥126 당뇨병 범위 */
export function labelGlucose(v: number): Label {
  if (v >= T.glucoseOnset) return { stage: 'onset', text: '당뇨병 범위' };
  if (v >= T.glucosePre) return { stage: 'pre', text: '공복혈당장애(당뇨병전단계)' };
  return { stage: 'none', text: '정상' };
}

/** 대한고혈압학회 2022 표 1 */
export function labelBP(sys: number, dia: number): Label {
  if (sys >= T.sysStage2 || dia >= T.diaStage2) return { stage: 'onset', text: '고혈압 2기' };
  if (sys >= T.sysStage1 || dia >= T.diaStage1) return { stage: 'onset', text: '고혈압 1기' };
  if (sys >= T.sysPre || dia >= T.diaPre) return { stage: 'pre', text: '고혈압 전단계' };
  if (sys >= T.sysElevated) return { stage: 'pre', text: '주의 혈압' };
  return { stage: 'none', text: '정상 혈압' };
}

/** 한국지질·동맥경화학회 2022 표 2-1 */
export function labelLDL(v: number): Label {
  if (v >= T.ldlVeryHigh) return { stage: 'onset', text: '매우 높음' };
  if (v >= T.ldlOnset) return { stage: 'onset', text: '높음' };
  if (v >= T.ldlPre) return { stage: 'pre', text: '경계' };
  if (v >= T.ldlNormal) return { stage: 'none', text: '정상' };
  return { stage: 'none', text: '적정' };
}

export function labelOf(marker: Marker, bio: Bio): Label {
  if (marker === 'glucose') return labelGlucose(bio.glucose);
  if (marker === 'bp') return labelBP(bio.sys, bio.dia);
  return labelLDL(bio.ldl);
}

export function stageOf(marker: Marker, bio: Bio): Stage {
  return labelOf(marker, bio).stage;
}
