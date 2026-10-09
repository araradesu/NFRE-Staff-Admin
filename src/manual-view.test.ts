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
    expect(view.textContent).toContain('案内スタッフ');
    expect(view.textContent).toContain('試験スタッフ');
    expect(view.textContent).toContain('固い言葉で案内しない');
    expect(view.textContent).toContain('11月祭謎解き試験に参加される方ですかね？');
    expect(view.textContent).toContain('小学生未満は人数に数えなくてよい');
    expect(view.textContent).toContain('間違いないですね？？');
    expect(view.textContent).toContain('ポケットの中とか、スマートフォン、貴重品入ってないですか？');
    expect(view.textContent).toContain('何かやりたいことがある場合は、思い切ってやってみていいですよ。');
    expect(view.textContent).toContain('山平へ確認する');
    expect(view.textContent).toContain('転換をダブルチェックする');
    expect(view.textContent).toContain('退出後に転換する（1st）');
    expect(view.textContent).toContain('余裕があれば1stとは別の人');
    expect(view.textContent).toContain('電池の向きを確認して入れ直し');
    expect(view.textContent).toContain('謎の箱に四桁錠を「0000」で取り付け、施錠する');
    expect(view.textContent).toContain('10項目すべてを確認し、不足や置き間違いを直してからリセットする');
    expect(view.querySelector<HTMLImageElement>('img[alt*="机上配置図"]')).not.toBeNull();
    expect(view.querySelector<HTMLImageElement>('img[alt*="落とし物配置写真"]')).not.toBeNull();
    expect(view.textContent).toContain('雇われのスタッフ');
    expect(view.textContent).toContain('試験担当の先生の名前も事前には知らない');
    expect(view.textContent).toContain('Web管理画面の使い方');
    expect(view.textContent).toContain('Ctrl');
    expect(view.textContent).toContain('最終行動の対応');
    expect(view.textContent).toContain('ひらやま……かい先生のか……。');
    expect(view.textContent).toContain('落とし物としてスタッフへ直接渡す');
    expect(view.textContent).toContain('正しい小物入れを会場内へ実際に落とす');
    expect(view.textContent).toContain('エラーコード画面へ到達したら先回りして対応する');
    expect(view.textContent).toContain('残り時間が02:00以下');
    expect(view.textContent).toContain('あ、エラー起きちゃってますね……。');
    expect(view.textContent).toContain('あ、そうですか。お渡ししますね。');
    expect(view.textContent).toContain('もう少しボリュームは抑えめでお願いします');
    expect(view.textContent).toContain('参加者へタイマーの一時停止・再開は伝えない。');
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
