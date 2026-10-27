# 새 공룡 5종 추가 (스피노·안킬로·파라사우·파키·이구아노)

프로젝트 규칙상 이미지 생성은 사용자가 Codex CLI 할당량으로 직접 실행한다.

1) 이미지 생성 (PowerShell 5.1, 이 폴더에서 실행)
   Set-Location C:\Users\user\projects\game\artifacts\runs\2026-10-25-dino-more
   Get-Content -Raw prompt.txt | codex.cmd exec --skip-git-repo-check --sandbox workspace-write -C . -i style_reference.png -o last-message.txt -
   (codex.cmd를 쓰는 이유: PowerShell 실행 정책이 codex.ps1 실행을 막기 때문)

2) 결과 확인: dinos_more_sheet.png 에 5마리가 서로 겹치지 않고 마젠타 배경 위에 있는지 본다.

3) 정리·합치기 (저장소 루트에서)
   node scripts/pixelize.mjs artifacts/runs/2026-10-25-dino-more/dinos_more_sheet.png artifacts/runs/2026-10-25-dino-more/sprites spino,ankylo,parasaur,pachy,iguano
   npm run sprites:rebuild
   npm test
   npm run build

4) 배포 갱신: 세션에 "공룡 추가분 커밋하고 GitHub Pages 다시 배포해 줘"라고 요청한다(imjin 제외 공개본 재구성 → gh-pages 갱신).
