# 대사 펫 (가제) 설계 스펙

작성일 2026-10-20 · 상태: 승인(2026-10-20). 구현 중 보정 반영: 간식 슬롯 추가(하루 식사 4회), 에너지 대표 비율 0.5, 포만감을 일일 게이지로 변경, 활동 효과 기준선 클램프, UI는 Canvas(펫 마당) + DOM(카드·표·대화상자) 혼합.

## 1. 목적과 성공 기준
- 대상: 고등학생, 생명과학 I "사람의 물질대사" 단원의 **대사성 질환**(당뇨병·고혈압·이상지질혈증).
- 환경: 학생 스마트폰 브라우저(세로 375×812 기준), 1차시 15~20분에 한 판 완결, 설치 없음, 서버 없음.
- 성공 기준: 한 판을 마친 학생이 (1) 어떤 식습관이 어떤 질환으로 이어지는지, (2) 전단계에서 되돌리는 방법과 발병 후 회복 조건의 차이를 검진표의 실제 기준값을 들어 설명할 수 있다.
- 비목표: 영양소 소화·흡수 경로 학습, BMI 판정, 약물 기전, 다인 플레이, 서버 저장.

## 2. 차용한 원본 규칙 (replica/mechanics.md 요약)
krepagotchi-game(MIT)의 세 게이지(포만·애정·건강), 주기 틱 감소, 과식 패널티, 질병 시 행동 차단과 상한 클램프, 치료 후 완치, 오프라인 틱 보정, 게임오버·재시작을 **규칙 수준에서만** 차용한다. 코드·에셋·문구는 쓰지 않는다. 치환표는 mechanics.md §9.

## 3. 게임 루프
```
시작 화면 → [하루 루프 ×20] → 결과 화면(검진표·타임라인·퀴즈)
하루 루프: 아침 → 점심 → 저녁 → 간식 → 활동 → (5·10·15·20일차) 건강검진 팝업
```
- 1일 = 최대 45초. 5개 슬롯(식사 4 + 활동 1)을 모두 고르면 즉시 다음 날, 45초가 지나면 남은 슬롯은 "거름"으로 처리하고 넘어간다. 20일 × 45초 = 15분 상한.
- 간식 슬롯을 둔 이유: DB 1인분 3끼만으로는 에너지필요추정량에 닿지 않아 "과잉 열량 → 체중" 경로가 작동하지 않았다(구현 중 확인).
- 입원 엔딩(§6)이 나면 즉시 결과 화면으로 간다.

## 4. 상태 모델
```ts
type Sex = 'male' | 'female';                 // 에너지필요추정량 선택용(2,700 / 2,000 kcal)
interface PetState {
  name: string; sex: Sex; day: number;        // day 1..20
  slot: 0|1|2|3;                              // 0 아침, 1 점심, 2 저녁, 3 활동
  gauges: { fullness: number; vitality: number; health: number }; // 0..100 (fullness는 100 초과 허용)
  bio: { glucose: number; sys: number; dia: number; ldl: number; weight: number }; // mg/dL, mmHg, mg/dL, kg
  streak: { glucose: number; bp: number; ldl: number };          // 전단계 기준 이상인 연속 일수
  recover: { glucose: number; bp: number; ldl: number };         // 회복 조건 충족 연속 일수
  disease: { diabetes: Stage; hypertension: Stage; dyslipidemia: Stage }; // 'none'|'pre'|'onset'
  today: { meals: FoodId[]; activity: ActivityId|null; medicine: boolean };
  log: DayRecord[];                           // 날짜별 섭취 합계·활동·지표·단계
  ending: 'playing' | 'finished' | 'hospital';
  startedAt: number; updatedAt: number;       // epoch ms (localStorage)
}
```
- 초기값: fullness 70, vitality 80, health 100, glucose 90, sys 112, dia 72, ldl 95, weight 60.
- 기준값은 `src/data/thresholds.json`, 음식은 `src/data/foods.json`, 보정 계수는 `src/data/config.ts`.

