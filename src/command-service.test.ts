import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendCommand,
  notifyRevision,
  cancelAllWatches,
  activateCommandService,
  pauseAllWatches,
  resumeAllWatches,
  subscribeStatus,
  getCommandStatus,
} from './command-service';

// supabaseをモック
const mockInsert = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('./supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'team_commands') {
        return {
          insert: mockInsert,
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        };
      }
      return {};
    }),
  })),
}));

const MOCK_TEAM: any = {
  team_id: 'TEAM_01',
  session_id: 'sess-abc',
  revision: 5,
  is_staff_success: false,
  remaining_seconds: 100,
  last_seen_at: new Date().toISOString(),
  current_phase: 'EXAM_IN_PROGRESS',
  timer_running: true,
  timer_paused: false,
  is_go_executed: false,
  device_id: 'dev1',
  staff_success_time: 0,
  last_command_id: null,
  last_command_result: null,
  updated_at: new Date().toISOString(),
};

describe('command-service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cancelAllWatches();
    activateCommandService();
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockMaybeSingle.mockResolvedValue({ data: { command_id: 'x', result: 'PENDING', rejection_reason: null, applied_revision: null }, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    cancelAllWatches();
  });

  // 1. INSERT内容が正確
  it('INSERTに必要な列だけを含む', async () => {
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve();

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const payload = mockInsert.mock.calls[0][0];
    expect(payload).toHaveProperty('command_id');
    expect(payload).toHaveProperty('team_id', 'TEAM_01');
    expect(payload).toHaveProperty('expected_session_id', 'sess-abc');
    expect(payload).toHaveProperty('expected_revision', 5);
    expect(payload).toHaveProperty('command_type', 'PAUSE_TIMER');
    expect(payload).toHaveProperty('payload');
  });

  // 2. issued_by等を送信しない
  it('issued_by/issued_at/result/processed_atをINSERTしない', async () => {
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve();

    const payload = mockInsert.mock.calls[0][0];
    expect(payload).not.toHaveProperty('issued_by');
    expect(payload).not.toHaveProperty('issued_at');
    expect(payload).not.toHaveProperty('result');
    expect(payload).not.toHaveProperty('processed_at');
    expect(payload).not.toHaveProperty('rejection_reason');
    expect(payload).not.toHaveProperty('applied_revision');
  });

  // 3. 二重クリックで1件のみINSERTされる
  it('二重クリックで1件のみINSERT', async () => {
    sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    sendCommand('TEAM_01', 'RESUME_TIMER', {}, MOCK_TEAM); // 2回目は無視される
    await Promise.resolve();
    await Promise.resolve();

    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  // 4. session_id/revisionが現在状態由来
  it('expected_session_id と expected_revision はteam stateから取得する', async () => {
    const customTeam = { ...MOCK_TEAM, session_id: 'SPECIFIC-SESSION', revision: 42 };
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, customTeam);
    await Promise.resolve();

    const payload = mockInsert.mock.calls[0][0];
    expect(payload.expected_session_id).toBe('SPECIFIC-SESSION');
    expect(payload.expected_revision).toBe(42);
  });

  // 5. APPLIED後、revision反映前は操作不可
  it('APPLIED後はrevisionが反映されるまでロック維持', async () => {
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve();

    // mock: 結果をAPPLIEDにする (applied_revision = 10)
    mockMaybeSingle.mockResolvedValueOnce({
      data: { command_id: 'x', result: 'APPLIED', rejection_reason: null, applied_revision: 10 },
      error: null,
    });

    vi.advanceTimersByTime(2000);
    await Promise.resolve(); await Promise.resolve();

    const st = getCommandStatus('TEAM_01');
    expect(st.status).toBe('lock_applied');

    // revision=9では解除されない
    notifyRevision('TEAM_01', 9);
    expect(getCommandStatus('TEAM_01').status).toBe('lock_applied');

    // revision=10以上で解除 (applied になる)
    notifyRevision('TEAM_01', 10);
    expect(getCommandStatus('TEAM_01').status).toBe('applied');
  });

  // 6. PENDINGタイムアウト後も監視継続
  it('15秒後にtimeoutになっても監視継続、その後APPLIEDに反映', async () => {
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve();

    // 15秒経過 → timeout表示になる
    vi.advanceTimersByTime(15001);
    await Promise.resolve();
    expect(getCommandStatus('TEAM_01').status).toBe('timeout');

    // さらにポーリングがAPPLIEDを返す
    mockMaybeSingle.mockResolvedValueOnce({
      data: { command_id: 'x', result: 'APPLIED', rejection_reason: null, applied_revision: 6 },
      error: null,
    });
    vi.advanceTimersByTime(2000);
    await Promise.resolve(); await Promise.resolve();

    expect(getCommandStatus('TEAM_01').status).toBe('lock_applied');
  });

  // 7. INSERT応答消失後、command_idの存在確認と監視継続
  it('INSERT応答不明時はcommand_idで存在確認し監視継続', async () => {
    // エラー応答（5xx）でINSERTが失敗
    mockInsert.mockResolvedValueOnce({ error: { message: 'timeout', status: 504 } });

    // 存在確認: DBにあり、PENDING
    mockMaybeSingle.mockResolvedValueOnce({
      data: { command_id: 'x', result: 'PENDING', rejection_reason: null, applied_revision: null },
      error: null,
    });

    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    // 監視中に切り替わっているはず (sendingからpendingへ、存在確認で)
    const st = getCommandStatus('TEAM_01');
    expect(st.status).toBe('pending');
  });

  // 8. REJECTED後、次回State更新前は操作不可
  it('REJECTED後もState更新まではロック維持', async () => {
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve();

    mockMaybeSingle.mockResolvedValueOnce({
      data: { command_id: 'x', result: 'REJECTED', rejection_reason: 'INVALID_PHASE', applied_revision: null },
      error: null,
    });
    vi.advanceTimersByTime(2000);
    await Promise.resolve(); await Promise.resolve();

    expect(getCommandStatus('TEAM_01').status).toBe('lock_rejected');

    // notifyRevisionが届いてからロック解除 (rejected になる)
    notifyRevision('TEAM_01', 5);
    expect(getCommandStatus('TEAM_01').status).toBe('rejected');
  });

  // 9. ログアウトで全監視停止
  it('cancelAllWatchesで全監視停止', async () => {
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve();

    cancelAllWatches();
    vi.advanceTimersByTime(4000);
    await Promise.resolve();

    // INSERT後の呼び出し数より増えていない
    expect(mockMaybeSingle.mock.calls.length).toBe(0);
  });

  // 10. 内部エラーを表示しない（エラーメッセージがSQLやURLを含まない）
  it('内部エラー時にSQLやURLを公開しない', async () => {
    const errors: string[] = [];
    const cb = vi.fn((s: any) => {
      if (s.rejectionReason) errors.push(s.rejectionReason);
    });
    subscribeStatus('TEAM_01', cb);

    mockInsert.mockRejectedValueOnce(new Error('https://supabase.io/query failed: secret_token'));
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    // rejectionReasonにURL/SQLが含まれない
    errors.forEach(e => {
      expect(e).not.toContain('https://');
      expect(e).not.toContain('SELECT');
    });
  });

  // 11. 非表示→再表示でPENDING監視再開
  it('pauseAllWatches後にresumeAllWatchesでPENDING監視再開', async () => {
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve();

    pauseAllWatches();

    resumeAllWatches();
    // 再開後にタイマーを進めてポーリングを実行
    vi.advanceTimersByTime(2000);
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    // 再開後にポーリングが発生している
    expect(mockMaybeSingle.mock.calls.length).toBeGreaterThan(0);
  });

  // 12. data nullだけsend_failed
  it('errorなしでdataがnullの場合のみsend_failedにする', async () => {
    // mock: DBに無い
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    // mockInsert: error
    mockInsert.mockResolvedValueOnce({ error: { message: 'Network', status: 504 } });

    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    expect(getCommandStatus('TEAM_01').status).toBe('send_failed');
  });

  // 13. PENDING確認後は厳密にpending
  it('DBでPENDINGを確認したら厳密にpendingへ変更する', async () => {
    // mockInsert: error -> force verifyAndWatch
    mockInsert.mockResolvedValueOnce({ error: { message: 'Network', status: 504 } });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { command_id: 'x', result: 'PENDING', rejection_reason: null, applied_revision: null },
      error: null
    });

    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

    expect(getCommandStatus('TEAM_01').status).toBe('pending');
  });

  // 14. ログアウト→再ログイン後の旧レスポンス破棄
  it('ログアウト後の古い非同期レスポンスを適用しない(lifecycleGeneration)', async () => {
    // INSERT遅延シミュレート
    let resolveInsert: any;
    const insertPromise = new Promise(r => { resolveInsert = r; });
    mockInsert.mockReturnValueOnce(insertPromise);

    const promise = sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);

    // 送信中にログアウト
    cancelAllWatches();
    // 再ログイン
    activateCommandService();

    // 今更INSERTが返る (成功扱い)
    resolveInsert({ error: null });
    await promise;
    await Promise.resolve();

    // 古い通信なので無視され、今の状態はidleのはず
    expect(getCommandStatus('TEAM_01').status).toBe('idle');
  });

  // 15. APPLIED/REJECTED/DUPLICATEの終端表示保持
  it('終端状態へ移行後もcommandTypeや拒否理由を維持する', async () => {
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve();

    mockMaybeSingle.mockResolvedValueOnce({
      data: { command_id: 'x', result: 'REJECTED', rejection_reason: 'INVALID_PHASE', applied_revision: null },
      error: null,
    });
    vi.advanceTimersByTime(2000);
    await Promise.resolve(); await Promise.resolve();

    notifyRevision('TEAM_01', 5); // lock_rejected -> rejected

    const st = getCommandStatus('TEAM_01');
    expect(st.status).toBe('rejected');
    expect(st.commandType).toBe('PAUSE_TIMER'); // 維持されていること
    expect(st.rejectionReason).toContain('フェーズ'); // 日本語マップ
  });

  // 16. ログアウト後は再開しない
  it('ログアウト後のresumeAllWatchesでは再開しない', async () => {
    await sendCommand('TEAM_01', 'PAUSE_TIMER', {}, MOCK_TEAM);
    await Promise.resolve();

    cancelAllWatches();
    resumeAllWatches(); // ログアウト後に何らかの理由で呼ばれても無視

    vi.advanceTimersByTime(2000);
    await Promise.resolve(); await Promise.resolve();

    // ログアウト時の状態が保たれる
    expect(getCommandStatus('TEAM_01').status).toBe('idle');
  });
});
