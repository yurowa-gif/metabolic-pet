import { TOTAL_DAYS } from '../data/config';
import { T } from '../sim/labels';
import { getFood } from '../sim/food';
import type { Summary } from '../sim/checkup';
import type { PetState } from '../sim/types';
import { h } from './dom';

const NS = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

interface Series { key: string; color: string; values: number[]; min: number; max: number; lines: { y: number; label: string }[] }

/** 3지표 꺾은선(각자 축 정규화) + 기준선 점선 */
export function timeline(s: PetState, sum: Summary): HTMLElement {
  const W = 360;
  const H = 150;
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 18;
  const days = Math.max(sum.days, 1);
  const x = (i: number) => padL + ((W - padL - padR) * i) / Math.max(TOTAL_DAYS - 1, 1);

  const series: Series[] = [
    { key: '공복혈당', color: '#b3261e', values: sum.series.glucose, min: 80, max: 150, lines: [{ y: T.glucosePre, label: '100' }, { y: T.glucoseOnset, label: '126' }] },
    { key: '수축기 혈압', color: '#2c7fb8', values: sum.series.sys, min: 100, max: 170, lines: [{ y: T.sysElevated, label: '120' }, { y: T.sysStage1, label: '140' }] },
    { key: 'LDL', color: '#8a5a00', values: sum.series.ldl, min: 80, max: 200, lines: [{ y: T.ldlPre, label: '130' }, { y: T.ldlOnset, label: '160' }] },
  ];

  const root = svg('svg', { viewBox: `0 0 ${W} ${H * series.length}`, role: 'img', 'aria-label': '20일 지표 변화 그래프' });
  series.forEach((sr, si) => {
    const top = si * H;
    const y = (v: number) => top + padT + (H - padT - padB) * (1 - (Math.min(Math.max(v, sr.min), sr.max) - sr.min) / (sr.max - sr.min));
    root.append(svg('rect', { x: padL, y: top + padT, width: W - padL - padR, height: H - padT - padB, fill: 'rgba(0,0,0,.03)' }));
    for (const ln of sr.lines) {
      root.append(svg('line', { x1: padL, x2: W - padR, y1: y(ln.y), y2: y(ln.y), stroke: '#8a5a00', 'stroke-dasharray': '4 3', 'stroke-width': 1 }));
      const t = svg('text', { x: padL - 4, y: y(ln.y) + 4, 'font-size': 10, 'text-anchor': 'end', fill: '#58636f' });
      t.textContent = ln.label;
      root.append(t);
    }
    const label = svg('text', { x: padL, y: top + padT + 10, 'font-size': 10, fill: sr.color, 'font-weight': 700 });
    label.textContent = sr.key;
    root.append(label);
    const pts = sr.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    if (sr.values.length > 1) root.append(svg('polyline', { points: pts, fill: 'none', stroke: sr.color, 'stroke-width': 2 }));
    sr.values.forEach((v, i) => root.append(svg('circle', { cx: x(i), cy: y(v), r: 2, fill: sr.color })));
    for (let d = 0; d < TOTAL_DAYS; d += 5) {
      const t = svg('text', { x: x(d), y: top + H - 4, 'font-size': 9, 'text-anchor': 'middle', fill: '#58636f' });
      t.textContent = `${d + 1}일`;
      root.append(t);
    }
  });

  // 식단 띠(하루 4칸 → 대표 이모지 1개: 그날 당·나트륨·포화지방 중 가장 높은 비율의 음식? 단순화: 첫 식사)
  const strip = h('div', { class: 'mealstrip', 'aria-label': '날짜별 식단' });
  for (let i = 0; i < days; i++) {
    const rec = s.log[i];
    const first = rec?.meals.find((m) => m) ?? null;
    strip.append(h('span', { title: rec ? rec.meals.map((m) => (m ? getFood(m).name : '거름')).join(', ') : '' }, first ? getFood(first).emoji : '—'));
  }
  return h('div', { class: 'timeline' }, root as unknown as Node, strip);
}
