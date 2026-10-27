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
- 2026-10-25: npm test 9 files 50 tests 통과, npm run build 통과, build-sheet 무추가 실행 시 시트 픽셀 동일, 가짜 6번째 종 합치기·걷기 프레임 시험 후 원복
- 배포: https://yurowa-gif.github.io/metabolic-pet/ HTTP 200, 모바일 화면 동작·콘솔 오류 0 (artifacts/runs/2026-10-25-deploy/)

## 문제
- Python 미설치(replica 보조 스크립트 불가)
- YouTube 자막 요청 IP 차단(2026-10-25)

## 다음 작업
- 공개 저장소 yurowa-gif/metabolic-pet: codex/metabolic-pet(imjin 제외 재구성 df528c1), gh-pages(dist). 로컬 ref: refs/public/*, remote public
- 공룡 10종(카르노 포함) 반영 완료·미커밋, 재배포 전. pixelize에 칸 범위 인자 추가
- 알만툴 강좌 1~13화 노트 docs/learning/rpgmaker-mv-course-notes.md. 14~22화는 YouTube 자막 IP 차단으로 보류
- 이후: 유니티 학습, 오픈소스 엔진 REA, PRD·계획 재작성(전투·RPG-JS)
