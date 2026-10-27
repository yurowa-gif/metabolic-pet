// AI 생성 도트 시트를 실제 픽셀 격자로 정리한다(무료·로컬, pngjs만 사용).
// 사용: node scripts/pixelize.mjs <input.png> <outDir> [names=stego,trike,brachio,trex,raptor] [maxColors=16] [cell=5-10]
//   cell: 도트 한 칸의 원본 픽셀 크기 탐색 범위. 한 장에 한 마리를 크게 그린 그림은 칸이 커서(예: 15-30) 직접 지정한다.
// 1) 마젠타 배경 제거 2) 연결 요소로 스프라이트 분리 3) 스프라이트·축별로 격자(소수 셀 크기·위상) 맞춤
// 4) 셀 안쪽 픽셀 다수결로 색 결정 5) 가까운 색 병합 6) 개별 PNG·시트 PNG·JSON 출력
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { PNG } from 'pngjs';

const [input, outDir, namesArg, maxColorsArg, cellArg] = process.argv.slice(2);
if (!input || !outDir) { console.error('usage: node scripts/pixelize.mjs <input.png> <outDir> [names] [maxColors]'); process.exit(2); }
const names = (namesArg ?? 'stego,trike,brachio,trex,raptor').split(',');
const MAX_COLORS = Number(maxColorsArg ?? 16);
const [CELL_LO, CELL_HI] = (cellArg ?? "5-10").split("-").map(Number);
if (!(CELL_LO > 1 && CELL_HI >= CELL_LO)) { console.error(`bad cell range: ${cellArg}`); process.exit(2); }
const src = PNG.sync.read(readFileSync(input));
const { width: W, height: H, data } = src;
const I = (x, y) => (y * W + x) * 4;

const isBgPx = (x, y) => {
  const i = I(x, y);
  const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
  if (a < 40) return true;
  return r > 170 && b > 170 && g < 110 && Math.abs(r - b) < 80;
};
const fg = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!isBgPx(x, y)) fg[y * W + x] = 1;

// 2) 연결 요소(8방향)
const label = new Int32Array(W * H).fill(-1);
const comps = [];
const stack = [];
for (let s = 0; s < W * H; s++) {
  if (!fg[s] || label[s] >= 0) continue;
  const id = comps.length;
  const c = { id, n: 0, x0: W, y0: H, x1: 0, y1: 0 };
  label[s] = id; stack.push(s);
  while (stack.length) {
    const p = stack.pop();
    const x = p % W, y = (p / W) | 0;
    c.n++; if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const q = ny * W + nx;
      if (fg[q] && label[q] < 0) { label[q] = id; stack.push(q); }
    }
  }
  comps.push(c);
}
const major = [...comps].sort((a, b) => b.n - a.n).slice(0, names.length).sort((a, b) => a.x0 - b.x0);
const owner = new Map(major.map((m, i) => [m.id, i]));
// 작은 조각은 가장 가까운 큰 덩어리에 붙임(bbox 거리 ≤ 24px)
for (const c of comps) {
  if (owner.has(c.id) || c.n < 6) continue;
  let best = -1, bd = 25;
  major.forEach((m, i) => {
    const dx = Math.max(m.x0 - c.x1, c.x0 - m.x1, 0), dy = Math.max(m.y0 - c.y1, c.y0 - m.y1, 0);
    const d = Math.max(dx, dy);
    if (d < bd) { bd = d; best = i; }
  });
  if (best >= 0) { owner.set(c.id, best); const m = major[best]; m.x0 = Math.min(m.x0, c.x0); m.x1 = Math.max(m.x1, c.x1); m.y0 = Math.min(m.y0, c.y0); m.y1 = Math.max(m.y1, c.y1); }
}
const belongs = (x, y, k) => { const l = label[y * W + x]; return l >= 0 && owner.get(l) === k; };
const diff = (i, j) => Math.abs(data[i] - data[j]) + Math.abs(data[i + 1] - data[j + 1]) + Math.abs(data[i + 2] - data[j + 2]);

// 3) 축별 격자 맞춤: 색 경계가 격자선(±1px)에 얼마나 몰리는지로 (셀, 위상) 선택
function fitAxis(edges, lo = CELL_LO, hi = CELL_HI) {
  let best = { c: (lo + hi) / 2, ph: 0, s: -1 };
  for (let c = lo; c <= hi + 0.0001; c += 0.05) {
    for (let ph = 0; ph < c; ph += 0.25) {
      let hit = 0;
      for (const e of edges) { const t = (e - ph) / c; const d = Math.abs(t - Math.round(t)) * c; if (d <= 1) hit++; }
      const s = hit / edges.length;
      if (s > best.s + 0.003) best = { c, ph, s };
    }
  }
  return best;
}

