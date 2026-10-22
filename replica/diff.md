# replica-diff: 대사 펫 vs Krepagotchi

기준: `replica/features.csv`(must 8 / should 4 / could 3 / skip 7). Python `parity.py`가 없어 수동 채점. 가중치 must 3 · should 2 · could 1, partial은 절반.

| feature | 우선순위 | 원본 | 클론 | 비고 |
|---|---|---|---|---|
| 첫 실행 이름 입력 | must | yes | **yes** | G01, localStorage |
| 게이지 3개 주기 감소 | must | yes | **yes(치환)** | 50분 틱 → 1게임일(45 s) |
| 먹이기 | must | yes | **yes(치환)** | 먹이 1종 → 음식 16종·영양값·1일 기준치 % |
| 굶거나 외로우면 건강 감소 | must | yes | **yes(치환)** | 결식(<30)·활력 0·발병 질환당 −5 |
| 과식 패널티 | must | yes | **yes(치환)** | 오늘 먹은 양 >130 → 건강 −2, 과잉 열량 → 체중·혈당 |
| 질병 상태(행동 차단·클램프) | must | yes | **yes(치환)** | 무작위 1/5 → 지표 기반 3일/5일 상태기계, 활력 ≤40, 이동 속도 절반 |
| 치료·완치 | must | yes | **yes(치환)** | 알약 +10 → 약 카드 + 식단 교정 3일 병행 |
| 게임오버·재시작 | must | yes | **yes(치환)** | 폭발 → 입원 엔딩, 다시 시작 |
| 오프라인 틱 보정 | should | yes | **yes** | `applyElapsed`: 45 s 단위, 멱등, visibilitychange |
| 쓰다듬기·미니게임(애정) | should | yes | **yes(치환)** | 활동 카드 4종(산책·운동·휴식·밤샘) |
| 증상 이모지·생각 말풍선 | should | yes | **yes** | 질환별 증상 말풍선, 배고픔·과식·피로 |
| 모바일 하단 액션 바 | should | yes | **partial** | 카드 그리드가 화면 하단에 오지만 고정 바는 아님 |
| 펫 걷기 | could | yes | **yes** | Canvas 8×8 자체 도트, 좌우 이동·발병 시 느림 |
| 음악 토글 | could | yes | no | 범위 밖 |
| PWA 설치·오프라인 캐시 | could | yes | no | 범위 밖 |
| 청소·편지·생일·새해·바이옴·날씨·원본 에셋·문구·배포 채널 | skip | yes | skip | 학습 목표와 무관 또는 원작자 소유 |

**점수**: must 8/8 (24/24), should 3.5/4 (7/8), could 1/3 (1/3) → **32/35 = 91%**. must 전부 충족 → 출시 가능 판정(교육용).

**클론에만 있는 것**(점수 제외): 건강검진 표(지침 라벨), 결과 타임라인·퀴즈·출처 버튼, 기준 열량 선택, 면책 문구.

**스윕**: `grep -ri krepa src index.html` → 0건(2026-10-22 확인). 원본 코드·스프라이트·사운드·문구 미사용.

**화면 비교**(`replica/screens/` vs `artifacts/runs/2026-10-20-ui-check/`): 구조는 같음(상단 HUD 3 → 중앙 마당 → 하단 행동), 색·글꼴·도트·문구는 전부 다름. 레이아웃 픽셀 diff(`imgdiff.py`)는 Python 미설치로 생략.
