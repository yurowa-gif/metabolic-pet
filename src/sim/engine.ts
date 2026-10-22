import { ACTIVITY, BASELINE, EER, ENERGY_COVERAGE, GAUGE, MEAL_SLOTS, MEDICINE, RELAX, RISE, TOTAL_DAYS, type ActivityId } from '../data/config';
import { stepDisease } from './disease';
import { dayRatios, dayTotals, getFood, servingNutrients } from './food';
import { stageOf } from './labels';
import { hasOnset, onsetCount } from './state';
import type { Bio, FoodId, PetState, Ratios } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

/** 식사 슬롯에 카드 선택(null = 거름). 활동 슬롯이면 무시. */
export function chooseMeal(s: PetState, foodId: FoodId | null): PetState {
  if (s.ending !== 'playing' || s.slot >= MEAL_SLOTS) return s;
  if (foodId) getFood(foodId); // 존재 검증
  const meals = [...s.today.meals, foodId];
  let fullness = s.gauges.fullness;
  if (foodId) {
    const portion = (EER[s.sex] * ENERGY_COVERAGE) / MEAL_SLOTS;
    fullness += GAUGE.fullnessPerMeal * (servingNutrients(getFood(foodId)).kcal / portion);
  }
  return { ...s, slot: (s.slot + 1) as PetState['slot'], today: { ...s.today, meals }, gauges: { ...s.gauges, fullness: r1(fullness) } };
}

export function chooseActivity(s: PetState, activity: ActivityId): PetState {
  if (s.ending !== 'playing' || s.slot !== MEAL_SLOTS) return s;
  return { ...s, today: { ...s.today, activity } };
}

/** 발병 중일 때만 하루 1회. 그날 측정값에만 반영(저장값은 내리지 않음). */
export function takeMedicine(s: PetState): PetState {
  if (s.ending !== 'playing' || !hasOnset(s)) return s;
  return { ...s, today: { ...s.today, medicine: true } };
}

export function canTakeMedicine(s: PetState): boolean {
  return s.ending === 'playing' && hasOnset(s) && !s.today.medicine;
}

/** 스펙 §5.2: 비율 초과분은 상승, 이하면 기준선으로 8% 회복, 활동 보정 */
export function updateBio(bio: Bio, r: Ratios, activity: ActivityId | null): Bio {
  const over = (x: number) => Math.max(x - 1, 0);
  const relax = (v: number, base: number, ok: boolean) => (ok ? v + (base - v) * RELAX : v);
  const act = activity ? ACTIVITY[activity] : ACTIVITY.rest;

  // 활동 효과는 기준선 아래로는 내리지 않는다(저혈당·저혈압 연출 방지)
  const withAct = (v: number, delta: number, base: number) => (delta < 0 ? Math.max(v + delta, Math.min(v, base)) : v + delta);

  let glucose = bio.glucose + RISE.glucosePerSugar * over(r.rSugar) * r.fiberFactor + RISE.glucosePerEnergy * over(r.rE) + RISE.glucosePerKg * Math.max(bio.weight - BASELINE.weight, 0);
  glucose = withAct(relax(glucose, BASELINE.glucose, r.rSugar <= 1 && r.rE <= 1), act.glucose, BASELINE.glucose);

  let sys = bio.sys + RISE.sysPerSodium * over(r.rNa);
  let dia = bio.dia + RISE.diaPerSodium * over(r.rNa);
  sys = withAct(relax(sys, BASELINE.sys, r.rNa <= 1), act.sys, BASELINE.sys);
  dia = withAct(relax(dia, BASELINE.dia, r.rNa <= 1), act.dia, BASELINE.dia);

  let ldl = bio.ldl + RISE.ldlPerSatFat * over(r.rSat) + RISE.ldlPerEnergy * over(r.rE);
  ldl = withAct(relax(ldl, BASELINE.ldl, r.rSat <= 1 && r.rE <= 1), act.ldl, BASELINE.ldl);

  const dw = clamp(RISE.weightPerEnergy * (r.rE - 1), -RISE.weightLossCap, RISE.weightGainCap) + act.weight;
  const weight = bio.weight + dw;

  return { glucose: r1(glucose), sys: r1(sys), dia: r1(dia), ldl: r1(ldl), weight: r1(Math.max(weight, 35)) };
}

