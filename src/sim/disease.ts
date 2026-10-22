import { STAGE_DAYS } from '../data/config';
import type { Stage } from './types';

/** 지표 하나의 질환 추적 상태 */
export interface DiseaseTrack {
  stage: Stage;
  /** 전단계 기준 이상인 연속 일수 */
  streak: number;
  /** 회복 조건을 충족한 연속 일수 */
  recover: number;
}

/**
 * 하루 끝에 한 번 호출. measured = 그날 지표의 지침 구간(none/pre/onset).
 * none  --(pre 이상 3일 연속)--> pre
 * pre   --(streak ≥ 5 이고 그날 onset 범위)--> onset
 * pre   --(pre 미만 3일 연속)--> none
 * onset --(그날 약 복용 AND onset 미만, 3일 연속)--> pre
 */
export function stepDisease(t: DiseaseTrack, measured: Stage, medicine: boolean): DiseaseTrack {
  const abovePre = measured !== 'none';
  const streak = abovePre ? t.streak + 1 : 0;

  if (t.stage === 'none') {
    if (streak >= STAGE_DAYS.toPre) return { stage: 'pre', streak, recover: 0 };
    return { stage: 'none', streak, recover: 0 };
  }

  if (t.stage === 'pre') {
    if (measured === 'onset' && streak >= STAGE_DAYS.toOnset) return { stage: 'onset', streak, recover: 0 };
    const recover = abovePre ? 0 : t.recover + 1;
    if (recover >= STAGE_DAYS.preToNone) return { stage: 'none', streak: 0, recover: 0 };
    return { stage: 'pre', streak, recover };
  }

  // onset
  const ok = medicine && measured !== 'onset';
  const recover = ok ? t.recover + 1 : 0;
  if (recover >= STAGE_DAYS.onsetToPre) return { stage: 'pre', streak, recover: 0 };
  return { stage: 'onset', streak, recover };
}
