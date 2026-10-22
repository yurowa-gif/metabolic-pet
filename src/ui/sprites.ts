import sheetUrl from '../assets/dinos.png';
import sheetMeta from '../data/dinoSheet.json';
import { DINOS, getDino, drawDino, type DinoId } from './dinos';

/**
 * GPT 이미지 모델로 생성한 공룡 시트를 7px 격자로 정리한 스프라이트(scripts/pixelize.mjs).
 * 이미지가 아직 안 불러졌거나 실패하면 dinos.ts의 손으로 찍은 도트로 대체한다.
 */
export interface SpriteRect { x: number; y: number; w: number; h: number }

const RECTS = new Map<string, SpriteRect>(sheetMeta.sprites.map((s) => [s.name, { x: s.x, y: s.y, w: s.w, h: s.h }]));
let sheet: HTMLImageElement | null = null;
let ready = false;
const listeners: (() => void)[] = [];

export function loadSprites(): void {
  if (sheet) return;
  sheet = new Image();
  sheet.onload = () => { ready = true; listeners.splice(0).forEach((f) => f()); };
  sheet.onerror = () => console.error('dino sprite sheet failed to load; using fallback pixels');
  sheet.src = sheetUrl;
}

export function onSpritesReady(f: () => void): void {
  if (ready) f(); else listeners.push(f);
}

export function spriteRect(id: string): SpriteRect | null {
  return RECTS.get(id) ?? null;
}

export interface SpriteDraw {
  scale: number;
  facing: 1 | -1;
  sick: boolean;
  stretch: number;
  /** 걷기 바운스용 세로 찌그러짐(1 = 없음) */
  squash: number;
}

/**
 * 발밑 중앙(cx, baseY) 기준으로 그린다. 반환: 그린 크기(px).
 */
export function drawSpecies(ctx: CanvasRenderingContext2D, id: string, cx: number, baseY: number, o: SpriteDraw): { w: number; h: number } {
  const r = spriteRect(id);
  if (!ready || !sheet || !r) {
    const d = getDino(id);
    const fallbackScale = Math.max(1, Math.round(o.scale * 2));
    const size = { w: d.body[0]!.length * fallbackScale, h: (d.body.length + d.legs[0].length) * fallbackScale };
    drawDino(ctx, d, Math.round(cx - size.w / 2), Math.round(baseY - size.h), { scale: fallbackScale, frame: 0, facing: o.facing, sick: o.sick, stretch: o.stretch });
    return size;
  }
  const w = Math.round(r.w * o.scale * o.stretch);
  const h = Math.round(r.h * o.scale * o.squash);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.filter = o.sick ? 'saturate(30%) brightness(0.95)' : 'none';
  ctx.translate(Math.round(cx), Math.round(baseY));
  if (o.facing === -1) ctx.scale(-1, 1);
  ctx.drawImage(sheet, r.x, r.y, r.w, r.h, -Math.round(w / 2), -h, w, h);
  ctx.restore();
  return { w, h };
}

/** 시작 화면용 작은 미리보기 캔버스 */
export function speciesThumb(id: DinoId, size = 72): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  c.className = 'dino-thumb';
  const paint = () => {
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);
    const r = spriteRect(id);
    const scale = r ? Math.min((size - 6) / r.w, (size - 6) / r.h) : 1;
    drawSpecies(ctx, id, size / 2, size - 3, { scale, facing: 1, sick: false, stretch: 1, squash: 1 });
  };
  paint();
  onSpritesReady(paint);
  return c;
}

export const SPECIES = DINOS.map((d) => ({ id: d.id, name: d.name }));