/** 약 복용 시 그날 측정값 */
export function measuredBio(bio: Bio, medicine: boolean): Bio {
  if (!medicine) return bio;
  return { ...bio, glucose: bio.glucose + MEDICINE.glucose, sys: bio.sys + MEDICINE.sys, dia: bio.dia + MEDICINE.dia, ldl: bio.ldl + MEDICINE.ldl };
}

/** 하루 끝 처리. 남은 식사 슬롯은 거름. */
export function endDay(s: PetState, now: number = s.updatedAt): PetState {
  if (s.ending !== 'playing') return s;
  const meals = [...s.today.meals];
  while (meals.length < MEAL_SLOTS) meals.push(null);
  const totals = dayTotals(meals);
  const ratios = dayRatios(totals, s.sex);
  const activity = s.today.activity;
  const act = activity ? ACTIVITY[activity] : null;

  // 지표
  const bio = updateBio(s.bio, ratios, activity);
  const measured = measuredBio(bio, s.today.medicine);

  // 질환 상태기계
  const g = stepDisease({ stage: s.disease.diabetes, streak: s.streak.glucose, recover: s.recover.glucose }, stageOf('glucose', measured), s.today.medicine);
  const b = stepDisease({ stage: s.disease.hypertension, streak: s.streak.bp, recover: s.recover.bp }, stageOf('bp', measured), s.today.medicine);
  const l = stepDisease({ stage: s.disease.dyslipidemia, streak: s.streak.ldl, recover: s.recover.ldl }, stageOf('ldl', measured), s.today.medicine);
  const disease = { diabetes: g.stage, hypertension: b.stage, dyslipidemia: l.stage };
  const next = { ...s, disease };
  const onsets = onsetCount(next);

  // 게이지: 포만감은 "오늘 먹은 양". 평가 후 0으로 리셋
  let health = s.gauges.health;
  if (s.gauges.fullness > GAUGE.overfullThreshold) health -= GAUGE.overfullHealthPenalty;
  if (s.gauges.fullness < GAUGE.starvingThreshold) health -= GAUGE.starvingHealthPenalty;
  const fullness = 0;

  let vitality = s.gauges.vitality - GAUGE.vitalityDailyDecay + (act ? act.vitality : 0);
  vitality = clamp(vitality, 0, onsets > 0 ? GAUGE.vitalityCapWhenOnset : 100);
  if (vitality <= 0) health -= GAUGE.exhaustedHealthPenalty;

  health -= GAUGE.healthPerOnset * onsets;
  if (onsets >= 2) health -= GAUGE.healthExtraWhenTwoOnset;
  health = clamp(health, 0, 100);

  const gauges = { fullness, vitality: r1(vitality), health: r1(health) };
  const log = [...s.log, { day: s.day, meals, activity, medicine: s.today.medicine, totals, ratios, bio, gauges: { ...gauges, fullness: s.gauges.fullness }, disease }];

  let ending: PetState['ending'] = 'playing';
  if (health <= 0) ending = 'hospital';
  else if (s.day >= TOTAL_DAYS) ending = 'finished';

  return {
    ...next,
    day: ending === 'playing' ? s.day + 1 : s.day,
    slot: 0,
    gauges,
    bio,
    streak: { glucose: g.streak, bp: b.streak, ldl: l.streak },
    recover: { glucose: g.recover, bp: b.recover, ldl: l.recover },
    today: { meals: [], activity: null, medicine: false },
    log,
    ending,
    updatedAt: now,
  };
}
