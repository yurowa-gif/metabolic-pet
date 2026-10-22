# 원본 메커니즘 해체 기록 — krepagotchi-game

- 원본: https://github.com/danielbrendel/krepagotchi-game (MIT, (C) 2025 Daniel Brendel)
- 분석 대상: `reference/krepagotchi-game/public/game/game.js` (3,104줄), 커밋 `03ba55bbd3be6e8e45e25dc50353dfe732c9a1ce`
- 도구: REA `rea-agents@6.5.0` `analyze_javascript_application` (format=directory, source_paths=["game.js"], detail=summary)
  - 부모 증거: `ev_e2f4d9ef0ff258427ae24e51e0d58eb56f918467e1e37aa295cf6da323146d1b` (sha256 `4042457c…500eb`, AST 노드 14,439, 타이머 관계 6, 이벤트 관계 54, 데이터흐름 2,618)
  - 요약 뷰: `ev_2b35e36d…a351b`, 모듈 페이지: `ev_60488295…1eadeb`
  - 증거 번들: `artifacts/runs/2026-10-20-rea-krepa/rea/evidence.json` (9,903,815 bytes, 3 records)
- 정적 분석 한계(REA 명시): 코드를 실행하지 않은 구문 관찰이며 런타임 실행을 증명하지 않음. 아래 수치는 REA 그래프를 길잡이로 삼아 소스 줄을 직접 대조해 확정함.
- 생략한 단계: REA `observe_web_session`/`capture_web_screenshot`은 CDP 엔드포인트(원격 디버깅 Chrome)가 필요해 수행하지 않음. 화면 캡처는 Playwright MCP로 `replica/screens/`에 저장.

## 클린룸 판단
replica-recon 규칙은 "원본 JS 번들을 읽지 말 것"이지만, 이는 타인의 비공개 IP 보호가 목적이다. 본 원본은 MIT 라이선스 공개 소스이므로 읽기는 허용된다. 다만 **코드·스프라이트·사운드·문구는 복사하지 않고 규칙·수치·흐름만 차용**하는 원칙은 유지한다. 새 게임 저장소에는 "krepa" 문자열이 남지 않아야 한다(스윕 대상).

## 1. 상태값 (game.js:519-523, 2097-2104)
| 키 | 초기값 | 범위 | 저장 키(localStorage) |
|---|---|---|---|
| full (포만) | 100 | 0 ~ 100 초과 가능(먹이면 계속 증가) | `krepa_stats_full` |
| affection (애정) | 100 | 0 ~ 100 (addAffection에서 100 클램프) | `krepa_stats_affection` |
| health (건강) | 100 | 0 ~ 100 (치료 시 100 클램프) | `krepa_stats_health` |
| sick (질병 플래그) | false | bool | `krepa_sick` |
| 마지막 갱신 시각 | — | epoch ms | `updated_timestamp` |
| 이름 / 생일 / 나이 | — | — | `krepa_name`, `krepa_birthdate`, `krepa_agecount`, `krepa_agecheck` |

## 2. 상수 (game.js:1-12)
| 상수 | 값 | 의미 |
|---|---|---|
| FOOD_ADD_COUNT | 10 | 먹이 1개당 full 증가 |
| HUNGER_VALUE | 5 | 배고픔 틱당 full 감소 |
| AFFECTION_VALUE | 4 | 애정 틱당 감소 / 쓰다듬기 증가량 |
| HEALTH_VALUE | 10 | 치료(알약) 1회 health 증가 |
| TIME_HUNGERCHECK | 3,000,000 ms (50분) | 배고픔 틱 주기 |
| TIME_AFFECTIONCHECK | 3,000,000 ms (50분) | 애정 틱 주기 |
| TIME_HEALTHCHECK | 4,000,000 ms (66.7분) | 건강 틱 주기 |
| TIME_POOPCHECK | 5,000,000 ms (83.3분) | 배설물 패널티 주기 |
| TIME_OVERWEIGHTCHECK | 10,000 ms (10초) | 과체중 검사 주기 |

## 3. 틱 규칙
| 틱 | 규칙 | 줄 |
|---|---|---|
| 배고픔 | `full > 0`이면 `full -= 5`, 0 미만이면 0 | 2630-2641 |
| 애정 | `affection > 0`이면 `affection -= 4`, 0 미만이면 0 | 2617-2628 |
| 건강 | `full <= 0 || affection <= 0`이면 `health -= 1`(0 하한). `health <= 0`이면 게임오버(explodeKrepa) + 건강 타이머 정지 | 2592-2615 |
| 배설물 | 배설물 개수 n > 0이면 `health -= 2n` | 2661-2668 |
| 과체중 | 10초마다 `full > 100`이면 `health -= 2`, 이동속도 1/2, 흔들림 애니메이션; 아니면 원복 | 2643-2659 |

