import { DAY_MS, type ActivityId } from '../data/config';
import { applyElapsed } from '../sim/catchup';
import { isCheckupDay } from '../sim/checkup';
import { chooseActivity, chooseMeal, endDay, takeMedicine } from '../sim/engine';
import { createState } from '../sim/state';
import type { PetState, Sex } from '../sim/types';
import { clearState, loadState, saveState, type StorageLike } from '../storage/local';
import { clear } from './dom';
import { createPetView } from './pet';
import { checkupDialog, dayScreen, resultScreen, startScreen } from './screens';

type Screen = 'start' | 'day' | 'result';

export function mountApp(root: HTMLElement, storage: StorageLike, persistent: boolean): void {
  let state: PetState | null = null;
  let screen: Screen = 'start';
  let overlay: HTMLElement | null = null;
  let pausedAt: number | null = null;
  const pet = createPetView();
  let day: ReturnType<typeof dayScreen> | null = null;

  const persist = () => { if (state) saveState(storage, state); };

  function show(next: Screen): void {
    screen = next;
    clear(root);
    if (screen === 'start') root.append(startScreen(loadState(storage), persistent, onStart, onResume));
    else if (screen === 'day') { day = dayScreen(pet, { onMeal, onActivity, onMedicine }); root.append(day.root); if (state) day.update(state); }
    else if (screen === 'result' && state) root.append(resultScreen(state, onRestart));
    window.scrollTo(0, 0);
  }

  function onStart(name: string, sex: Sex): void {
    state = createState(name, sex, Date.now());
    persist();
    show('day');
  }
  function onResume(): void {
    const saved = loadState(storage);
    if (!saved) return;
    state = applyElapsed(saved, Date.now());
    persist();
    afterChange();
  }
  function onRestart(): void {
    clearState(storage);
    state = null;
    show('start');
  }

  function onMeal(id: string | null): void {
    if (!state) return;
    state = chooseMeal(state, id);
    persist();
    day?.update(state);
  }
  function onActivity(id: ActivityId): void {
    if (!state) return;
    state = chooseActivity(state, id);
    finishDay();
  }
  function onMedicine(): void {
    if (!state) return;
    state = takeMedicine(state);
    persist();
    day?.refreshCards();
    day?.update(state);
  }

  function finishDay(): void {
    if (!state) return;
    state = endDay(state, Date.now());
    persist();
    afterChange();
  }

  /** endDay 이후: 엔딩·검진 팝업·화면 갱신 */
  function afterChange(): void {
    if (!state) return;
    if (state.ending !== 'playing') { closeOverlay(); show('result'); return; }
    if (screen !== 'day') show('day');
    day?.update(state);
    if (isCheckupDay(state.log.length) && !overlay) openOverlay(checkupDialog(state, () => { closeOverlay(); }));
  }

  function openOverlay(el: HTMLElement): void {
    overlay = el;
    pausedAt = Date.now();
    root.append(el);
    (el.querySelector('button') as HTMLButtonElement | null)?.focus();
  }
  function closeOverlay(): void {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    if (state && pausedAt !== null) { state = { ...state, updatedAt: state.updatedAt + (Date.now() - pausedAt) }; persist(); }
    pausedAt = null;
  }

  // 타이머·애니메이션 루프
  function frame(t: number): void {
    if (state && screen === 'day') {
      const now = pausedAt ?? Date.now();
      if (!overlay && now - state.updatedAt >= DAY_MS) finishDay();
      else day?.tick(state, now);
      pet.draw(state, t);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // 탭을 떠났다 돌아오면 경과 시간 보정
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state && screen === 'day' && !overlay) {
      const before = state.day;
      state = applyElapsed(state, Date.now());
      if (state.day !== before || state.ending !== 'playing') { persist(); afterChange(); }
    }
  });

  show('start');
}
