/**
 * 자체 제작 픽셀 공룡 5종(오른쪽을 봄). 참고 이미지의 분위기(외곽선 + 파스텔 2~3톤)만 따르고 픽셀은 새로 그렸다.
 * 기호: . 투명  o 외곽선  b 몸  d 몸 그림자  l 배  a 장식(판·프릴·줄무늬)  w 흰색(뿔·이빨·발톱)  e 눈  c 볼
 */
export type DinoId = 'stego' | 'trike' | 'brachio' | 'trex' | 'raptor';

export interface Dino {
  id: DinoId;
  name: string;
  emoji: string;
  palette: Record<'o' | 'b' | 'd' | 'l' | 'a' | 'w' | 'e' | 'c', string>;
  /** 몸통 행. 다리 행은 legs[0] / legs[1]로 걷기 2프레임 */
  body: string[];
  legs: [string[], string[]];
}

const EYE = '#1e2328';
const CHEEK = '#e9a0a0';

export const DINOS: Dino[] = [
  {
    id: 'stego',
    name: '스테고',
    emoji: '🦕',
    palette: { o: '#33402c', b: '#9cbf72', d: '#7a9e56', l: '#dfe6b0', a: '#e38b4f', w: '#f6f1e2', e: EYE, c: CHEEK },
    body: [
      '..........a...a.........',
      '........a.aa.aaa.a......',
      '.......aaaaaaaaaaaa.....',
      '......oooooooooooooo....',
      '.....obbbbbbbbbbbbbbo...',
      '....obbdbbbbbbbbdbbbbo..',
      'w..obbbbbbbbbbbbbbbbbboo',
      '.wobbbbbbbbbbbbbbbbbbbeo',
      '..obbdbbbbbbbbbbbbbbcbbo',
      '...oolllllllllllllllooo.',
    ],
    legs: [
      [
        '.....obbo.....obbo......',
        '.....obbo.....obbo......',
        '.....owwo.....owwo......',
      ],
      [
        '......obbo...obbo.......',
        '......obbo...obbo.......',
        '......owwo...owwo.......',
      ],
    ],
  },
  {
    id: 'trike',
    name: '트리케라',
    emoji: '🦏',
    palette: { o: '#4d301f', b: '#eeb066', d: '#d18e45', l: '#f8dcae', a: '#f7c98a', w: '#fffaf0', e: EYE, c: CHEEK },
    body: [
      '................oo......',
      '...............oaao.....',
      '..............oaaaao....',
      '.............oaawaaao.w.',
      '....ooooooooooaaaaaaow..',
      '...obbbbbbbbbboaaaaobbo.',
      '..obbbdbbbbbbbboaaobbbbo',
      '.obbbbbbbbbbbbbbobbbebbw',
      'obbbbbbbdbbbbbbbbbbbcbo.',
      '.obbbbbbbbbbbbbbbllloo..',
      '..oollllllllllllloo.....',
    ],
    legs: [
      [
        '...obbo....obbo.........',
        '...obbo....obbo.........',
        '...owwo....owwo.........',
      ],
      [
        '....obbo..obbo..........',
        '....obbo..obbo..........',
        '....owwo..owwo..........',
      ],
    ],
  },
  {
    id: 'brachio',
    name: '브라키오',
    emoji: '🦒',
    palette: { o: '#25414b', b: '#74aebb', d: '#5a919e', l: '#ebe2b6', a: '#5a919e', w: '#f6f1e2', e: EYE, c: CHEEK },
    body: [
      '.................oooo...',
      '................obbbbo..',
      '................obbebbo.',
      '................obbcbo..',
      '...............obbloo...',
      '...............obblo....',
      '..............obblo.....',
      '..............obblo.....',
      '.....ooooooooobbblo.....',
      '...oobbbbbbbbbbbbbo.....',
      '.oobbbdbbbbbbbdbbbbo....',
      'obbbbbbbbbbbbbbbbbbo....',
      '...oolllllllllllloo.....',
    ],
    legs: [
      [
        '....obbo.....obbo.......',
        '....obbo.....obbo.......',
        '....owwo.....owwo.......',
      ],
      [
        '.....obbo...obbo........',
        '.....obbo...obbo........',
        '.....owwo...owwo........',
      ],
    ],
  },
  {
    id: 'trex',
    name: '티라노',
    emoji: '🦖',
    palette: { o: '#2f3b2a', b: '#a9bc6c', d: '#8a9e52', l: '#e5e8b4', a: '#8a9e52', w: '#fffdf5', e: EYE, c: CHEEK },
    body: [
      '...........oooooooo.....',
      '..........obbbbbebbo....',
      '..........obbbbbbbbbo...',
      '..........obbbcbbbbbbo..',
      '..........obbbbowwwwwo..',
      '..........obbbbboooooo..',
      '.........obbbbbo........',
      '........obbbbbbbo.......',
      '.......obbbbbbbbbowo....',
      '....oobbbbdbbbbbbo......',
      'ooobbbbbbbbbbblbbo......',
      '...oobbbbbbbbllbo.......',
    ],
    legs: [
      [
        '......obbo..obbo........',
        '......obbo..obbo........',
        '.....owwwo.owwwo........',
      ],
      [
        '.......obbo.obbo........',
        '.......obbo.obbo........',
        '......owwwoowwwo........',
      ],
    ],
  },
  {
    id: 'raptor',
    name: '랩터',
    emoji: '🐉',
    palette: { o: '#3d2531', b: '#b98390', d: '#9b6875', l: '#ecd2cd', a: '#86525f', w: '#fffaf5', e: EYE, c: CHEEK },
    body: [
      '................oooo....',
      '...............obbebo...',
      '...............obbbbboo.',
      '..............obbcbwwwo.',
      '.............obbbbooo...',
      'o.........ooobbbbo......',
      '.oooo..oooabababbo......',
      '....ooobbbbbbbbbbwo.....',
      '.......obbbbbbbbbo......',
      '........oolllllbo.......',
    ],
    legs: [
      [
        '.........obbo.obo.......',
        '.........obo..obo.......',
        '........owwo.owwo.......',
      ],
      [
        '..........obobbo........',
        '..........obo.obo.......',
        '.........owwoowwo.......',
      ],
    ],
  },
];

