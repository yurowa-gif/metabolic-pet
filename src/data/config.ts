/**
 * 게임 보정 계수·시간·초기값. 근거: docs/evidence.md §5 "모델 가정".
 * 임상 기준값은 thresholds.json, 음식은 foods.json에 있고 여기서는 "게임 속도"만 정한다.
 */
export const DAY_MS = 45_000; // 1게임일 = 45초 (20일 ≈ 15분)
export const TOTAL_DAYS = 20;
export const MEAL_SLOTS = 4; // 아침·점심·저녁·간식
export const MEAL_NAMES = ['아침', '점심', '저녁', '간식'] as const;

/** 에너지필요추정량(kcal/일), 2025 KDRIs 15–18세 */
export const EER = { male: 2700, female: 2000 } as const;

/**
 * 게임의 하루 4회 선택(DB 1인분 기준)이 실제 하루 섭취의 몇 %를 대표하는지. 음료·군것질 등 미모델 섭취를 보정하는 가정.
 * rE = kcal / (EER × ENERGY_COVERAGE). 당류·포화지방의 %E 한계는 EER 전체 기준으로 계산한다.
 */
export const ENERGY_COVERAGE = 0.5; // 4회 선택 기준 섭취량: 남 1,350 / 여 1,000 kcal

/** 하루 기준선. 비율 1.0 = 기준 딱 맞춤 */
export const LIMITS = {
  sugarPctEnergy: 0.1, // 첨가당 10%E 이내·총당류 적정비율 하한 10%E (2025 KDRIs). 가당음료 저감 권고를 반영해 보수적 한계 사용
  satFatPctEnergy: 0.08, // 포화지방산 8%E 미만 (2025 KDRIs 15–18세)
  sodiumMg: 2300, // 만성질환위험감소섭취량 (2025 KDRIs)
  fiberG: 25, // 1일 영양성분 기준치 (식약처)
  fiberDamping: 0.3, // 식이섬유 25 g 섭취 시 혈당 상승 30% 완화 (게임 가정)
} as const;

/** 지표 초기값(건강한 청소년 가정) */
export const BASELINE = { glucose: 90, sys: 112, dia: 72, ldl: 95, weight: 60 } as const;

/** 상승 계수(비율 초과분 1.0당 하루 변화) — 문헌값이 아닌 수업용 보정 */
export const RISE = {
  glucosePerSugar: 16,
  glucosePerEnergy: 3,
  glucosePerKg: 0.5, // 체중(kg) 증가분당 공복혈당 상승 (인슐린 저항성 상징)
  sysPerSodium: 10,
  diaPerSodium: 6,
  ldlPerSatFat: 10,
  ldlPerEnergy: 3,
  weightPerEnergy: 0.5,
  weightGainCap: 0.3, // kg/일
  weightLossCap: 0.1, // kg/일 (급격한 감량 방지)
} as const;

/** 회복: 그날 해당 비율 ≤ 1이면 기준선까지 거리의 이 비율만큼 돌아감 */
export const RELAX = 0.08;

/** 활동 효과 */
export const ACTIVITY = {
  walk: { glucose: -2, sys: -1, dia: -1, ldl: 0, weight: -0.05, vitality: 5 },
  exercise: { glucose: -4, sys: -2, dia: -1, ldl: -2, weight: -0.1, vitality: 15 },
  rest: { glucose: 0, sys: 0, dia: 0, ldl: 0, weight: 0, vitality: 10 },
  allnighter: { glucose: 0, sys: 0, dia: 0, ldl: 0, weight: 0, vitality: -25 },
} as const;
export type ActivityId = keyof typeof ACTIVITY;

/** 약 카드: 그날 값만 내림 (약물명·기전 없음) */
export const MEDICINE = { glucose: -15, sys: -10, dia: -6, ldl: -25 } as const;

/** 게이지 */
export const GAUGE = {
  /** 포만감 = "오늘 먹은 양"(하루 기준 섭취량 = 100). 한 끼가 (EER×COVERAGE)/4 이면 +25. 하루 끝에 평가 후 0으로 리셋 */
  fullnessPerMeal: 25,
  overfullThreshold: 130, // 초과 시 health −2 (원본 과체중 규칙 차용)
  overfullHealthPenalty: 2,
  starvingThreshold: 30, // 미만 시 health −1 (결식)
  starvingHealthPenalty: 1,
  vitalityDailyDecay: 10,
  exhaustedHealthPenalty: 1,
  vitalityCapWhenOnset: 40, // 원본 질병 클램프 차용
  healthPerOnset: 5,
  healthExtraWhenTwoOnset: 10,
} as const;

/** 질환 상태기계 일수 */
export const STAGE_DAYS = { toPre: 3, toOnset: 5, preToNone: 3, onsetToPre: 3 } as const;

export const INITIAL_GAUGES = { fullness: 70, vitality: 80, health: 100 } as const;
