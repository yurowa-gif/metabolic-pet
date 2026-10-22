// replica/design/tokens.json → src/ui/tokens.css (커스텀 프로퍼티). 사용: node scripts/tokens-css.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const t = JSON.parse(readFileSync('replica/design/tokens.json', 'utf8'));
const lines = [':root {'];
for (const [k, v] of Object.entries(t.color)) lines.push(`  --color-${k}: ${v};`);
for (const [k, v] of Object.entries(t.font)) if (!k.startsWith('_')) lines.push(`  --font-${k}: ${v};`);
for (const [k, v] of Object.entries(t.type)) {
  lines.push(`  --type-${k}-size: ${v.size}px;`);
  lines.push(`  --type-${k}-line: ${v.line}px;`);
  lines.push(`  --type-${k}-weight: ${v.weight};`);
}
t.space.forEach((v, i) => lines.push(`  --space-${i}: ${v}px;`));
for (const [k, v] of Object.entries(t.radius)) lines.push(`  --radius-${k}: ${v}px;`);
for (const [k, v] of Object.entries(t.shadow)) lines.push(`  --shadow-${k}: ${v};`);
for (const [k, v] of Object.entries(t.motion)) lines.push(`  --motion-${k}: ${v};`);
for (const [k, v] of Object.entries(t.layout)) if (typeof v === 'number') lines.push(`  --layout-${k}: ${v}px;`);
lines.push('}');
mkdirSync('src/ui', { recursive: true });
writeFileSync('src/ui/tokens.css', lines.join('\n') + '\n');
console.log('wrote src/ui/tokens.css', lines.length, 'lines');
