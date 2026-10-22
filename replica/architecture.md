# Architecture: 대사 펫 (Krepagotchi 핵심 루프의 교육용 재구성)

replica-architect 템플릿을 따르되, 이 앱은 **서버·DB·인증·결제가 없는 정적 단일 페이지**이므로 "스키마"는 localStorage 상태, "API"는 순수 함수 계약으로 치환한다.

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Vite + TypeScript, 프레임워크 없음, Canvas 2D | 스마트폰 로딩 200 KB 이하 목표. 원본의 Phaser 8 MB 번들을 피함 |
| styling | tokens.css(커스텀 프로퍼티) + Canvas 렌더가 같은 토큰을 읽음 | replica-design 토큰 한 곳만 바꾸면 전체가 바뀜 |
| state | localStorage(스키마 버전 키) | 수업 중 재개 용도. 서버 없음 |
| data | src/data/*.json + config.ts | 근거값과 보정 계수를 코드와 분리, 교사가 조정 |
| tests | vitest (sim/만) | DOM 없는 순수 로직을 빠르게 검증 |
| hosting | GitHub Pages 또는 `vite preview` | 무료, 교실 와이파이 |
| auth / payments / email / jobs | 없음 | 교육용 1인 플레이 |

## Schema (localStorage)

키 `metabolic-pet/v1`, JSON 직렬화. 스키마는 스펙 §4 `PetState`. 접근 규칙: 브라우저 로컬 전용, 개인정보 없음(이름은 학생이 임의 입력, 전송되지 않음).

| 필드 | 타입 | 제약 |
| --- | --- | --- |
| version | 1 | 불일치 시 새 게임 |
| name, sex | string, 'male'\|'female' | sex는 EER 선택(2,700/2,000) |
| day, slot | 1..20, 0..3 | slot 3 = 활동 |
| gauges | fullness ≥0(상한 없음), vitality 0..100, health 0..100 | 발병 시 vitality ≤ 40 |
| bio | glucose, sys, dia, ldl, weight | 음수 금지, 소수 1자리 |
| streak, recover | 지표별 정수 ≥0 | 상태기계 입력 |
| disease | 'none'\|'pre'\|'onset' ×3 | |
| today | meals FoodId[0..3], activity, medicine | |
| log | DayRecord[] (day, meals, activity, medicine, totals, bio, disease) | 결과 타임라인 |
| ending | 'playing'\|'finished'\|'hospital' | |
| startedAt, updatedAt | epoch ms | 타이머 보정 |

## API (순수 함수 계약, `src/sim/`)

| 함수 | does | 입력 | 출력 | flow |
| --- | --- | --- | --- | --- |
| `createState(name, sex, now)` | 초기 상태 | string, Sex, ms | PetState | F01 시작 |
| `chooseMeal(state, foodId \| null)` | 현재 식사 슬롯 채움(null = 거름), slot+1 | | PetState | F02 하루 |
| `chooseActivity(state, activityId)` | 활동 슬롯 채움 | | PetState | F02 |
| `takeMedicine(state)` | 그날 약 복용 표시(발병 중일 때만) | | PetState | F04 치료 |
| `endDay(state)` | 스펙 §5·§6 적용, log 추가, day+1, 엔딩 판정 | | PetState | F02 |
| `applyElapsed(state, now)` | 45 s 단위 경과일 수만큼 거름으로 endDay 반복 | ms | PetState | F03 재개 |
| `checkup(state)` | 검진표(지표 + 지침 라벨) | | Checkup | F05 검진 |
| `summarize(state)` | 결과 화면 데이터(타임라인·퀴즈 정답 근거) | | Summary | F06 결과 |
| `labelGlucose/BP/LDL(value)` | thresholds.json 구간 라벨 | number | Label | F05 |

Webhooks/Jobs: 없음. 타이머는 UI(`requestAnimationFrame`)가 들고 있고 sim에는 시각을 인자로 넘긴다.

## The parts that bite

- **시간**: 1일 45 s 타이머와 실제 시각 보정이 섞이면 중복 진행 위험 → 타이머는 `updatedAt` 하나만 기준으로 하고, `applyElapsed`는 멱등(같은 now로 두 번 불러도 같은 결과).
- **localStorage 실패**(사생활 모드, 용량) → 메모리 모드로 계속, 시작 화면에 표시.
- **보정 계수**: 수치가 너무 빨리/느리게 움직이면 학습이 깨짐 → 시나리오 테스트 (a)~(e)가 계수를 고정하는 역할.
- **터치 대상 크기**: 카드 최소 44×44 px, 하단 안전 영역.
- **이모지 렌더 차이**(기기별) → 카드 아이콘은 이모지 + 텍스트 라벨 병기.

## Build order

1. **Vertical slice**: `sim/` 전체 TDD → Canvas 없이 DOM 텍스트로 G01→G02→G04 한 판 완주(ugly). 테이블: 상태 전체. 함수: 위 9개.
2. **Must-haves** (features.csv): 게이지 틱, 음식 카드 16종, 발병/치료 상태기계, 검진 팝업, 입원 엔딩, 재시작. 화면 G01–G05 Canvas 렌더.
3. **Should-haves**: 타이머 보정 복원, 활동 카드 효과 연출, 증상 말풍선, 모바일 하단 바.
4. **Could-haves**: 펫 걷기 애니메이션, 음악 토글, PWA 캐시.
5. (entrepreneur 단계는 생략 — 교육용)

다음 단계: `/replica-design` → `replica/design/tokens.json`, `components.md`.
