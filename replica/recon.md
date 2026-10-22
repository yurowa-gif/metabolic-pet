# Recon map: Krepagotchi (web / PWA)

Scope: 가상 펫 핵심 루프(먹이기·돌보기·질병·치료·게임오버)와 그 수치 규칙. 편지·생일·날씨·바이옴 등 분위기 기능은 범위 밖.
For: 고등학생 수업용 대사성 질환 학습 게임 "대사 펫"(가제)의 뼈대로 차용. 상업 클론 아님.
Date: 2026-10-20

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | 마케팅/랜딩 | https://www.krepagotchi.com | 기능 목록 17개, 스크린샷 3장, 소개 문단 |
| 2 | 라이브 게임 | https://game.krepagotchi.com | 공개 웹 게임. 이름 입력 → 메인 화면. 계정 없음 |
| 3 | 공개 소스(MIT) | https://github.com/danielbrendel/krepagotchi-game | README 기능 목록, `public/game/game.js` 규칙 수치 → `replica/mechanics.md` |
| 4 | REA 정적 분석 | artifacts/runs/2026-10-20-rea-krepa/rea/evidence.json | 타이머 6·이벤트 54·데이터흐름 2,618 관계 |
| 5 | 스크린샷 | replica/screens/S01~S03 | 참고용, 클론에 넣지 않음 |

## Core loop

펫의 포만·애정·건강 세 게이지가 시간에 따라 줄어들고, 플레이어가 먹이·쓰다듬기·청소·치료로 되돌려 펫을 살려 둔다.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | 랜딩 | www.krepagotchi.com | 소개·기능·플레이/다운로드 링크 | 히어로 배너, 기능 3열 목록, CTA 링크, 유튜브 임베드 | 데스크톱 |
| S02 | 이름 입력 | game.krepagotchi.com 첫 실행 | 펫 이름 저장(localStorage) | 모달 카드(로고·제목), 텍스트 입력(기본값), Save 링크 | 첫 실행(모바일 375px) |
| S03 | 메인 | 이름 저장 후 | 돌보기 루프 | 상단 HUD(♥ 애정·🍖 포만·😷 건강 숫자), 바이옴/도움 버튼, 울타리 마당 + 펫(이름 라벨), 초기 안내 대화상자, 하단 메뉴 4버튼(먹이·손·빗자루·알약), 음악 토글, 편지함 | 초기 대화상자 표시 상태. 아픔·과체중·폭발 상태는 소스로만 확인 |
| S04 | 게임오버 대화상자 | health ≤ 0 | 생일·사망일 표시, 재시작 | 텍스트 대화상자, 재시작 액션 | 소스로만 확인(explodeKrepa) |

## Flows

```
F01 펫 돌보기(핵심)
    S03 → 메뉴 버튼 → 게이지 변화 → S03
    happy path clicks: 1 (버튼 1회)
    edge: 아픈 상태(먹이·쓰다듬기 차단), 포만 123 이상(건강 감소), 공놀이 중(쓰다듬기 차단)

F02 질병 → 치료
    (게임 재진입 시 1/5 확률) S03 아픔 표시 → 알약 반복(health +10) → 100 도달 시 완치
    happy path clicks: 최대 8 (health 20 → 100)
    edge: 알약은 health < 100일 때만, 아픈 동안 다른 행동 불가

F03 이탈 후 복귀
    닫기 → 시간 경과 → 재진입 시 adjustStatsTimeGap로 틱 일괄 적용 → S03
    edge: updated_timestamp 없음(첫 실행), 장기 이탈 시 health 0 → S04

F04 게임오버 → 재시작
    S03(health 0) → 폭발 연출 → S04 → 재시작(스탯 100, 생일 갱신) → S02
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| 게이지 카운터 | 아이콘+숫자 (애정/포만/건강) | 기본, 증가(초록 깜빡), 감소(빨강 깜빡) | S03 |
| 메뉴 버튼 | 먹이, 손, 빗자루, 알약 | 기본, hover 확대, 무효(효과음만) | S03 |
| 대화상자 | 안내, 게임오버, 편지 | 표시/닫힘 | S02·S03·S04 |
| 말풍선 | 생각, 증상 이모지 | 표시/숨김 | S03 |
| 펫 스프라이트 | 보통, 과체중(가로 1.5배), 아픔(이모지), 폭발 | 걷기, 정지, 드래그 | S03 |

## Inferred data model

```
PetState   name, birthdate, full(0..∞), affection(0..100), health(0..100), sick(bool),
           updated_timestamp, agecount, agecheck, music_enable, initmsg
           evidence: game.js localStorage 키(mechanics.md §1), S02 입력, S03 HUD
           confidence: high (소스 확인)
Tick       hunger(50m, -5), affection(50m, -4), health(66.7m, -1 if starving/unloved), poop(83m, -2n), overweight(10s, -2 if full>100)
           evidence: game.js:1-12, 2592-2668
           confidence: high
Action     feed(+10 full), pet(+4 aff), ball(+4 aff/-5 full), bubble(+2 aff), clean, pill(+10 health)
           evidence: game.js 1477-1535, 1923-1931, 2120-2145
           confidence: high
```

Relationships: PetState 1-n Tick(시간), PetState 1-n Action(입력). 서버 없음, 전부 클라이언트 localStorage.

## Feature matrix

See `features.csv`. Must 8, should 4, could 3, skip 7.

## Out of scope (cannot or should not be cloned)

- 픽셀 아트·사운드·문구(원작자 저작물, MIT라도 "새로 만듦" 원칙상 미사용)
- 편지 보내기/받기(서버 측 기능), 바이옴·날씨·생일·새해 이벤트(분위기 기능)
- itch.io 등 외부 배포 채널

## Size

Screens 4, flows 4, entities 3. Hard parts: (1) 질환 상태기계의 근거 기반 보정, (2) 20분 안에 끝나는 시간 압축, (3) 스마트폰 Canvas 입력. Size: M (수 주 분량이나 교육용 축소판은 S~M).

다음 단계: `/replica-architect` — 단, 기능표를 대사성 질환 메커니즘으로 치환한 설계(계획 2절)로 진행.
