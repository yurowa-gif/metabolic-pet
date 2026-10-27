// 결정적 걷기 2번째 프레임: 각 스프라이트의 다리 띠에서 발 묶음을 번갈아 1px 들어 올린다.
// 사용: node scripts/walkframe.mjs <sheet.png> <meta.json> <out.png> [even|odd]  (even: 0,2번째 발 묶음, odd: 1,3번째)
// 원리: 아래에서부터 위로, 불투명 구간이 2개 이상으로 갈라지는 행을 '다리 띠'로 본다.
//       맨 아래 행의 발 묶음(연속 열)을 왼쪽부터 0,1,2…로 나누고 짝수 묶음을 1px 위로 옮긴다.
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const [sheetPath, metaPath, outPath, parityArg] = process.argv.slice(2);
const parity = parityArg === 'odd' ? 1 : 0;
if (!sheetPath || !metaPath || !outPath) { console.error('usage: node scripts/walkframe.mjs <sheet.png> <meta.json> <out.png>'); process.exit(2); }
const src = PNG.sync.read(readFileSync(sheetPath));
const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
const out = new PNG({ width: src.width, height: src.height });
src.data.copy(out.data);

const A = (img, x, y) => img.data[(y * img.width + x) * 4 + 3] > 0;
const runs = (img, y, x0, x1) => {
  const r = []; let s = -1;
  for (let x = x0; x <= x1 + 1; x++) {
    const on = x <= x1 && A(img, x, y);
    if (on && s < 0) s = x;
    if (!on && s >= 0) { r.push([s, x - 1]); s = -1; }
  }
  return r;
};

const report = [];
for (const sp of meta.sprites) {
  const x0 = sp.x, x1 = sp.x + sp.w - 1;
  // 격자 여백 때문에 맨 아래 행이 비어 있을 수 있으니 실제 마지막 불투명 행을 찾는다
  let yb = sp.y + sp.h - 1;
  while (yb > sp.y && runs(src, yb, x0, x1).length === 0) yb--;
  // 다리 띠 높이: 아래에서 위로 구간 수 ≥2인 행이 이어지는 만큼(최대 스프라이트 높이의 40%)
  let band = 0;
  for (let y = yb; y >= sp.y && band < Math.ceil(sp.h * 0.4); y--) {
    if (runs(src, y, x0, x1).length >= 2) band++; else break;
  }
  if (band < 2) { report.push(`${sp.name}: legs not found, frame unchanged`); continue; }
  const feet = runs(src, yb, x0, x1);
  const top = yb - band + 1;
  feet.forEach(([fa, fb], i) => {
    if (i % 2 !== parity) return; // 지정한 짝·홀 묶음만 들어 올림
    // 이 발 묶음과 이어진 다리 열 범위(띠 안에서 위쪽 행들과 겹치는 열).
    // 발 폭의 2배+4px보다 넓은 줄(몸통·꼬리)을 만나면 그 행부터는 다리가 아니므로 멈춘다.
    // (이구아노 엄지 가시처럼 다리 옆 작은 덩어리 때문에 띠가 길어져도 몸통이 함께 들리지 않게)
    let la = fa, lb = fb, legTop = yb;
    const maxW = 2 * (fb - fa + 1) + 4;
    for (let y = yb - 1; y >= top; y--) {
      const hit = runs(src, y, x0, x1).filter(([ra, rb]) => rb >= la && ra <= lb);
      if (!hit.length || hit.some(([ra, rb]) => rb - ra + 1 > maxW)) break;
      for (const [ra, rb] of hit) { la = Math.min(la, ra); lb = Math.max(lb, rb); }
      legTop = y;
    }
    for (let y = legTop; y <= yb; y++) for (let x = la; x <= lb; x++) {
      const si = (y * src.width + x) * 4;
      const di = ((y - 1) * src.width + x) * 4;
      if (!A(src, x, y)) continue;
      out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1]; out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = 255;
    }
    for (let x = la; x <= lb; x++) { const bi = (yb * src.width + x) * 4; if (A(src, x, yb)) out.data[bi + 3] = 0; }
  });
  report.push(`${sp.name}: band ${band}px, feet ${feet.length}, lifted ${Math.ceil(feet.length / 2)}`);
}
writeFileSync(outPath, PNG.sync.write(out));
console.log(report.join('\n'));