function processSprite(k, range) {
  const m = major[k];
  const ex = [], ey = [];
  for (let y = m.y0; y <= m.y1; y++) for (let x = m.x0 + 1; x <= m.x1; x++) {
    const a = belongs(x, y, k), b = belongs(x - 1, y, k);
    if (a !== b || (a && diff(I(x, y), I(x - 1, y)) > 60)) ex.push(x);
  }
  for (let x = m.x0; x <= m.x1; x++) for (let y = m.y0 + 1; y <= m.y1; y++) {
    const a = belongs(x, y, k), b = belongs(x, y - 1, k);
    if (a !== b || (a && diff(I(x, y), I(x, y - 1)) > 60)) ey.push(y);
  }
  // 픽셀은 정사각형: 경계가 더 뚜렷한 세로축으로 셀 크기를 정하고, 가로는 같은 크기 ±0.3 안에서 위상만 맞춘다
  // (가로 경계가 약한 시트에서 가로 셀을 4.6px처럼 잘못 잡아 그림이 옆으로 늘어나는 문제 방지)
  const fy = range ? fitAxis(ey, range.y[0], range.y[1]) : fitAxis(ey);
  const fx = fitAxis(ex, Math.max(CELL_LO, fy.c - 0.3), Math.min(CELL_HI, fy.c + 0.3));
  // 격자 시작: bbox 왼쪽/위 이전의 첫 격자선
  const gx0 = fx.ph + Math.floor((m.x0 - fx.ph) / fx.c) * fx.c;
  const gy0 = fy.ph + Math.floor((m.y0 - fy.ph) / fy.c) * fy.c;
  const gw = Math.ceil((m.x1 + 1 - gx0) / fx.c), gh = Math.ceil((m.y1 + 1 - gy0) / fy.c);
  const cells = [];
  for (let gy = 0; gy < gh; gy++) {
    const row = [];
    for (let gx = 0; gx < gw; gx++) {
      // 셀 안쪽 60%만 본다(경계 번짐 제외)
      const xa = Math.ceil(gx0 + (gx + 0.2) * fx.c), xb = Math.floor(gx0 + (gx + 0.8) * fx.c);
      const ya = Math.ceil(gy0 + (gy + 0.2) * fy.c), yb = Math.floor(gy0 + (gy + 0.8) * fy.c);
      let tot = 0, on = 0; const cols = [];
      for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        tot++;
        if (belongs(x, y, k)) { on++; const i = I(x, y); cols.push([data[i], data[i + 1], data[i + 2]]); }
      }
      if (!tot || on / tot < 0.5) { row.push(null); continue; }
      // 대표색: 가장 많은 색 무리(거리 40 이내)의 평균
      let bestC = cols[0], bestN = 0;
      for (const c of cols) { let n = 0; for (const d of cols) if (Math.abs(c[0] - d[0]) + Math.abs(c[1] - d[1]) + Math.abs(c[2] - d[2]) < 40) n++; if (n > bestN) { bestN = n; bestC = c; } }
      const grp = cols.filter((d) => Math.abs(bestC[0] - d[0]) + Math.abs(bestC[1] - d[1]) + Math.abs(bestC[2] - d[2]) < 40);
      row.push([0, 1, 2].map((q) => Math.round(grp.reduce((s, d) => s + d[q], 0) / grp.length)));
    }
    cells.push(row);
  }
  return { fit: { cx: +fx.c.toFixed(2), cy: +fy.c.toFixed(2), sx: +fx.s.toFixed(2), sy: +fy.s.toFixed(2) }, gw, gh, cells };
}

