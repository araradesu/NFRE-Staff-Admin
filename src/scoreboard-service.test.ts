import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearScoreboardState,
  pauseScoreboardPolling,
  resumeScoreboardPolling,
  setScoreboardTotals,
  startScoreboardPolling,
  stopScoreboardPolling,
} from './scoreboard-service';

const scoreboardRow = {
  id: 1,
  challenge_count: 20,
  success_count: 5,
  revision: 7,
  updated_at: '2026-09-05T00:00:00Z',
};

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockRpc = vi.fn();

vi.mock('./supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

describe('scoreboard-service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopScoreboardPolling();
    clearScoreboardState();
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: scoreboardRow, error: null });
  });

  afterEach(() => {
    stopScoreboardPolling();
    vi.useRealTimers();
  });

  it('開始直後と10秒ごとに最新の集計を取得する', async () => {
    const callback = vi.fn();
    startScoreboardPolling(callback);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockFrom).toHaveBeenCalledWith('scoreboard_totals');
    expect(mockSelect).toHaveBeenCalledWith('id, challenge_count, success_count, revision, updated_at');
    expect(mockEq).toHaveBeenCalledWith('id', 1);
    expect(callback).toHaveBeenCalledWith(scoreboardRow, null);

    await vi.advanceTimersByTimeAsync(10000);
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it('非表示中は取得を止め、再表示時に即時取得する', async () => {
    startScoreboardPolling(vi.fn());
    await Promise.resolve();
    await Promise.resolve();

    pauseScoreboardPolling();
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFrom).toHaveBeenCalledTimes(1);

    resumeScoreboardPolling();
    await Promise.resolve();
    await Promise.resolve();
    expect(mockFrom).toHaveBeenCalledTimes(2);
  });

  it('revisionを添えて手動修正RPCを呼び出す', async () => {
    const updated = { ...scoreboardRow, challenge_count: 21, success_count: 6, revision: 8 };
    mockRpc.mockResolvedValue({ data: updated, error: null });

    await expect(setScoreboardTotals(21, 6, 7)).resolves.toEqual(updated);
    expect(mockRpc).toHaveBeenCalledWith('set_scoreboard_totals', {
      p_challenge_count: 21,
      p_success_count: 6,
      p_expected_revision: 7,
    });
  });

  it('合格数が受験数を超える入力を送信しない', async () => {
    await expect(setScoreboardTotals(3, 4, 7))
      .rejects.toThrow('合格チーム数を受験チーム数より多くすることはできません。');
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
