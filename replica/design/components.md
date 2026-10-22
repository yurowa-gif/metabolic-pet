# Components (대사 펫)

recon.md의 컴포넌트 목록을 자체 설계로 다시 정의한다. 원본 에셋·문구는 쓰지 않는다. 모든 터치 대상은 44 px 이상.

```
GaugeChip  (HUD 게이지)
  variants  fullness(🍚), vitality(⚡), health(❤)
  states    default, up(초록 깜빡 300ms), down(빨강 깜빡 300ms), clamped(상한 표시 줄)
  tokens    bg surface, text text, 막대 gauge-*, radius pill, font hud
  a11y      aria-label "포만감 70 / 100"; 색 외에 숫자 병기
  used on   G02, G03

FoodCard
  variants  food(이모지+이름+1일 기준치 % 3줄: 당·나트륨·포화지방), skip("거르기")
  sizes     2열 그리드, 높이 96px
  states    default, pressed(scale .97), selected(테두리 accent 2px), disabled(슬롯 완료)
  tokens    bg surface, border border, radius md, 경고 배지 warning/danger
  a1ly      role=button, 라벨 "라면, 열량 451 kcal, 나트륨 1일 기준치의 78%"
  used on   G02

ActivityCard
  variants  walk(🚶), exercise(🏃), rest(🛌), allnighter(🌙), medicine(💊, 발병 중에만)
  states    default, pressed, selected, hidden(medicine 조건 불충족)
  tokens    FoodCard와 동일
  used on   G02

PetSprite (Canvas)
  variants  idle, walk, slow(발병), hospital
  states    normal, bubble(말풍선 텍스트), blink(상태 변화)
  tokens    yard/yard-dark 바닥, fence 울타리, 픽셀 8×8 자체 도트
  used on   G02, G05

DayTimer
  variants  bar(상단 45 s 진행 막대)
  states    running, lastTen(warning 색), paused(검진 팝업 중)
  tokens    accent → warning
  a11y      aria-live="polite"로 "10초 남음" 1회 안내
  used on   G02

CheckupTable
  variants  partial(5·10·15일), final(20일)
  rows      공복혈당 mg/dL, 혈압 mmHg, LDL mg/dL, 체중 kg(변화량)
  states    label normal/pre/onset 색(stage-*), 전일 대비 화살표
  tokens    bg surface, border, font sm/base
  a11y      표 헤더 th, 라벨 텍스트 병기("전단계")
  used on   G03, G04

SourceSheet
  variants  bottom sheet
  content   기준값 출처 요약(지침명·판·연도·URL), 닫기
  tokens    bg surface, shadow pop
  used on   G03, G04

Timeline (Canvas 또는 SVG)
  variants  3 지표 꺾은선 + 하단 식단 이모지 띠(20일)
  states    기준선(점선, stage-pre/onset 색), 발병일 마커
  used on   G04, G05

QuizCard
  variants  객관식 4지선다 ×3
  states    unanswered, correct(success), wrong(danger) + 해설
  used on   G04

Dialog
  variants  info(시작 안내·면책), checkup, ending
  states    open/closed, 포커스 트랩
  used on   G01, G03, G05
```

콘트라스트: `node scripts/contrast.mjs replica/design/tokens.json` 결과는 `replica/design/contrast-report.txt`.