// 5) 색 병합: 가장 가까운 두 색을 빈도 가중 평균으로 합치기를 MAX_COLORS 이하가 될 때까지(거리 < 30은 무조건 병합)
function quantize(cells) {
  let pal = [];
  const counts = new Map();
  for (const row of cells) for (const c of row) if (c) { const key = c.join(','); counts.set(key, (counts.get(key) ?? 0) + 1); }
  pal = [...counts].map(([k, n]) => ({ c: k.split(',').map(Number), n, members: [k] }));
  const dist = (a, b) => Math.abs(a.c[0] - b.c[0]) + Math.abs(a.c[1] - b.c[1]) + Math.abs(a.c[2] - b.c[2]);
  for (;;) {
    let bi = -1, bj = -1, bd = Infinity;
    for (let i = 0; i < pal.length; i++) for (let j = i + 1; j < pal.length; j++) { const d = dist(pal[i], pal[j]); if (d < bd) { bd = d; bi = i; bj = j; } }
    if (bi < 0 || (bd >= 30 && pal.length <= MAX_COLORS)) break;
    const a = pal[bi], b = pal[bj];
    // 대표색은 더 흔한 쪽을 유지(도트의 의도된 색 보존)
    const keep = a.n >= b.n ? a : b;
    pal[bi] = { c: keep.c, n: a.n + b.n, members: [...a.members, ...b.members] };
    pal.splice(bj, 1);
  }
  const lookup = new Map();
  pal.forEach((p, i) => p.members.forEach((m) => lookup.set(m, i)));
  const grid = cells.map((row) => row.map((c) => (c ? lookup.get(c.join(',')) : -1)));
  return { pal: pal.map((p) => p.c), grid };
}

// 외톨이 픽셀 제거: 상하좌우 모두 투명인 1칸은 지움
function despeckle(grid) {
  const h = grid.length, w = grid[0].length;
  return grid.map((row, y) => row.map((v, x) => {
    if (v < 0) return v;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => { const yy = y + dy, xx = x + dx; return yy >= 0 && yy < h && xx >= 0 && xx < w && grid[yy][xx] >= 0; }).length;
    return n === 0 ? -1 : v;
  }));
}

mkdirSync(outDir, { recursive: true });
// 1차 맞춤 → 셀 크기 중앙값 ±0.4 범위로 2차 맞춤(가로 경계가 적은 스프라이트 보정)
const first = major.map((_, k) => processSprite(k).fit);
const med = (a) => [...a].sort((p, q) => p - q)[a.length >> 1];
const mx = med(first.map((f) => f.cx)), my = med(first.map((f) => f.cy));
const range = { x: [mx - 0.4, mx + 0.4], y: [my - 0.4, my + 0.4] };
const sprites = major.map((_, k) => {
  const { fit, gw, gh, cells } = processSprite(k, range);
  const { pal, grid } = quantize(cells);
  // 마젠타 번짐(빨강·파랑이 초록보다 크게 높은 색) 제거
  // 밝은 마젠타 계열 + 어두운 자주색(빨강·파랑이 초록보다 높고 초록이 낮은 색, 볼터치 분홍은 파랑이 낮아 제외)
  const fringe = new Set(pal.map((c, i) => ((c[0] - c[1] > 60 && c[2] - c[1] > 60) || (c[0] - c[1] > 50 && c[2] - c[1] > 15 && c[1] < 60) ? i : -1)).filter((i) => i >= 0));
  const clean = grid.map((row) => row.map((v) => (fringe.has(v) ? -1 : v)));
  return { name: names[k] ?? `s${k}`, fit, gw, gh, pal, grid: despeckle(clean), fringe: fringe.size };
});
const sheetW = sprites.reduce((s, sp) => s + sp.gw + 2, 0);
const sheetH = Math.max(...sprites.map((s) => s.gh));
const sheet = new PNG({ width: sheetW, height: sheetH });
const meta = { source: input, generator: 'GPT image (Codex CLI image_generation)', sprites: [] };
let ox = 0;
for (const s of sprites) {
  const one = new PNG({ width: s.gw, height: s.gh });
  const put = (img, X, Y, k) => { const i = (Y * img.width + X) * 4; if (k < 0) { img.data[i + 3] = 0; return; } const c = s.pal[k]; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255; };
  for (let y = 0; y < s.gh; y++) for (let x = 0; x < s.gw; x++) { put(one, x, y, s.grid[y][x]); put(sheet, ox + 1 + x, sheetH - s.gh + y, s.grid[y][x]); }
  writeFileSync(`${outDir}/${s.name}.png`, PNG.sync.write(one));
  meta.sprites.push({ name: s.name, x: ox + 1, y: sheetH - s.gh, w: s.gw, h: s.gh, colors: s.pal.length - s.fringe, fit: s.fit });
  ox += s.gw + 2;
}
writeFileSync(`${outDir}/dinos.png`, PNG.sync.write(sheet));
writeFileSync(`${outDir}/dinos.json`, JSON.stringify(meta, null, 2));
console.log(`components=${comps.length}`);
for (const s of meta.sprites) console.log(`${s.name.padEnd(8)} ${s.w}x${s.h} ${s.colors}c  cell ${s.fit.cx}x${s.fit.cy}  align ${s.fit.sx}/${s.fit.sy}`);
