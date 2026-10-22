import thresholds from '../data/thresholds.json';
import { ACTIVITY, type ActivityId } from '../data/config';
import { TEXTS } from '../data/texts';
import { FOODS, percentOfDaily, servingNutrients, type Food } from '../sim/food';
import { h } from './dom';

const DAILY = thresholds.dailyReference_label;

function pctSpan(label: string, v: number, warnAt: number, badAt: number): HTMLElement {
  const cls = v >= badAt ? 'bad' : v >= warnAt ? 'warn' : '';
  return h('span', { class: cls }, `${label} `, h('b', {}, `${v}%`));
}

/** 음식 카드: 1인분 열량과 1일 영양성분 기준치 대비 %(식품 라벨과 같은 방식) */
export function foodCard(f: Food, onPick: (id: string) => void): HTMLElement {
  const n = servingNutrients(f);
  const p = percentOfDaily(n, DAILY);
  const label = `${f.name}, 1인분 ${f.serving_g} g, 열량 ${Math.round(n.kcal)} kcal, 당류 기준치의 ${p.sugar}%, 나트륨 ${p.sodium}%, 포화지방 ${p.satFat}%, 식이섬유 ${p.fiber}%`;
  return h(
    'button',
    { class: 'btn foodcard', type: 'button', 'aria-label': label, onClick: () => onPick(f.id) },
    h('span', { class: 'name' }, `${f.emoji} ${f.name}`),
    h('span', { class: 'desc' }, `${Math.round(n.kcal)} kcal · ${f.serving_g} g · ${f.tag}`),
    h('span', { class: 'pct' }, pctSpan('당', p.sugar, 15, 25), pctSpan('나트륨', p.sodium, 25, 40), pctSpan('포화지방', p.satFat, 25, 40), pctSpan('섬유', p.fiber, 999, 999)),
  );
}

export function skipCard(onPick: () => void): HTMLElement {
  return h('button', { class: 'btn foodcard skip', type: 'button', 'aria-label': `${TEXTS.skip}: 이번 끼니를 건너뛴다`, onClick: onPick }, h('span', { class: 'name' }, `⏭ ${TEXTS.skip}`), h('span', { class: 'desc' }, '이번 끼니를 건너뛴다'));
}

/** 슬롯마다 6장 무작위(결정적이지 않아도 됨) */
export function pickFoods(count: number): Food[] {
  const pool = [...FOODS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count);
}

export function activityCard(id: ActivityId, onPick: (id: ActivityId) => void): HTMLElement {
  const a = TEXTS.activities[id];
  const eff = ACTIVITY[id];
  return h(
    'button',
    { class: 'btn foodcard', type: 'button', 'aria-label': `${a.name}: ${a.desc}`, onClick: () => onPick(id) },
    h('span', { class: 'name' }, `${a.emoji} ${a.name}`),
    h('span', { class: 'desc' }, a.desc),
    h('span', { class: 'pct' }, eff.glucose || eff.sys ? '혈당·혈압에 효과' : '지표 변화 없음'),
  );
}

export function medicineCard(taken: boolean, onPick: () => void): HTMLElement {
  const m = TEXTS.medicine;
  return h(
    'button',
    { class: 'btn foodcard', type: 'button', disabled: taken, 'aria-label': `${m.name}: ${m.desc}`, onClick: onPick },
    h('span', { class: 'name' }, `${m.emoji} ${m.name}${taken ? ' (복용함)' : ''}`),
    h('span', { class: 'desc' }, m.desc),
  );
}
