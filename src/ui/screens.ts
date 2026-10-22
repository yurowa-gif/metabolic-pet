import { DAY_MS, EER, MEAL_SLOTS, type ActivityId } from '../data/config';
import { QUIZ } from '../data/quiz';
import { TEXTS } from '../data/texts';
import { checkup, summarize, type Checkup } from '../sim/checkup';
import { canTakeMedicine } from '../sim/engine';
import { getFood } from '../sim/food';
import { hasOnset } from '../sim/state';
import type { PetState, Sex } from '../sim/types';
import { activityCard, foodCard, medicineCard, pickFoods, skipCard } from './cards';
import { clear, h, stageClass } from './dom';
import type { PetView } from './pet';
import { timeline } from './timeline';

export interface DayHandlers {
  onMeal(id: string | null): void;
  onActivity(id: ActivityId): void;
  onMedicine(): void;
}

export function startScreen(saved: PetState | null, persistent: boolean, onStart: (name: string, sex: Sex) => void, onResume: () => void): HTMLElement {
  const name = h('input', { type: 'text', id: 'name', maxlength: '8', placeholder: '펫 이름 (예: 콩이)', autocomplete: 'off' }) as HTMLInputElement;
  const form = h('form', { class: 'card', onSubmit: (e) => { e.preventDefault(); const sex = (form.querySelector('input[name=sex]:checked') as HTMLInputElement | null)?.value as Sex | undefined; onStart(name.value, sex ?? 'female'); } },
    h('div', { class: 'field' }, h('label', { for: 'name' }, '펫 이름'), name),
    h('div', { class: 'field' },
      h('span', {}, '기준 열량 (2025 한국인 영양소 섭취기준, 15–18세)'),
      h('div', { class: 'radio-row' },
        h('label', {}, h('input', { type: 'radio', name: 'sex', value: 'female', checked: true }), h('span', {}, `여 ${EER.female.toLocaleString()} kcal`)),
        h('label', {}, h('input', { type: 'radio', name: 'sex', value: 'male' }), h('span', {}, `남 ${EER.male.toLocaleString()} kcal`)),
      ),
    ),
    h('button', { class: 'btn btn-primary', type: 'submit' }, '새로 시작'),
  );
  return h('section', { class: 'screen' },
    h('h1', {}, TEXTS.title),
    h('p', { class: 'muted' }, TEXTS.subtitle),
    h('p', {}, TEXTS.startHint),
    saved && saved.ending === 'playing' ? h('div', { class: 'card' }, h('p', {}, `저장된 게임: ${saved.name}, ${saved.day}일차`), h('button', { class: 'btn btn-primary', type: 'button', onClick: onResume }, '이어하기')) : null,
    form,
    h('p', { class: 'muted' }, TEXTS.disclaimer),
    persistent ? null : h('p', { class: 'muted' }, '⚠ 이 브라우저에서는 저장이 되지 않습니다(사생활 모드). 탭을 닫으면 처음부터 시작합니다.'),
  );
}

