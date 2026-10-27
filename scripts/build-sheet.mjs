// 공룡 스프라이트 시트 합치기: 기존 시트(src/assets/dinos.png + src/data/dinoSheet.json)에
// 새로 정리한 스프라이트 PNG들을 더해, species.json 순서로 한 장의 시트를 다시 만든다.
// 사용: node scripts/build-sheet.mjs [newSpritesDir...]
//   newSpritesDir: scripts/pixelize.mjs 출력 폴더(<id>.png 들). 같은 id가 있으면 새 그림으로 교체한다.
// 이어서 걷기 프레임은 scripts/walkframe.mjs로 다시 만든다(npm run sprites:rebuild가 둘 다 실행).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';

const SHEET = 'src/assets/dinos.png';
const META = 'src/data/dinoSheet.json';
const ORDER = JSON.parse(readFileSync('src/data/species.json', 'utf8')).species.map((s) => s.id);

const base = PNG.sync.read(readFileSync(SHEET));
const meta = JSON.parse(readFileSync(META, 'utf8'));

/** id → { w, h, data(RGBA) } */
const sprites = new Map();
const crop = (img, x, y, w, h) => {
  const out = Buffer.alloc(w * h * 4);
  for (let r = 0; r < h; r++) img.data.copy(out, r * w * 4, ((y + r) * img.width + x) * 4, ((y + r) * img.width + x + w) * 4);
  return out;
};
for (const s of meta.sprites) sprites.set(s.name, { w: s.w, h: s.h, data: crop(base, s.x, s.y, s.w, s.h), source: meta.source, fit: s.fit });

const added = [];
for (const dir of process.argv.slice(2)) {
  if (!existsSync(dir)) { console.error(`not found: ${dir}`); process.exit(2); }
  const dirMeta = existsSync(join(dir, 'dinos.json')) ? JSON.parse(readFileSync(join(dir, 'dinos.json'), 'utf8')) : null;
  for (const f of readdirSync(dir)) {
    const id = f.replace(/\.png$/, '');
    if (!f.endsWith('.png') || id === 'dinos' || !ORDER.includes(id)) continue;
    const img = PNG.sync.read(readFileSync(join(dir, f)));
    const fit = dirMeta?.sprites.find((s) => s.name === id)?.fit;
    sprites.set(id, { w: img.width, h: img.height, data: Buffer.from(img.data), source: dirMeta?.source ?? dir, fit });
    added.push(id);
  }
}

// species.json이 기준: 목록에서 뺀 종은 시트에서도 제외한다
const removed = [...sprites.keys()].filter((id) => !ORDER.includes(id));
if (removed.length) console.warn(`species.json에 없어 시트에서 제외: ${removed.join(', ')}`);
const ids = ORDER.filter((id) => sprites.has(id));

// 가로로 한 줄, 1px 간격, 바닥선 맞춤
const width = ids.reduce((s, id) => s + sprites.get(id).w + 2, 0);
const height = Math.max(...ids.map((id) => sprites.get(id).h));
const sheet = new PNG({ width, height });
const out = { source: 'merged by scripts/build-sheet.mjs', generator: meta.generator, sprites: [] };
let ox = 0;
for (const id of ids) {
  const s = sprites.get(id);
  const x = ox + 1, y = height - s.h;
  for (let r = 0; r < s.h; r++) s.data.copy(sheet.data, ((y + r) * width + x) * 4, r * s.w * 4, (r + 1) * s.w * 4);
  out.sprites.push({ name: id, x, y, w: s.w, h: s.h, source: s.source, ...(s.fit ? { fit: s.fit } : {}) });
  ox += s.w + 2;
}
writeFileSync(SHEET, PNG.sync.write(sheet));
writeFileSync(META, JSON.stringify(out, null, 2) + '\n');
console.log(`sheet ${width}x${height}, species ${ids.length}: ${ids.join(', ')}${added.length ? ` (added/replaced: ${added.join(', ')})` : ''}`);
