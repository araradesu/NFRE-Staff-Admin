import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createManualView } from './ui/manual-view';
import { createDashboardView } from './ui/dashboard-view';

vi.mock('./auth', () => ({
  logout: vi.fn().mockResolvedValue(true),
}));

describe('staff manual', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('本番フロー・管理画面・ショートカット・最終行動対応を表示する', () => {
    const view = createManualView({ onBack: vi.fn() });
    document.body.appendChild(view);

    expect(view.textContent).toContain('本番の流れ');
    expect(view.textContent).toContain('Web管理画面の使い方');
    expect(view.textContent).toContain('Ctrl');
    expect(view.textContent).toContain('最終行動の対応');
    expect(view.textContent).toContain('平山……海……先生のか。');
    expect(view.textContent).toContain('「けっさく」のピースだけが入った小物入れを、会場の床に落とす。');
    expect(view.textContent).toContain('エラーコードについて呼ばれた');
    expect(view.textContent).toContain('この対応は必須ではない。');
    expect(view.textContent).toContain('タイマーを一時停止・再開したことを伝えない。');
    expect(view.textContent).not.toContain('未登録');
  });

  it('検索語に一致しない項目を隠す', () => {
    const view = createManualView({ onBack: vi.fn() });
    document.body.appendChild(view);
    const search = view.querySelector<HTMLInputElement>('.manual-search')!;

    search.value = 'ショートカット';
    search.dispatchEvent(new Event('input'));

    const visibleEntries = Array.from(view.querySelectorAll<HTMLElement>('.manual-entry'))
      .filter(entry => !entry.hidden);
    expect(visibleEntries.length).toBeGreaterThan(0);
    expect(view.querySelector<HTMLElement>('#manual-shortcuts')!.hidden).toBe(false);
    expect(view.querySelector<HTMLElement>('#manual-flow')!.hidden).toBe(true);
  });

  it('ダッシュボードへ戻るボタンを呼び出す', () => {
    const onBack = vi.fn();
    const view = createManualView({ onBack });
    view.querySelector<HTMLButtonElement>('[data-manual-back]')!.click();
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('ダッシュボードのマニュアルボタンから開ける', () => {
    const onOpenManual = vi.fn();
    const dashboard = createDashboardView(onOpenManual);
    const button = Array.from(dashboard.querySelectorAll('button'))
      .find(candidate => candidate.textContent === 'マニュアル')!;
    button.click();
    expect(onOpenManual).toHaveBeenCalledOnce();
  });
});
