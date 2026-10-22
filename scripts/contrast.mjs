// WCAG 2.x 대비 검사 (replica-design의 contrast.py 대체, Python 없이 실행). 사용: node scripts/contrast.mjs replica/design/tokens.json
import { readFileSync } from 'node:fs';
const file = process.argv[2] ?? 'replica/design/tokens.json';
const t = JSON.parse(readFileSync(file, 'utf8'));
const hex = (h) => h.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => { const [r, g, b] = hex(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
let fail = 0;
for (const [fg, bg, kind] of t.pairs) {
  const r = ratio(t.color[fg], t.color[bg]);
  const need = kind === 'ui' ? 3 : 4.5;
  const ok = r >= need;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${fg.padEnd(12)} on ${bg.padEnd(10)} ${r.toFixed(2)}:1 (need ${need}:1)`);
}
console.log(fail ? `${fail} failure(s)` : 'all pairs pass AA');
process.exit(fail ? 1 : 0);
