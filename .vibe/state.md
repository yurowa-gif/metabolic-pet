# 대사 펫 (가제) — 작업 상태

## 목표
고등학생 수업용(스마트폰, 1차시 15~20분) 생명과학 I '물질대사' 중 대사성 질환 학습 게임. 고전 다마고치 규칙을 빌려 새로 제작. 공신력 있는 진료지침·영양 DB 근거를 따름.

## 담당
- Claude Code(이 세션): 총괄·설계·REA 분석·sim 로직·UI 구현
- 도구: replica-skill(.claude/skills/replica-*), REA MCP(rea-agents 6.5.0)

## 기준
- 계획: C:\Users\user\.claude\plans\pc-reflective-eclipse.md
- 분석 원본: reference/krepagotchi-game (MIT, 읽기 전용, 커밋 제외)

## 변경 파일
- replica/{mechanics,recon,architecture}.md, features.csv, design/{tokens.json,components.md,contrast-report.txt}
- docs/evidence.md, docs/superpowers/specs/2026-10-20-metabolic-pet-design.md
- package.json, tsconfig.json, vite.config.ts, index.html, scripts/{contrast,tokens-css}.mjs
- src/data/{foods.json,thresholds.json,config.ts,quiz.ts,texts.ts}
- src/sim/{types,state,food,labels,disease,engine,catchup,checkup}.ts + *.test.ts
- src/storage/local.ts + test, src/ui/{tokens.css,styles.css,dom,pet,cards,timeline,screens,app}.ts, src/main.ts
- artifacts/runs/2026-10-20-{rea-krepa,evidence}/

## 실제 검사
- npx vitest run: 8 files 47 tests 통과 / npx tsc --noEmit 통과 / npx vite build 약 43 KB
- 브라우저(모바일 375×812) 수동 검증: 시작→하루 루프→45초 자동 진행→5일차 검진 팝업→발병 시 약 카드→20일 결과 화면, 콘솔 오류 0 (artifacts/runs/2026-10-20-ui-check/)
- node scripts/contrast.mjs: 13쌍 AA 통과, krepa 문자열 스윕 0건

## 문제
- Python 미설치 → replica 보조 스크립트 사용 불가(스킬 본체는 동작)

## 다음 작업
- (완료) 커밋은 사용자 요청 시. 선택: GitHub Pages 배포, Galmuri 픽셀 글꼴 self-host, PWA 캐시