const BY_ID = new Map(DINOS.map((d) => [d.id, d]));
export function getDino(id: string | undefined): Dino {
  return BY_ID.get(id as DinoId) ?? DINOS[0]!;
}

/** 아픈 상태: 채도를 낮춰 칙칙하게 */
export function desaturate(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const gray = 0.3 * r + 0.59 * g + 0.11 * b;
  const mix = (c: number) => Math.round(c + (gray - c) * amount);
  return `#${((1 << 24) | (mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).slice(1)}`;
}

export interface DrawOpts {
  scale: number;
  frame: 0 | 1;
  facing: 1 | -1;
  sick: boolean;
  /** 과식 시 가로로 늘림 */
  stretch: number;
}

/** (x, y) = 스프라이트 왼쪽 위. 반환: 그린 폭·높이(px) */
export function drawDino(ctx: CanvasRenderingContext2D, dino: Dino, x: number, y: number, o: DrawOpts): { w: number; h: number } {
  const rows = [...dino.body, ...dino.legs[o.frame]];
  const cols = rows[0]!.length;
  const pw = Math.max(1, Math.round(o.scale * o.stretch));
  const ph = o.scale;
  rows.forEach((row, r) => {
    for (let c = 0; c < cols; c++) {
      const ch = row[c] as keyof Dino['palette'] | '.' | undefined;
      if (!ch || ch === '.') continue;
      let color = dino.palette[ch];
      if (!color) continue;
      if (o.sick && ch !== 'e' && ch !== 'o') color = desaturate(color, 0.6);
      const cx = o.facing === 1 ? c : cols - 1 - c;
      ctx.fillStyle = color;
      ctx.fillRect(x + cx * pw, y + r * ph, pw, ph);
    }
  });
  return { w: cols * pw, h: rows.length * ph };
}

export function dinoSize(dino: Dino, scale: number): { w: number; h: number } {
  return { w: dino.body[0]!.length * scale, h: (dino.body.length + dino.legs[0].length) * scale };
}
