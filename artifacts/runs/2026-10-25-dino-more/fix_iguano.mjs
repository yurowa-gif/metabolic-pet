// 이구아노돈 해부학 보정(모델 호출 없음, 결정적 픽셀 편집).
// 생성 그림은 엄지 가시가 가슴 앞으로 수평하게 튀어나와 '가슴 뿔'처럼 보였다.
// 실제 이구아노돈의 가시는 앞발 엄지(첫째 발가락)에 달린 원뿔이다.
// 1) 25~29행에서 몸 앞쪽 외곽선 뒤로 튀어나온 가시 픽셀을 지운다.
// 2) 30행에 앞다리 윗부분 외곽선을 이어 닫는다.
// 3) 앞발 손목 앞쪽에 위로 선 작은 엄지 가시를 찍는다.
// 사용(저장소 루트): node artifacts/runs/2026-10-25-dino-more/fix_iguano.mjs
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { PNG } from 'pngjs';

const DIR = 'artifacts/runs/2026-10-25-dino-more/sprites';
const SRC = `${DIR}/iguano.png`;
const ORIG = `${DIR}/iguano.generated.png`;
if (!existsSync(ORIG)) copyFileSync(SRC, ORIG); // 생성 원본 보존(항상 원본에서 다시 고침)
const img = PNG.sync.read(readFileSync(ORIG));
const { width: W } = img;

const OUTLINE = [44, 45, 21];
const CREAM = [243, 214, 160];
const WHITE = [252, 251, 245];
const at = (x, y) => (y * W + x) * 4;
const isOn = (x, y) => img.data[at(x, y) + 3] > 0;
const rgb = (x, y) => [img.data[at(x, y)], img.data[at(x, y) + 1], img.data[at(x, y) + 2]];
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const set = (x, y, c) => { const i = at(x, y); img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255; };
const clear = (x, y) => { img.data[at(x, y) + 3] = 0; };

// 1) 가시 제거: 각 행에서 '몸 → 외곽선' 경계(첫 외곽선 픽셀)를 남기고 그 오른쪽을 지운다.
//    25행은 따로 떨어진 가시 끝 외곽선(60열 이후)만 지운다.
for (let x = 59; x < W; x++) if (isOn(x, 25)) clear(x, 25);
for (const y of [26, 27, 28]) {
  let edge = -1;
  for (let x = 45; x < W; x++) if (isOn(x, y) && same(rgb(x, y), OUTLINE) && x > 48) { edge = x; break; }
  for (let x = edge + 1; x < W; x++) clear(x, y);
}
for (let x = 52; x < W; x++) clear(x, 29);
// 2) 가슴 앞선 메우기: 가시를 지운 자리(26~29행)가 안쪽으로 파여 V자 홈이 생기므로,
//    25행 가슴 외곽선 위치(chestX)부터 30행 앞다리까지 앞선을 곧게 이어 몸 색으로 채운다.
const BODY = [165, 167, 87];
const SHADE = [130, 130, 64];
let chestX = 52;
for (let x = 45; x < W; x++) if (isOn(x, 25)) chestX = x; // 25행 오른쪽 끝(가슴 외곽선)
let legRight = 52;
for (let x = 52; x < W; x++) if (isOn(x, 31)) legRight = x;
for (const y of [26, 27, 28, 29]) {
  let edge = 48;
  for (let x = 48; x < W; x++) if (isOn(x, y)) edge = x; // 현재 오른쪽 끝(파인 외곽선)
  for (let x = edge; x < chestX; x++) set(x, y, BODY);
  for (let x = chestX + 1; x < W; x++) clear(x, y);
  set(chestX, y, OUTLINE);
}
for (let x = 53; x < Math.max(chestX, legRight); x++) set(x, 30, SHADE); // 앞다리 윗부분이 몸과 이어지게
set(Math.max(chestX, legRight), 30, OUTLINE);

// 3) 엄지 가시: 앞발 앞쪽 외곽선(35행 기준) 바로 앞에, 위로 서고 살짝 앞으로 기운 원뿔(4칸 높이)
//    현재 복원: 다 자란 이구아노돈은 주로 네 발로 걸었고, 엄지 가시는 땅을 짚는 앞발 손목에서 위로 섰다.
let legEdge = 52;
for (let x = 52; x < W; x++) if (isOn(x, 35)) legEdge = x;
const sx = legEdge + 1;
const spike = [
  [sx + 2, 31, OUTLINE],
  [sx + 1, 32, OUTLINE], [sx + 2, 32, WHITE], [sx + 3, 32, OUTLINE],
  [sx, 33, OUTLINE], [sx + 1, 33, CREAM], [sx + 2, 33, WHITE], [sx + 3, 33, OUTLINE],
  [sx, 34, CREAM], [sx + 1, 34, CREAM], [sx + 2, 34, CREAM], [sx + 3, 34, OUTLINE],
  [sx, 35, OUTLINE], [sx + 1, 35, OUTLINE], [sx + 2, 35, OUTLINE],
];
for (const [x, y, c] of spike) if (x < W) set(x, y, c);
const wristY = 33;

writeFileSync(SRC, PNG.sync.write(img));
console.log(`iguano fixed: spike removed rows 25-29, chest filled to x=${chestX}, thumb spike at x=${sx}, y=${wristY - 2}..${wristY + 1}`);
