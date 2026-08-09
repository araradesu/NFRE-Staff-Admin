/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTeamCard, updateTeamCard } from './ui/team-card';
import type { TeamState, TeamCommandState } from './types';
import { sendCommand, subscribeStatus } from './command-service';
import { showConfirmDialog } from './ui/confirm-dialog';

vi.mock('./supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

vi.mock('./command-service', () => ({
  sendCommand: vi.fn(),
  subscribeStatus: vi.fn((_teamId, cb) => {
    cb({ status: 'idle', commandId: null, commandType: null, appliedRevision: null, rejectionReason: null });
    return () => {};
  }),
  getCommandStatus: vi.fn(() => ({ status: 'idle', commandId: null, commandType: null, appliedRevision: null, rejectionReason: null })),
}));

vi.mock('./ui/confirm-dialog', () => ({
  showConfirmDialog: vi.fn().mockResolvedValue(false),
}));

function makeTeam(overrides: Partial<TeamState> = {}): TeamState {
  return {
    team_id: 'TEAM_01',
    device_id: 'dev1',
    session_id: 'sess1',
    revision: 5,
    current_phase: 'EXAM_IN_PROGRESS',
    remaining_seconds: 300,
    timer_running: true,
    timer_paused: false,
    is_staff_success: true,
    staff_success_time: 120,
    is_go_executed: false,
    last_command_id: null,
    last_command_result: null,
    updated_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(), // CONNECTED
    ...overrides,
  };
}

function defaultCs(): TeamCommandState {
  return {
    status: 'idle',
    commandId: null,
    commandType: null,
    appliedRevision: null,
    rejectionReason: null,
  };
}

function lockedCs(): TeamCommandState {
  return { ...defaultCs(), status: 'pending', commandId: 'xxx' };
}

describe('team-card', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('初回生成直後からCONNECTEDでは適切に操作可能', () => {
    const team = makeTeam();
    const card = createTeamCard(team);
    document.body.appendChild(card);

    const goBtn = card.querySelector<HTMLButtonElement>('[data-cmd-type="EXECUTE_GO"]');
    expect(goBtn).not.toBeNull();
    expect(goBtn!.disabled).toBe(false);
  });

  it('PENDING中はボタンが無効化される', () => {
    const team = makeTeam();
    const card = createTeamCard(team);
    document.body.appendChild(card);
    updateTeamCard(card, team, lockedCs());

    const goBtn = card.querySelector<HTMLButtonElement>('[data-cmd-type="EXECUTE_GO"]');
    expect(goBtn!.disabled).toBe(true);
  });

  it('初回生成直後からDISCONNECTED/UNREGISTEREDでは全操作不可', () => {
    const team = makeTeam({ last_seen_at: '2000-01-01T00:00:00Z' }); // 古い = 切断
    const card = createTeamCard(team);
    document.body.appendChild(card);

    const goBtn = card.querySelector<HTMLButtonElement>('[data-cmd-type="EXECUTE_GO"]');
    expect(goBtn!.disabled).toBe(true);

    const unregTeam = makeTeam({ last_seen_at: '' });
    const card2 = createTeamCard(unregTeam);
    document.body.appendChild(card2);
    const goBtn2 = card2.querySelector<HTMLButtonElement>('[data-cmd-type="EXECUTE_GO"]');
    expect(goBtn2!.disabled).toBe(true);
  });

  it('Go実行済み時はボタンが無効化される', () => {
    const team = makeTeam({ is_go_executed: true });
    const card = createTeamCard(team);
    document.body.appendChild(card);
    updateTeamCard(card, team, defaultCs());

    const goBtn = card.querySelector<HTMLButtonElement>('[data-cmd-type="EXECUTE_GO"]');
    expect(goBtn!.disabled).toBe(true);
  });

  it('Go有効条件: EXAM_IN_PROGRESSかつ成功判定ありなら有効', () => {
    const team = makeTeam({ current_phase: 'EXAM_IN_PROGRESS', is_staff_success: true });
    const card = createTeamCard(team);
    document.body.appendChild(card);
    updateTeamCard(card, team, defaultCs());

    const goBtn = card.querySelector<HTMLButtonElement>('[data-cmd-type="EXECUTE_GO"]');
    expect(goBtn!.disabled).toBe(false);
  });

  it('Go有効条件: EXAM_IN_PROGRESSかつ成功判定なし・残り時間あり → 無効', () => {
    const team = makeTeam({ current_phase: 'EXAM_IN_PROGRESS', is_staff_success: false, remaining_seconds: 10 });
    const card = createTeamCard(team);
    document.body.appendChild(card);
    updateTeamCard(card, team, defaultCs());

    const goBtn = card.querySelector<HTMLButtonElement>('[data-cmd-type="EXECUTE_GO"]');
    expect(goBtn!.disabled).toBe(true);
  });

  it('詳細パネルの開閉状態が更新後も維持される', () => {
    const team = makeTeam();
    const card = createTeamCard(team);
    document.body.appendChild(card);

    // 詳細を開く
    const toggle = card.querySelector<HTMLButtonElement>('.detail-toggle')!;
    toggle.click();
    expect(card.dataset.expanded).toBe('1');

    // 状態更新
    updateTeamCard(card, makeTeam({ remaining_seconds: 200 }), defaultCs());
    expect(card.dataset.expanded).toBe('1'); // 維持
  });

  it('成功判定トグルはSTATE反映後のチーム状態を表示する（楽観的更新なし）', () => {
    const team = makeTeam({ is_staff_success: false });
    const card = createTeamCard(team);
    document.body.appendChild(card);
    updateTeamCard(card, team, defaultCs());

    const toggle = card.querySelector<HTMLButtonElement>('.success-toggle')!;
    expect(toggle.textContent).toBe('成功判定: OFF');
    expect(toggle.classList.contains('active')).toBe(false);

    // State更新でONになる（楽観的変更でなく）
    updateTeamCard(card, makeTeam({ is_staff_success: true }), defaultCs());
    expect(toggle.textContent).toBe('成功判定: ON');
  });

  it('直接数値入力欄(input[type=number])が存在しない', () => {
    const team = makeTeam();
    const card = createTeamCard(team);
    document.body.appendChild(card);

    const numInputs = card.querySelectorAll('input[type="number"]');
    expect(numInputs.length).toBe(0);
    // There are text inputs now (inputmode numeric), so we don't assert allInputs.length == 0
  });

  it('初回生成直後のクリックでsendCommandが呼ばれる', () => {
    const team = makeTeam({ current_phase: 'WAITING_AT_ZERO', remaining_seconds: 10, is_staff_success: false });
    const card = createTeamCard(team);
    document.body.appendChild(card);

    const btn = card.querySelector<HTMLButtonElement>('[data-cmd-type="RESUME_TIMER"]')!;
    expect(btn.disabled).toBe(false);
    btn.click();

    expect(sendCommand).toHaveBeenCalled();
  });

  it('未登録→登録済みへカード再生成なしで移行', () => {
    // 1. 未登録で生成
    const team = makeTeam({ last_seen_at: '' });
    const card = createTeamCard(team);
    document.body.appendChild(card);

    const msg = card.querySelector<HTMLElement>('.unregistered-msg')!;
    const content = card.querySelector<HTMLElement>('.card-content')!;
    expect(msg.style.display).toBe('block');
    expect(content.style.display).toBe('none');

    // 2. 登録済み状態へ更新
    const activeTeam = makeTeam({ last_seen_at: new Date().toISOString() });
    updateTeamCard(card, activeTeam, defaultCs());

    expect(msg.style.display).toBe('none');
    expect(content.style.display).toBe('block');
  });

  it('Status購読時に最新TeamStateを使用', () => {
    // let's manually invoke the subscriber
    const team = makeTeam();
    const card = createTeamCard(team);
    document.body.appendChild(card);

    // Update the team state first
    const updatedTeam = makeTeam({ remaining_seconds: 500 });
    updateTeamCard(card, updatedTeam, defaultCs());

    // Trigger command status update
    const subscriber = vi.mocked(subscribeStatus).mock.calls[0][1];
    subscriber(lockedCs());

    // Check if the card used the latest team state (500 seconds -> 08:20)
    const remainEl = card.querySelector<HTMLElement>('.data-remaining')!;
    expect(remainEl.textContent).toBe('08:20');
  });

  it('成功トグルが常時表示領域にある', () => {
    const team = makeTeam();
    const card = createTeamCard(team);
    document.body.appendChild(card);

    const quick = card.querySelector('.card-quick-actions')!;
    const toggle = quick.querySelector('.success-toggle');
    expect(toggle).not.toBeNull();
  });

  it('CommandTypeと結果が同時表示される', () => {
    const team = makeTeam();
    const card = createTeamCard(team);
    document.body.appendChild(card);

    updateTeamCard(card, team, { ...defaultCs(), status: 'pending', commandType: 'EXECUTE_GO' });

    const lbl = card.querySelector('.cmd-status-label')!;
    expect(lbl.textContent).toContain('Go実行');
    expect(lbl.textContent).toContain('処理待ち');
  });

  it('確認キャンセルではsendCommandが0回', async () => {
    const team = makeTeam({ current_phase: 'EXAM_IN_PROGRESS', is_staff_success: true });
    const card = createTeamCard(team);
    document.body.appendChild(card);

    // showConfirmDialog is mocked to return false
    const goBtn = card.querySelector<HTMLButtonElement>('[data-cmd-type="EXECUTE_GO"]')!;
    await goBtn.click();

    // Wait for the async click handler
    await new Promise(r => setTimeout(r, 0));

    // First call was from previous test, clear it first
    vi.mocked(sendCommand).mockClear();

    await goBtn.click();
    await new Promise(r => setTimeout(r, 0));
    expect(sendCommand).not.toHaveBeenCalled();
  });

  describe('直接時間入力機能', () => {
    it('入力後にupdateTeamCardを複数回呼んでも値が変わらない', () => {
      const team = makeTeam();
      const card = createTeamCard(team);
      document.body.appendChild(card);

      const minInput = card.querySelector<HTMLButtonElement>('button[data-cmd-type="SET_REMAINING_TIME"][data-direct-btn="1"]')!.closest('.direct-input-group')!.querySelector('.min-input') as HTMLInputElement;
      minInput.value = '10';

      // Update state multiple times
      updateTeamCard(card, makeTeam({ remaining_seconds: 598 }), defaultCs());
      updateTeamCard(card, makeTeam({ remaining_seconds: 596 }), defaultCs());

      // Value should remain unchanged
      expect(minInput.value).toBe('10');
    });

    it('数字以外、秒60以上、15:01、900秒超過を拒否し、送信しない', async () => {
      const team = makeTeam();
      const card = createTeamCard(team);
      document.body.appendChild(card);

      const btn = card.querySelector<HTMLButtonElement>('button[data-cmd-type="SET_REMAINING_TIME"][data-direct-btn="1"]')!;
      const container = btn.closest('.direct-input-group')!;
      const minInput = container.querySelector('.min-input') as HTMLInputElement;
      const secInput = container.querySelector('.sec-input') as HTMLInputElement;
      const errorMsg = container.querySelector('.input-error-msg') as HTMLElement;

      vi.mocked(sendCommand).mockClear();

      // 数字以外
      minInput.value = 'abc';
      secInput.value = '10';
      await btn.click();
      await new Promise(r => setTimeout(r, 0));
      expect(errorMsg.style.display).toBe('block');
      expect(errorMsg.textContent).toContain('数字');
      expect(sendCommand).not.toHaveBeenCalled();

      // 秒60以上
      minInput.value = '1';
      secInput.value = '60';
      await btn.click();
      await new Promise(r => setTimeout(r, 0));
      expect(errorMsg.textContent).toContain('0～59');

      // 15:01
      minInput.value = '15';
      secInput.value = '1';
      await btn.click();
      await new Promise(r => setTimeout(r, 0));
      expect(errorMsg.textContent).toContain('15分を超える');

      // 900秒超過 (e.g. 16:00)
      minInput.value = '16';
      secInput.value = '0';
      await btn.click();
      await new Promise(r => setTimeout(r, 0));
      expect(errorMsg.textContent).toContain('分は0～15');
    });

    it('分秒から合計秒へ正しく変換され、payloadが正しい', async () => {
      const team = makeTeam();
      const card = createTeamCard(team);
      document.body.appendChild(card);

      // Mock confirm dialog to true
      vi.mocked(showConfirmDialog).mockResolvedValue(true);

      const btn = card.querySelector<HTMLButtonElement>('button[data-cmd-type="SET_REMAINING_TIME"][data-direct-btn="1"]')!;
      const container = btn.closest('.direct-input-group')!;
      const minInput = container.querySelector('.min-input') as HTMLInputElement;
      const secInput = container.querySelector('.sec-input') as HTMLInputElement;

      vi.mocked(sendCommand).mockClear();

      // 01:30 = 90秒
      minInput.value = '1';
      secInput.value = '30';
      await btn.click();
      await new Promise(r => setTimeout(r, 0));

      expect(sendCommand).toHaveBeenCalledWith('TEAM_01', 'SET_REMAINING_TIME', { value: 90 }, expect.any(Object));

      // 成功タイム
      const sBtn = card.querySelector<HTMLButtonElement>('button[data-cmd-type="SET_SUCCESS_TIME"][data-direct-btn="1"]')!;
      const sContainer = sBtn.closest('.direct-input-group')!;
      const sMinInput = sContainer.querySelector('.min-input') as HTMLInputElement;
      const sSecInput = sContainer.querySelector('.sec-input') as HTMLInputElement;

      sMinInput.value = '10';
      sSecInput.value = '5';
      await sBtn.click();
      await new Promise(r => setTimeout(r, 0));

      expect(sendCommand).toHaveBeenCalledWith('TEAM_01', 'SET_SUCCESS_TIME', { value: 605 }, expect.any(Object));
    });

    it('成功判定OFFでは成功タイム設定不可', () => {
      const team = makeTeam({ is_staff_success: false });
      const card = createTeamCard(team);
      document.body.appendChild(card);
      updateTeamCard(card, team, defaultCs());

      const sBtn = card.querySelector<HTMLButtonElement>('button[data-cmd-type="SET_SUCCESS_TIME"][data-direct-btn="1"]')!;
      const sContainer = sBtn.closest('.direct-input-group')!;
      const sMinInput = sContainer.querySelector('.min-input') as HTMLInputElement;

      expect(sBtn.disabled).toBe(true);
      expect(sMinInput.disabled).toBe(true);

      // Update state to success=true
      updateTeamCard(card, makeTeam({ is_staff_success: true }), defaultCs());
      expect(sBtn.disabled).toBe(false);
      expect(sMinInput.disabled).toBe(false);
    });

    it('APPLIED後だけ入力欄をクリア', () => {
      const team = makeTeam();
      const card = createTeamCard(team);
      document.body.appendChild(card);

      const btn = card.querySelector<HTMLButtonElement>('button[data-cmd-type="SET_REMAINING_TIME"][data-direct-btn="1"]')!;
      const container = btn.closest('.direct-input-group')!;
      const minInput = container.querySelector('.min-input') as HTMLInputElement;

      minInput.value = '10';

      // sending, pending shouldn't clear
      updateTeamCard(card, team, { ...defaultCs(), status: 'sending', commandType: 'SET_REMAINING_TIME' });
      expect(minInput.value).toBe('10');

      // applied clears
      updateTeamCard(card, team, { ...defaultCs(), status: 'applied', commandType: 'SET_REMAINING_TIME' });
      expect(minInput.value).toBe('');
    });
  });
});
