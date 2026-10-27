# 이구아노돈 교체: 카르노타우루스

이구아노돈은 엄지 가시가 무릎 돌기처럼 보여 제외했다(네 발 자세에서는 손이 드러나지 않음).

1) 이미지 생성 (PowerShell 5.1)
   Set-Location C:\Users\user\projects\game\artifacts\runs\2026-10-25-dino-carno
   Get-Content -Raw prompt.txt | codex.cmd exec --skip-git-repo-check --sandbox workspace-write -C . -i style_reference.png -o last-message.txt -

2) 끝나면 세션에 알린다. 세션이 정리·합치기·검사를 한다:
   node scripts/pixelize.mjs artifacts/runs/2026-10-25-dino-carno/carno_sheet.png artifacts/runs/2026-10-25-dino-carno/sprites carno 16 12-30
   npm run sprites:rebuild -- artifacts/runs/2026-10-25-dino-carno/sprites

결과(2026-10-26): Codex가 그림을 ~/.codex/generated_images/에 저장해 carno_sheet.png로 복사했다. 한 마리를 크게 그려 도트 한 칸이 약 13.5px이므로 칸 탐색 범위 12-30을 지정했다(기본 5-10이면 204x150으로 잘못 커짐). 결과 75x52, 걷기 다리 띠 10px. 테스트 50개·빌드 통과, 모바일 화면 확인(mobile-*.jpg), 콘솔 오류 0.
