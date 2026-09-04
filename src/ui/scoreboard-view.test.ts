import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScoreboardState } from '../types';
import {
  createScoreboardDisplayView,
  createScoreboardView,
  updateScoreboardView,
} from './scoreboard-view';

vi.mock('../scoreboard-service', () => ({
  setScoreboardTotals: vi.fn(),
}));

const state: ScoreboardState = {
  id: 1,
  challenge_count: 20,
  success_count: 5,
  revision: 7,
  updated_at: '2026-09-05T00:00:00Z',
};

describe('scoreboard-view', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.history.replaceState({}, '', '/');
  });

  it('管理画面へ集計値と編集欄を表示する', () => {
    document.getElementById('app')!.appendChild(createScoreboardView(vi.fn()));
    updateScoreboardView(state, null);

    expect(document.querySelector('[data-scoreboard-success]')?.textContent).toBe('5');
    expect(document.querySelector('[data-scoreboard-challenges]')?.textContent).toBe('20');
    expect((document.getElementById('scoreboard-success-input') as HTMLInputElement).value).toBe('5');
    expect((document.getElementById('scoreboard-challenge-input') as HTMLInputElement).value).toBe('20');
  });

  it('編集中の入力値を定期更新で上書きしない', () => {
    document.getElementById('app')!.appendChild(createScoreboardView(vi.fn()));
    updateScoreboardView(state, null);

    const input = document.getElementById('scoreboard-success-input') as HTMLInputElement;
    input.value = '8';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    updateScoreboardView({ ...state, success_count: 6 }, null);

    expect(input.value).toBe('8');
    expect(document.querySelector('[data-scoreboard-success]')?.textContent).toBe('6');
  });

  it('投影画面は操作欄を出さず、通信エラー時も最後の数字を維持する', () => {
    document.getElementById('app')!.appendChild(createScoreboardDisplayView());
    updateScoreboardView(state, null);
    updateScoreboardView(null, 'offline');

    expect(document.querySelector('.scoreboard-edit-panel')).toBeNull();
    expect(document.querySelector('[data-scoreboard-success]')?.textContent).toBe('5');
    expect(document.querySelector('[data-scoreboard-challenges]')?.textContent).toBe('20');
    expect(document.getElementById('scoreboard-display-status')?.textContent).toBe('通信確認中');
  });
});
