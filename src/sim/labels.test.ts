import { describe, expect, it } from 'vitest';
import { labelGlucose, labelBP, labelLDL, stageOf } from './labels';

describe('guideline labels (thresholds.json)', () => {
  it('glucose: KDA 2023 — <100 정상, 100–125 공복혈당장애, ≥126 당뇨병', () => {
    expect(labelGlucose(99)).toEqual({ stage: 'none', text: '정상' });
    expect(labelGlucose(100)).toEqual({ stage: 'pre', text: '공복혈당장애(당뇨병전단계)' });
    expect(labelGlucose(125)).toEqual({ stage: 'pre', text: '공복혈당장애(당뇨병전단계)' });
    expect(labelGlucose(126)).toEqual({ stage: 'onset', text: '당뇨병 범위' });
  });
  it('blood pressure: KSH 2022 표 1', () => {
    expect(labelBP(119, 79).text).toBe('정상 혈압');
    expect(labelBP(125, 79)).toEqual({ stage: 'pre', text: '주의 혈압' });
    expect(labelBP(119, 85)).toEqual({ stage: 'pre', text: '고혈압 전단계' });
    expect(labelBP(139, 89).text).toBe('고혈압 전단계');
    expect(labelBP(140, 80)).toEqual({ stage: 'onset', text: '고혈압 1기' });
    expect(labelBP(120, 90).text).toBe('고혈압 1기');
    expect(labelBP(160, 70).text).toBe('고혈압 2기');
    expect(labelBP(130, 100).text).toBe('고혈압 2기');
  });
  it('LDL: KSoLA 2022 표 2-1', () => {
    expect(labelLDL(99)).toEqual({ stage: 'none', text: '적정' });
    expect(labelLDL(100)).toEqual({ stage: 'none', text: '정상' });
    expect(labelLDL(130)).toEqual({ stage: 'pre', text: '경계' });
    expect(labelLDL(159).text).toBe('경계');
    expect(labelLDL(160)).toEqual({ stage: 'onset', text: '높음' });
    expect(labelLDL(190)).toEqual({ stage: 'onset', text: '매우 높음' });
  });
  it('stageOf maps a marker to pre/onset by thresholds', () => {
    expect(stageOf('glucose', { glucose: 110, sys: 110, dia: 70, ldl: 90, weight: 60 })).toBe('pre');
    expect(stageOf('bp', { glucose: 90, sys: 141, dia: 70, ldl: 90, weight: 60 })).toBe('onset');
    expect(stageOf('ldl', { glucose: 90, sys: 110, dia: 70, ldl: 129, weight: 60 })).toBe('none');
  });
});
