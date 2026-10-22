import type { PetState } from '../sim/types';
import { hasOnset } from '../sim/state';

/** 자체 8×8 픽셀 도트(원본 스프라이트 미사용). 1 = 몸, 2 = 눈, 3 = 볼 */
const BODY = [
  '00111100',
  '01111110',
  '11211211',
  '11111111',
  '13111131',
  '11111111',
  '01111110',
  '01100110',
];

export interface PetView {
  canvas: HTMLCanvasElement;
  draw(state: PetState, t: number): void;
}

const W = 320;
const H = 180;

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
}

export function createPetView(): PetView {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.setAttribute('role', 'img');
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  let x = W / 2;
  let dir = 1;
  let last = 0;

  function draw(state: PetState, t: number): void {
    const dt = last ? Math.min(t - last, 100) : 0;
    last = t;
    const sick = hasOnset(state);
    const speed = (state.ending === 'playing' ? 28 : 0) * (sick ? 0.5 : 1); // px/s, 발병 시 절반
    x += (dir * speed * dt) / 1000;
    if (x > W - 60) dir = -1;
    if (x < 60) dir = 1;
    if (Math.random() < dt / 6000) dir = -dir;

    // 마당
    const yard = css('--color-yard');
    const yardDark = css('--color-yard-dark');
    ctx.fillStyle = yard;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = yardDark;
    for (let gy = 0; gy < H; gy += 16) for (let gx = (gy / 16) % 2 ? 8 : 0; gx < W; gx += 32) ctx.fillRect(gx, gy + 10, 4, 2);
    // 울타리
    ctx.fillStyle = css('--color-fence');
    for (let fx = 0; fx < W; fx += 20) ctx.fillRect(fx + 4, 2, 6, 14);
    ctx.fillRect(0, 8, W, 3);
    for (let fx = 0; fx < W; fx += 20) ctx.fillRect(fx + 4, H - 16, 6, 14);
    ctx.fillRect(0, H - 10, W, 3);

    // 펫 (8×8 → 6배)
    const scale = 6;
    const bob = state.ending === 'playing' ? Math.round(Math.sin(t / 180) * 2) : 0;
    const px = Math.round(x - 4 * scale);
    const py = H / 2 - 4 * scale + bob + 10;
    const body = sick ? '#9fb0a4' : state.gauges.health <= 30 ? '#c9b9a0' : '#5aa6a0';
    const stretch = state.gauges.fullness > 130 ? 1.3 : 1;
    for (let r = 0; r < 8; r++) {
      const row = BODY[r]!;
      for (let c = 0; c < 8; c++) {
        const v = row[c];
        if (v === '0') continue;
        ctx.fillStyle = v === '2' ? '#1e2328' : v === '3' ? '#e08a8a' : body;
        const cx = dir === 1 ? c : 7 - c;
        ctx.fillRect(Math.round(px + (cx - 3.5) * scale * stretch + 3.5 * scale), py + r * scale, Math.ceil(scale * stretch), scale);
      }
    }
    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.fillRect(px - 4, py + 8 * scale + 2, 8 * scale + 8, 4);
    // 이름
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.name, px + 4 * scale, py - 6);
    canvas.setAttribute('aria-label', `${state.name}: ${sick ? '아파서 느리게 걷는 중' : '마당을 걷는 중'}`);
  }

  return { canvas, draw };
}