## 5. 하루 계산 (순수 함수 `endDay(state) → state`)
### 5.1 섭취 합계
- 각 식사 카드: `per100 × serving_g / 100`. 합계 `kcal, sugar_g, sodium_mg, satFat_g, fiber_g`.
- 비율(1 = 기준선): `rE = kcal / (EER×0.5)`, `rSugar = sugar_g×4 / (0.10×EER)`, `rSat = satFat_g×9 / (0.08×EER)`, `rNa = sodium_mg / 2300`, `fiberFactor = clamp(1 − 0.3×fiber_g/25, 0.7, 1)`.
  - 근거: 첨가당 10%E 이내(총당류 적정비율 10–20%E의 보수적 한계)·포화지방 8%E 미만·나트륨 2,300 mg(2025 KDRIs 15–18세), 식이섬유 25 g(1일 기준치).
  - 에너지 대표 비율 0.5: 게임의 하루 4회 선택(DB 1인분)이 실제 하루 섭취의 절반을 대표한다는 가정(남 1,350 / 여 1,000 kcal 기준). docs/evidence.md §5.

### 5.2 지표 변화 (config 기본값, 전부 조정 가능)
| 지표 | 상승(비율 > 1) | 회복(비율 ≤ 1) | 활동 |
|---|---|---|---|
| glucose | `+16×(rSugar−1)×fiberFactor + 3×max(rE−1,0) + 0.5×max(weight−60,0)` | 기준선 90 쪽으로 거리의 8% | 산책 −2, 운동 −4 |
| sys / dia | `+10×(rNa−1)` / `+6×(rNa−1)` | 112/72 쪽으로 8% | 산책 −1/−1, 운동 −2/−1 |
| ldl | `+10×(rSat−1) + 3×max(rE−1,0)` | 95 쪽으로 8% | 운동 −2 |
| weight | `+0.5×(rE−1)` (하루 +0.3 / −0.1 kg 제한) | 동일 식 (음수면 감소) | 산책 −0.05, 운동 −0.1 |
- 상승 항은 비율이 1을 넘을 때만 적용(`max(·,0)`), 회복 항은 그날 해당 비율이 1 이하일 때 적용. 활동 효과는 지표를 기준선 아래로 내리지 않는다(저혈당·저혈압 연출 방지).
- 보정 목표: 매일 기준의 1.5배를 먹으면 약 5게임일에 전단계 경계를 넘고(혈당 90→126은 약 6일), 기준 이하로 5일 유지하면 전단계 범위에서 벗어난다. 이 계수는 문헌값이 아니라 수업용 보정(docs/evidence.md §5).
- 약 카드(발병 후에만 표시, 활동 슬롯과 별개로 하루 1회): 그날 glucose −15, sys/dia −10/−6, ldl −25. 약은 그날 값만 내리므로 다음 날 비율이 1을 넘으면 다시 오른다 → "약 + 식단 교정 병행" 조건이 자연히 성립.

### 5.3 게이지
- fullness("오늘 먹은 양", 하루 기준 섭취량 = 100): 식사마다 `+25 × kcal_meal / (EER×0.5/4)`. 하루 끝에 130 초과면 health −2(원본 과체중 규칙 차용), 30 미만이면 health −1(결식), 평가 후 0으로 리셋.
- vitality: 하루 −10. 활동: 산책 +5, 운동 +15, 휴식 +10, 밤샘 −25. 0이면 health −1. 발병 질환이 하나라도 있으면 상한 40(원본 클램프 차용).
- health: 발병 질환 1개당 하루 −5. 발병 2개 이상이면 추가 −10. 0 이하 → 입원 엔딩.

## 6. 질환 상태기계 (지표별 동일 구조)
```
전단계 기준(pre): glucose ≥100 | sys ≥120 또는 dia ≥80 | ldl ≥130
발병 기준(onset): glucose ≥126 | sys ≥140 또는 dia ≥90 | ldl ≥160
none  --(pre 이상 3일 연속)-->  pre
pre   --(onset 이상 5일 연속, pre 진입일부터 누적)-->  onset
pre   --(pre 미만 3일 연속)-->  none
onset --(그날 약 복용 AND 값 < onset, 3일 연속)-->  pre
```
- streak는 pre 이상인 날 +1, 미만이면 0. recover는 조건 충족일 +1, 아니면 0.
- 발병 시 효과: 활력 상한 40, 펫 이동 속도 절반, 증상 말풍선(당뇨: "목이 자꾸 말라", 고혈압: "머리가 무거워", 이상지질혈증: 증상 없음을 명시 "아무 느낌이 없는데 검진표가 이상해").
- 입원 엔딩: health ≤ 0. (발병 2개 동시면 health −15/일이라 수일 내 도달.)