/** 하루 루프 화면. 상태가 바뀔 때마다 update(state)로 다시 그린다. */
export function dayScreen(pet: PetView, handlers: DayHandlers) {
  const dayLabel = h('span', {});
  const timerBar = h('div', { class: 'timer', role: 'progressbar', 'aria-label': '오늘 남은 시간' }, h('i', { style: 'width:100%' }));
  const gauges = { fullness: gauge('fullness', '🍚 오늘 먹은 양'), vitality: gauge('vitality', '⚡ 활력'), health: gauge('health', '❤ 건강') };
  const bubble = h('div', { class: 'bubble', hidden: true });
  const stageLine = h('p', { class: 'muted' });
  const slotTitle = h('h2', {});
  const slotHint = h('span', { class: 'muted' });
  const cards = h('div', { class: 'cards' });
  const root = h('section', { class: 'screen' },
    h('div', { class: 'dayline' }, dayLabel, h('span', { class: 'muted' }, '')),
    timerBar,
    h('div', { class: 'hud' }, gauges.fullness.el, gauges.vitality.el, gauges.health.el),
    h('div', { class: 'yard' }, pet.canvas, bubble),
    stageLine,
    h('div', { class: 'slot-title' }, slotTitle, slotHint),
    cards,
  );

  let lastSlotKey = '';
  function update(s: PetState): void {
    dayLabel.textContent = `${s.day}일차 / 20일`;
    gauges.fullness.set(s.gauges.fullness, 130);
    gauges.vitality.set(s.gauges.vitality, 100);
    gauges.health.set(s.gauges.health, 100);
    const st = s.disease;
    const parts: string[] = [];
    if (st.diabetes !== 'none') parts.push(`당뇨병 ${st.diabetes === 'pre' ? '전단계' : '발병'}`);
    if (st.hypertension !== 'none') parts.push(`고혈압 ${st.hypertension === 'pre' ? '전단계' : '발병'}`);
    if (st.dyslipidemia !== 'none') parts.push(`이상지질혈증 ${st.dyslipidemia === 'pre' ? '경계' : '발병'}`);
    stageLine.textContent = parts.length ? `상태: ${parts.join(' · ')}` : '상태: 특이 소견 없음 (검진은 5일마다)';
    const b = bubbleText(s);
    bubble.hidden = !b;
    bubble.textContent = b ?? '';

    const key = `${s.day}-${s.slot}`;
    if (key === lastSlotKey) return;
    lastSlotKey = key;
    clear(cards);
    if (s.slot < MEAL_SLOTS) {
      slotTitle.textContent = `${TEXTS.slotNames[s.slot]} 무엇을 먹을까?`;
      slotHint.textContent = `${s.slot + 1} / ${MEAL_SLOTS}끼 · %는 1일 기준치 대비`;
      for (const f of pickFoods(5)) cards.append(foodCard(f, handlers.onMeal));
      cards.append(skipCard(() => handlers.onMeal(null)));
    } else {
      slotTitle.textContent = '오늘 활동은?';
      slotHint.textContent = hasOnset(s) ? '발병 중: 약 카드 사용 가능' : '';
      for (const a of ['walk', 'exercise', 'rest', 'allnighter'] as ActivityId[]) cards.append(activityCard(a, handlers.onActivity));
      if (hasOnset(s)) cards.append(medicineCard(!canTakeMedicine(s), handlers.onMedicine));
    }
  }
  function tick(s: PetState, now: number): void {
    const remaining = Math.max(0, DAY_MS - (now - s.updatedAt));
    const bar = timerBar.firstElementChild as HTMLElement;
    bar.style.width = `${(remaining / DAY_MS) * 100}%`;
    timerBar.classList.toggle('last-ten', remaining <= 10_000);
    timerBar.setAttribute('aria-valuenow', String(Math.ceil(remaining / 1000)));
  }
  /** 약을 먹은 뒤 카드 상태 갱신 */
  function refreshCards(): void { lastSlotKey = ''; }
  return { root, update, tick, refreshCards };
}

function gauge(key: string, label: string) {
  const val = h('b', {});
  const fill = h('i', {});
  const el = h('div', { class: 'gauge', 'data-k': key, role: 'meter', 'aria-label': label }, h('span', {}, `${label} `), val, h('div', { class: 'bar' }, fill));
  let prev: number | null = null;
  return {
    el,
    set(v: number, max: number) {
      val.textContent = String(Math.round(v));
      fill.style.width = `${Math.min(100, (v / max) * 100)}%`;
      el.setAttribute('aria-valuenow', String(Math.round(v)));
      if (prev !== null && v !== prev) {
        el.classList.add(v > prev ? 'flash-up' : 'flash-down');
        setTimeout(() => el.classList.remove('flash-up', 'flash-down'), 400);
      }
      prev = v;
    },
  };
}

function bubbleText(s: PetState): string | null {
  const B = TEXTS.bubbles;
  const d = s.disease;
  if (d.diabetes === 'onset') return B.diabetesOnset;
  if (d.hypertension === 'onset') return B.hypertensionOnset;
  if (d.dyslipidemia === 'onset') return B.dyslipidemiaOnset;
  if (d.diabetes === 'pre') return B.diabetesPre;
  if (d.hypertension === 'pre') return B.hypertensionPre;
  if (d.dyslipidemia === 'pre') return B.dyslipidemiaPre;
  if (s.gauges.fullness > 130) return B.overfull;
  if (s.gauges.vitality <= 20) return B.tired;
  if (s.slot === 0 && s.gauges.fullness === 0 && s.day > 1) return B.hungry;
  return null;
}

export function checkupTable(c: Checkup): HTMLElement {
  return h('table', { class: 'checkup' },
    h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, '항목'), h('th', { scope: 'col' }, '수치'), h('th', { scope: 'col' }, '판정'))),
    h('tbody', {}, ...c.rows.map((r) => h('tr', {}, h('th', { scope: 'row' }, r.name), h('td', {}, `${r.value} ${r.unit}`), h('td', { class: stageClass(r.stage) }, r.label)))),
  );
}

export function sourcesList(): HTMLElement {
  return h('ul', { class: 'sources' }, ...TEXTS.sources.map((src) => h('li', {}, h('a', { href: src.url, target: '_blank', rel: 'noopener' }, src.name))));
}