## 4. 행동 규칙
| 행동 | 효과 | 조건 | 줄 |
|---|---|---|---|
| 먹이 주기 | 먹이 스폰 → 펫이 접근해 먹으면 `full += 10`; `full >= 123`이면 `health -= 5`; 즉시 과체중 검사 | 아프지 않을 때만 | 2120-2145 |
| 쓰다듬기 | `affection += 4` (100 상한) | 아프지 않고, 놀이 중이 아닐 때 | 1477-1492 |
| 공놀이 | 공 근접 시 `affection += 4`, `full -= 5` (3초 쿨다운) | 아프지 않고 affection < 100 | 1990-2017 |
| 비눗방울 | 터뜨릴 때마다 `affection += 2` | — | 1923-1931 |
| 청소 | 배설물 1개 제거 | 배설물 있을 때 | 1497-1507 |
| 치료(알약) | `health += 10` (100 상한). 아픈 상태에서 100 도달 시 완치(cureKrepa: sick=false) | health < 100 | 1511-1535, cureKrepa |

## 5. 질병
- 발병: 게임을 열 때(초기 메시지 이후) `krepa_sick == 1`이거나 **1/5 확률**로 발병 (game.js:918-921). 식단과 무관한 무작위.
- 발병 효과(setKrepaSick, 2481-2500): `health`를 20으로, `full`을 30으로, `affection`을 40으로 **상한 클램프**; 이모지 표시(🤒😷🤕🤢🤮🤧), 재채기 타이머.
- 아픈 동안: 먹이·쓰다듬기·공놀이 불가(각 핸들러의 `!krepaSick` 가드).
- 완치: 알약으로 health가 100에 도달할 때만.

## 6. 오프라인 보정 (adjustStatsTimeGap, 2990-3015)
```
diff = now - updated_timestamp
for i in round(diff / TIME_AFFECTIONCHECK): affectionCheck()
for i in round(diff / TIME_HUNGERCHECK):    hungerCheck()
for i in round(diff / TIME_POOPCHECK):      poopCheck()
for i in round(diff / TIME_HEALTHCHECK):    healthCheck()
```
- 순서: 애정 → 배고픔 → 배설물 → 건강. 건강 틱이 마지막이므로 오프라인 중 full/affection이 0이 된 뒤의 건강 감소가 반영된다.
- `updated_timestamp`는 updateTime()에서 `Date.now()`로 갱신.

## 7. 게임오버·재시작
- health ≤ 0 → explodeKrepa: 이동 정지, 깜빡임 후 폭발, 생일·사망일 안내 대화상자 → restartGame(3016-3025): full/affection/health=100, 생일=now, 이름 초기화.

## 8. 화면·흐름 (스크린샷: replica/screens/)
- S01 랜딩(www.krepagotchi.com): 소개·기능 목록·Play 링크(game.krepagotchi.com)·다운로드.
- S02 게임 첫 실행: 초기 안내 대화상자("Feed it / Clean it / Give it affection / Heal it if required"), 이름 입력.
- S03 메인: 상단 HUD(애정 ♥ / 포만 🍖 / 건강 ✚ 숫자), 중앙 펫 + 환경, 하단 메뉴(먹이·손·빗자루·알약 + 설정).

## 9. 새 게임으로의 치환 지도 (요약)
| 원본 | 대사 펫 |
|---|---|
| 50분 틱 | 게임 1일(45초) 틱 |
| full / affection / health | 포만감 / 활력 / 건강 (동일 0~100) |
| 먹이 1종 +10 | 음식 카드 12종, 열량·당류·나트륨·포화지방·식이섬유 |
| 무작위 1/5 발병 | 지표 기준 초과 3일 → 전단계, 5일 → 발병(결정적, 식단 기반) |
| 발병 시 stat 클램프 | 발병 시 활력 상한 클램프 + 이동 느려짐 (차용) |
| 알약 +10, 100에서 완치 | 약 카드 + 식단 교정 병행 시 수일에 걸쳐 회복 |
| 과체중(full>100 → health −2) | 과잉 열량 → 체중 ↑ → 인슐린 저항성 ↑ (인과 모델) |
| 배설물·청소 | 생략 |
| 폭발 엔딩 | 2개 이상 동시 발병 → '입원' 엔딩 |
| 오프라인 보정 | 동일 공식, 수업 중 재개 용도 |
