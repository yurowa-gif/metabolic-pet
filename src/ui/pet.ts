import type { PetState } from '../sim/types';
import { hasOnset } from '../sim/state';
import { drawSpecies, loadSprites, spriteRect } from './sprites';

export interface PetView {
  canvas: HTMLCanvasElement;
  draw(state: PetState, t: number): void;
}

const W = 320;
const H = 180;
const GROUND = H - 22; // 발이 닿는 선

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
}

export function createPetView(): PetView {
  loadSprites();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.setAttribute('role', 'img');
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  let x = W / 2;
  let dir: 1 | -1 = 1;
  let last = 0;

  function draw(state: PetState, t: number): void {
    const dt = last ? Math.min(t - last, 100) : 0;
    last = t;
    const species = state.species ?? 'stego';
    const sick = hasOnset(state);
    const moving = state.ending === 'playing';
    const speed = (moving ? 26 : 0) * (sick ? 0.5 : 1); // px/s, 발병 시 절반(원본 질병 규칙 차용)
    const r = spriteRect(species);
    // 스프라이트가 마당 높이에 들어가도록 배율 결정(브라키오처럼 큰 종은 작게)
    const scale = r ? Math.min(2, (GROUND - 22) / r.h) : 2;
    const half = r ? (r.w * scale) / 2 : 48;
    x += (dir * speed * dt) / 1000;
    if (x > W - half - 8) dir = -1;
    if (x < half + 8) dir = 1;
    if (Math.random() < dt / 7000) dir = dir === 1 ? -1 : 1;

    // 마당
    ctx.fillStyle = css('--color-yard');
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = css('--color-yard-dark');
    for (let gy = 0; gy < H; gy += 16) for (let gx = (gy / 16) % 2 ? 8 : 0; gx < W; gx += 32) ctx.fillRect(gx, gy + 10, 4, 2);
    // 울타리
    ctx.fillStyle = css('--color-fence');
    for (let fx = 0; fx < W; fx += 20) ctx.fillRect(fx + 4, 2, 6, 14);
    ctx.fillRect(0, 8, W, 3);
    for (let fx = 0; fx < W; fx += 20) ctx.fillRect(fx + 4, H - 16, 6, 14);
    ctx.fillRect(0, H - 10, W, 3);

    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.fillRect(Math.round(x - half * 0.8), GROUND - 2, Math.round(half * 1.6), 4);

    // 공룡: 걸을 때 살짝 통통 튀기(세로 찌그러짐 1~4%)
    const step = moving ? Math.abs(Math.sin(t / 160)) : 0;
    const stretch = state.gauges.fullness > 130 ? 1.15 : 1;
    const size = drawSpecies(ctx, species, x, GROUND - Math.round(step * 2), { scale, facing: dir, sick, stretch, squash: 1 - step * 0.04 });

    // 이름
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    const ny = Math.max(14, GROUND - size.h - 6);
    ctx.strokeText(state.name, x, ny);
    ctx.fillText(state.name, x, ny);
    canvas.setAttribute('aria-label', `${state.name}: ${sick ? '아파서 느리게 걷는 중' : '마당을 걷는 중'}`);
  }

  return { canvas, draw };
}
