import { describe, expect, it } from 'vitest';
import { stepDisease, type DiseaseTrack } from './disease';

const fresh = (): DiseaseTrack => ({ stage: 'none', streak: 0, recover: 0 });
const run = (track: DiseaseTrack, days: { measured: 'none' | 'pre' | 'onset'; medicine?: boolean }[]) =>
  days.reduce((t, d) => stepDisease(t, d.measured, d.medicine ?? false), track);

describe('disease state machine (spec §6)', () => {
  it('none → pre after 3 consecutive days at or above the pre threshold', () => {
    const t = run(fresh(), [{ measured: 'pre' }, { measured: 'pre' }]);
    expect(t.stage).toBe('none');
    expect(run(t, [{ measured: 'pre' }]).stage).toBe('pre');
  });
  it('a day below pre resets the streak', () => {
    const t = run(fresh(), [{ measured: 'pre' }, { measured: 'pre' }, { measured: 'none' }, { measured: 'pre' }]);
    expect(t.stage).toBe('none');
    expect(t.streak).toBe(1);
  });
  it('pre → onset after 5 consecutive days (counted from the first pre day) with the value in onset range', () => {
    const t = run(fresh(), [{ measured: 'pre' }, { measured: 'pre' }, { measured: 'pre' }, { measured: 'onset' }]);
    expect(t.stage).toBe('pre');
    expect(run(t, [{ measured: 'onset' }]).stage).toBe('onset');
  });
  it('5 days above pre but never in onset range stays pre', () => {
    const t = run(fresh(), Array(7).fill({ measured: 'pre' }));
    expect(t.stage).toBe('pre');
  });
  it('pre → none after 3 consecutive days below pre', () => {
    let t = run(fresh(), Array(3).fill({ measured: 'pre' }));
    t = run(t, [{ measured: 'none' }, { measured: 'none' }]);
    expect(t.stage).toBe('pre');
    expect(run(t, [{ measured: 'none' }]).stage).toBe('none');
  });
  it('onset → pre only with medicine AND value below onset for 3 consecutive days', () => {
    const onset = run(fresh(), [...Array(3).fill({ measured: 'pre' }), ...Array(2).fill({ measured: 'onset' })]);
    expect(onset.stage).toBe('onset');
    // 식단만: 값은 내려갔지만 약 없음 → 유지
    expect(run(onset, Array(5).fill({ measured: 'pre', medicine: false })).stage).toBe('onset');
    // 약만: 값이 여전히 onset 범위 → 유지
    expect(run(onset, Array(5).fill({ measured: 'onset', medicine: true })).stage).toBe('onset');
    // 약 + 값 하락 3일 → pre
    const back = run(onset, Array(3).fill({ measured: 'pre', medicine: true }));
    expect(back.stage).toBe('pre');
    expect(back.recover).toBe(0);
  });
  it('recovery count resets when a day fails the condition', () => {
    const onset = run(fresh(), [...Array(3).fill({ measured: 'pre' }), ...Array(2).fill({ measured: 'onset' })]);
    const t = run(onset, [{ measured: 'pre', medicine: true }, { measured: 'pre', medicine: true }, { measured: 'onset', medicine: true }, { measured: 'pre', medicine: true }]);
    expect(t.stage).toBe('onset');
    expect(t.recover).toBe(1);
  });
});