## 7. 화면
| ID | 화면 | 내용 |
|---|---|---|
| G01 | 시작 | 이름 입력, 기준 열량 선택(남 2,700 / 여 2,000), 면책 문구("교육용 모델, 의료 조언 아님"), 시작 |
| G02 | 하루 루프 | 상단: 날짜·남은 시간·게이지 3개. 중앙: 펫(걷기/느림/증상 말풍선). 하단: 현재 슬롯의 카드 6장(음식 16종 중 매 슬롯 무작위 6장, 거르기 포함) 또는 활동 4장(+약 카드) |
| G03 | 건강검진 | 5일마다 팝업: 공복혈당·혈압·LDL·체중 표 + 지침 구간 라벨(정상/주의/전단계/…)과 색, "출처" 버튼 |
| G04 | 결과 | 최종 검진표, 20일 타임라인(식단 로그 아이콘 + 지표 꺾은선 3개), 퀴즈 3문항(정답·해설), 캡처 안내 |
| G05 | 입원 엔딩 | 사유(어떤 질환이 겹쳤는지), 타임라인, 재시작 |

## 8. 모듈 구조
```
src/sim/   state.ts(초기화·타입)  food.ts(합계·비율)  activity.ts  disease.ts(상태기계)  endDay.ts(§5)  catchup.ts(타이머 경과 보정)
src/data/  foods.json  thresholds.json  config.ts(계수·시간·초기값, 각 값에 근거 주석)  quiz.ts  texts.ts(말풍선·문구)
src/ui/    app.ts(화면 전환)  render.ts(Canvas 2D 픽셀 렌더)  input.ts(터치)  screens/*.ts
src/storage/ local.ts(localStorage 저장·복원, 스키마 버전)
```
- `sim/`은 DOM·시간에 의존하지 않는다(시간은 인자로 받음). UI는 sim 결과만 그린다.
- 오프라인 보정: 복원 시 `elapsed = now − updatedAt`; 45초 단위로 경과한 날 수만큼 "거름"으로 `endDay`를 반복(원본 `round(diff/period)` 차용, 최대 20일).

## 9. 오류 처리
- localStorage 접근 실패(사생활 모드) → 메모리로만 진행하고 시작 화면에 "저장 안 됨" 표시.
- 저장 스키마 버전 불일치 → 새 게임으로 시작.
- 데이터 파일 검증: 시작 시 `foods.json` 각 항목의 숫자 필드·serving_g 존재를 검사하고 실패하면 콘솔 오류 + 해당 카드 제외.

## 10. 테스트 (vitest, `src/sim/**`)
- 단위: 섭취 합계·비율, 지표 수식(상승/회복/활동/약), 게이지 규칙, 상태 전이(pre/onset/회복), 입원 조건, 타이머 보정.
- 시나리오: (a) 콜라·떡볶이 위주 5~6일 → 당뇨 발병, (b) 라면·김밥 위주 5일 → 고혈압 발병, (c) 전단계에서 현미밥·샐러드·운동 3일 → none 복귀, (d) 발병 후 약 없이 식단만 → onset 유지, 약+식단 3일 → pre 복귀, (e) 20일 균형 식단 → 질환 없음·정상 라벨.
- UI: 브라우저 페인 모바일 프리셋에서 한 판 수동 플레이, 검진 라벨이 thresholds.json과 일치하는지 확인.

## 11. 산출물·배포
- `npm run build` → `dist/` 정적 파일(목표 200 KB 이하). GitHub Pages 또는 교실 와이파이에서 `vite preview`.
- 문서: `docs/evidence.md`(근거), `docs/teacher-guide.md`(수업 운영·면책·조정 가능한 계수), 결과 화면 "출처" 버튼은 evidence.md의 §1–2를 요약해 표시.