export function dialog(title: string, body: HTMLElement[], actions: HTMLElement[]): HTMLElement {
  const d = h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('h2', {}, title), ...body, h('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, ...actions));
  return h('div', { class: 'overlay' }, d);
}

export function checkupDialog(s: PetState, onClose: () => void): HTMLElement {
  const c = checkup(s);
  let showSources = false;
  const srcBox = h('div', {});
  const toggle = h('button', { class: 'btn btn-ghost', type: 'button', onClick: () => { showSources = !showSources; clear(srcBox); if (showSources) srcBox.append(sourcesList()); } }, '출처');
  return dialog(`${c.day}일차 건강검진`, [
    h('p', { class: 'muted' }, '판정 기준: 대한당뇨병학회(2023)·대한고혈압학회(2022)·한국지질·동맥경화학회(2022) 진료지침'),
    checkupTable(c),
    srcBox,
  ], [h('button', { class: 'btn btn-primary', type: 'button', onClick: onClose }, '계속'), toggle]);
}

export function resultScreen(s: PetState, onRestart: () => void): HTMLElement {
  const sum = summarize(s);
  const c = checkup(s);
  const driverName = { sugar: '당류(가당음료 등)', sodium: '나트륨', satFat: '포화지방', energy: '총 열량', none: '없음(기준 이내)' }[sum.topDriver];
  const firstDays = (['diabetes', 'hypertension', 'dyslipidemia'] as const).map((k) => {
    const nm = { diabetes: '당뇨병', hypertension: '고혈압', dyslipidemia: '이상지질혈증' }[k];
    const f = sum.firstDay[k];
    if (!f.pre && !f.onset) return `${nm}: 없음`;
    return `${nm}: 전단계 ${f.pre ?? '-'}일차${f.onset ? `, 발병 ${f.onset}일차` : ''}`;
  });
  const topMeals = Object.entries(sum.mealCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => `${getFood(id).emoji} ${getFood(id).name} ×${n}`).join(' · ');

  const quizBox = h('div', { class: 'quiz card' }, h('h2', {}, '확인 퀴즈'));
  for (const q of QUIZ) {
    const choices = h('div', { class: 'choices' });
    const why = h('p', { class: 'muted', hidden: true }, q.why);
    q.choices.forEach((ch, i) => {
      const b = h('button', { class: 'btn', type: 'button', onClick: () => {
        for (const other of Array.from(choices.children)) (other as HTMLButtonElement).disabled = true;
        b.classList.add(i === q.answer ? 'correct' : 'wrong');
        (choices.children[q.answer] as HTMLElement).classList.add('correct');
        why.hidden = false;
      } }, `${i + 1}. ${ch}`);
      choices.append(b);
    });
    quizBox.append(h('div', { style: 'margin-top:12px' }, h('p', {}, h('b', {}, q.q)), choices, why));
  }

  return h('section', { class: 'screen' },
    h('h1', {}, s.ending === 'hospital' ? TEXTS.ending.hospital : TEXTS.ending.finished),
    s.ending === 'hospital' ? h('p', {}, TEXTS.ending.hospitalWhy) : null,
    h('div', { class: 'card' }, h('h2', {}, `${sum.days}일차 최종 검진표`), checkupTable(c)),
    h('div', { class: 'card' },
      h('h2', {}, '무슨 일이 있었나'),
      h('ul', {}, ...firstDays.map((t) => h('li', {}, t))),
      h('p', {}, `가장 많이 기준을 넘긴 요인: `, h('b', {}, driverName)),
      h('p', { class: 'muted' }, `평균 비율 — 열량 ${sum.avgRatios.rE.toFixed(2)}, 당류 ${sum.avgRatios.rSugar.toFixed(2)}, 나트륨 ${sum.avgRatios.rNa.toFixed(2)}, 포화지방 ${sum.avgRatios.rSat.toFixed(2)} (1.00 = 기준)`),
      h('p', { class: 'muted' }, `자주 먹은 것: ${topMeals || '-'} · 거른 끼니 ${sum.skippedMeals}회 · 산책/운동 ${sum.exerciseDays}일`),
    ),
    h('div', { class: 'card' }, h('h2', {}, '20일 타임라인'), h('div', { class: 'legend' }, h('span', {}, h('i', { style: 'background:#b3261e' }), '공복혈당'), h('span', {}, h('i', { style: 'background:#2c7fb8' }), '수축기 혈압'), h('span', {}, h('i', { style: 'background:#8a5a00' }), 'LDL'), h('span', { class: 'muted' }, '점선 = 전단계/발병 기준')), timeline(s, sum)),
    quizBox,
    h('div', { class: 'card' }, h('h2', {}, '출처'), sourcesList(), h('p', { class: 'muted' }, TEXTS.disclaimer)),
    h('p', { class: 'muted' }, '이 화면을 캡처해서 제출하세요.'),
    h('button', { class: 'btn btn-primary', type: 'button', onClick: onRestart }, '다시 시작'),
  );
}
