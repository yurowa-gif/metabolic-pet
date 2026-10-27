// 스프라이트 시트 다시 만들기: (새 그림 폴더들을 더해) 시트 합치기 → 걷기 프레임 2장 생성.
// 사용: npm run sprites:rebuild -- [newSpritesDir...]
//   예) npm run sprites:rebuild -- artifacts/runs/2026-10-25-dino-more/sprites
import { execFileSync } from 'node:child_process';

const dirs = process.argv.slice(2);
const run = (args) => execFileSync(process.execPath, args, { stdio: 'inherit' });
run(['scripts/build-sheet.mjs', ...dirs]);
run(['scripts/walkframe.mjs', 'src/assets/dinos.png', 'src/data/dinoSheet.json', 'src/assets/dinos_walk_b.png', 'even']);
run(['scripts/walkframe.mjs', 'src/assets/dinos.png', 'src/data/dinoSheet.json', 'src/assets/dinos_walk_c.png', 'odd']);
