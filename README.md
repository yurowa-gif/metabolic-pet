# 대사 펫 (metabolic-pet)

고전 다마고치 규칙을 빌려 새로 만든 고등 생명과학 학습 게임. 20일 동안 펫에게 먹이고 움직이게 하면서 식생활이 당뇨병·고혈압·이상지질혈증으로 이어지는 과정을 검진표의 실제 기준값으로 배운다.

- 대상: 고등학생, 학생 스마트폰 브라우저, 1차시 15~20분
- 근거: 대한당뇨병학회(2023)·대한고혈압학회(2022)·한국지질·동맥경화학회(2022) 진료지침, 2025 한국인 영양소 섭취기준, 식약처 1일 영양성분 기준치·K-FIND 영양 DB → `docs/evidence.md`
- 교육용 가속 모델이며 의료 조언이 아님

## 실행
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest (sim 로직 46개)
npm run build      # dist/ (약 43 KB)
```

## 구조
- `src/sim/` 순수 시뮬레이션(하루 계산·질환 상태기계·검진·요약), `src/data/` 근거값·음식·보정 계수·퀴즈·문구, `src/ui/` Canvas 펫 + DOM 화면, `src/storage/` localStorage
- `docs/` 스펙·근거·교사용 안내, `replica/` 원본 분석(mechanics·recon·architecture·design·diff), `artifacts/runs/` 증거(REA 번들·지침 발췌·영양 DB 응답·스크린샷)

## 공룡 그림
- 펫은 공룡 5종(스테고·트리케라·브라키오·티라노·랩터) 중에서 고른다.
- 그림은 GPT 이미지 모델(Codex CLI `image_generation`, ChatGPT 로그인 할당량)로 한 장의 시트를 만들고, `scripts/pixelize.mjs`로 마젠타 배경 제거·스프라이트 분리·7 px 격자 복원·16색 이하로 정리했다. 프롬프트와 원본 이미지는 `artifacts/runs/2026-10-23-dino-gen/`.
- 특정 작가 스타일을 지정하거나 참고 그림을 입력하지 않았다. 시트를 불러오지 못하면 `src/ui/dinos.ts`의 손으로 찍은 도트로 대체한다.
- 걷기: `scripts/walkframe.mjs`가 다리 묶음을 번갈아 1 px 들어 올린 프레임 2장(`dinos_walk_b/c.png`)을 만들고, 게임은 기본 → 뒷다리 → 기본 → 앞다리 순으로 보여 준다. GPT 이미지로도 걷기 자세를 시도했지만 몸 비율이 원본과 달라져 쓰지 않았다(`artifacts/runs/2026-10-23-dino-walk/`).

```bash
node scripts/pixelize.mjs artifacts/runs/2026-10-23-dino-gen/dinos_sheet.png <outDir>
```

## 원본과 라이선스
규칙은 [krepagotchi-game](https://github.com/danielbrendel/krepagotchi-game)(MIT)에서 차용했고 코드·에셋·문구는 사용하지 않았다. 분석 도구: [REA](https://github.com/morluto/rea), [replica-skill](https://github.com/Jakeschincariol/replica-skill)(MIT, `.claude/skills/`에 복사).
