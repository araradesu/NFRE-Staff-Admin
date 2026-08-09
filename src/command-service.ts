import { getSupabaseClient } from './supabase';
import type { CommandType, TeamState, TeamCommandState, CommandRecord } from './types';
import { getRejectionLabel } from './rejection-labels';

// --------------------------------------------------
// Per-team state
// --------------------------------------------------
const TEAM_IDS = ['TEAM_01', 'TEAM_02', 'TEAM_03'];

function defaultCommandState(): TeamCommandState {
  return {
    status: 'idle',
    commandId: null,
    commandType: null,
    appliedRevision: null,
    rejectionReason: null,
  };
}

const teamStates: Record<string, TeamCommandState> = {};
TEAM_IDS.forEach(id => { teamStates[id] = defaultCommandState(); });

type StatusCallback = (state: TeamCommandState) => void;
const subscribers: Record<string, Set<StatusCallback>> = {};
TEAM_IDS.forEach(id => { subscribers[id] = new Set(); });

// watch timers per commandId
const watchTimers: Record<string, ReturnType<typeof setInterval>> = {};
const timeoutTimers: Record<string, ReturnType<typeof setTimeout>> = {};

let isPaused = false;
let isActive = true; // false after logout
let lifecycleGeneration = 0;

// --------------------------------------------------
// Internal helpers
// --------------------------------------------------
function notify(teamId: string) {
  const st = teamStates[teamId];
  if (!st) return;
  subscribers[teamId]?.forEach(cb => cb({ ...st }));
}

function setStatus(teamId: string, patch: Partial<TeamCommandState>) {
  if (!teamStates[teamId]) return;
  Object.assign(teamStates[teamId], patch);
  notify(teamId);
}

function clearWatchForCommand(commandId: string) {
  if (watchTimers[commandId]) {
    clearInterval(watchTimers[commandId]);
    delete watchTimers[commandId];
  }
  if (timeoutTimers[commandId]) {
    clearTimeout(timeoutTimers[commandId]);
    delete timeoutTimers[commandId];
  }
}

// --------------------------------------------------
// Public API
// --------------------------------------------------

/** UIがステータス変化を購読するためのAPI。戻り値はunsubscribe関数 */
export function subscribeStatus(teamId: string, cb: StatusCallback): () => void {
  subscribers[teamId]?.add(cb);
  // 現在の状態を即座に通知
  cb({ ...teamStates[teamId] });
  return () => { subscribers[teamId]?.delete(cb); };
}

export function getCommandStatus(teamId: string): TeamCommandState {
  return { ...teamStates[teamId] };
}

/** state-serviceから毎回呼ばれる。APPLIEDロックの解除判定をここで行う */
export function notifyRevision(teamId: string, revision: number): void {
  const st = teamStates[teamId];
  if (!st) return;

  if (st.status === 'lock_applied' && st.appliedRevision !== null) {
    if (revision >= st.appliedRevision) {
      setStatus(teamId, { status: 'applied', commandId: null, appliedRevision: null });
    }
  }
  if (st.status === 'lock_rejected') {
    setStatus(teamId, { status: 'rejected', commandId: null });
  }
  if (st.status === 'lock_duplicate') {
    setStatus(teamId, { status: 'duplicate', commandId: null });
  }
}

/** INSERTが成功したか不明の場合に、command_idの存在を確認してから監視継続 */
async function verifyAndWatch(teamId: string, commandId: string): Promise<void> {
  if (!isActive) return;
  const myGen = lifecycleGeneration;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('team_commands')
      .select('command_id, result, rejection_reason, applied_revision')
      .eq('command_id', commandId)
      .maybeSingle();

    if (!isActive || lifecycleGeneration !== myGen) return;

    if (!error && data === null) {
      // 存在しない = 確実に届いていない → 送信失敗
      setStatus(teamId, { status: 'send_failed', commandId: null });
      return;
    }

    if (error) {
      // 通信エラー等 -> commandIdと操作ロックを保持して再試行
      startWatchTimer(teamId, commandId);
      return;
    }

    // 存在する → 結果を確認
    const rec = data as CommandRecord;
    if (rec.result !== 'PENDING') {
      handleTerminalResult(teamId, commandId, rec);
    } else {
      // PENDINGのまま → 通常の監視を開始
      const st = teamStates[teamId];
      if (st && st.status === 'sending') {
        setStatus(teamId, { status: 'pending' });
      }
      startWatchTimer(teamId, commandId);
    }
  } catch {
    if (!isActive || lifecycleGeneration !== myGen) return;
    startWatchTimer(teamId, commandId);
  }
}

function handleTerminalResult(teamId: string, commandId: string, rec: CommandRecord) {
  clearWatchForCommand(commandId);

  if (rec.result === 'APPLIED') {
    setStatus(teamId, {
      status: 'lock_applied',
      appliedRevision: rec.applied_revision,
    });
  } else if (rec.result === 'REJECTED') {
    setStatus(teamId, {
      status: 'lock_rejected',
      rejectionReason: getRejectionLabel(rec.rejection_reason),
    });
  } else if (rec.result === 'DUPLICATE') {
    setStatus(teamId, {
      status: 'lock_duplicate',
      rejectionReason: '重複コマンド',
    });
  }
}

function startWatchTimer(teamId: string, commandId: string) {
  if (isPaused || !isActive) return;

  timeoutTimers[commandId] = setTimeout(() => {
    const st = teamStates[teamId];
    if (st?.commandId === commandId && (st.status === 'pending' || st.status === 'sending')) {
      setStatus(teamId, { status: 'timeout' });
    }
  }, 15000);

  watchTimers[commandId] = setInterval(async () => {
    if (isPaused || !isActive) return;
    const myGen = lifecycleGeneration;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('team_commands')
        .select('command_id, result, rejection_reason, applied_revision')
        .eq('command_id', commandId)
        .maybeSingle();

      if (!isActive || lifecycleGeneration !== myGen) return;

      if (!error && data === null) {
        setStatus(teamId, { status: 'send_failed', commandId: null });
        clearWatchForCommand(commandId);
        return;
      }

      if (error || !data) return; // 一時的なエラーは無視して次周を待つ

      const rec = data as CommandRecord;
      if (rec.result !== 'PENDING') {
        handleTerminalResult(teamId, commandId, rec);
      } else {
        const st = teamStates[teamId];
        if (st && st.status === 'sending') {
          setStatus(teamId, { status: 'pending' });
        }
      }
    } catch {
      // 通信エラーは無視して次周を待つ
    }
  }, 2000);
}

/** コマンド送信 */
export async function sendCommand(
  teamId: string,
  type: CommandType,
  payload: Record<string, unknown>,
  state: TeamState,
): Promise<void> {
  if (!isActive) return;

  const st = teamStates[teamId];
  // すでに処理中なら拒否
  if (st && !['idle', 'send_failed', 'applied', 'rejected', 'duplicate'].includes(st.status)) {
    return;
  }

  const commandId = crypto.randomUUID();
  setStatus(teamId, {
    status: 'sending',
    commandId,
    commandType: type,
    appliedRevision: null,
    rejectionReason: null,
  });

  const insertPayload = {
    command_id: commandId,
    team_id: teamId,
    expected_session_id: state.session_id,
    expected_revision: state.revision,
    command_type: type,
    payload,
  };

  try {
    const supabase = getSupabaseClient();
    const myGen = lifecycleGeneration;
    const { error } = await supabase.from('team_commands').insert(insertPayload);

    if (!isActive || lifecycleGeneration !== myGen) return;

    if (error) {
      // 4xx系の明確な失敗 → 送信失敗確定
      const status_code = (error as any).status ?? (error as any).code;
      const is4xx = typeof status_code === 'number' && status_code >= 400 && status_code < 500;
      const isStringCode = typeof status_code === 'string' && status_code.startsWith('4');
      if (is4xx || isStringCode) {
        setStatus(teamId, { status: 'send_failed', commandId: null });
        return;
      }

      // その他 (5xx / 不明) → command_idで存在確認してから判断
      await verifyAndWatch(teamId, commandId);
      return;
    }

    // INSERT成功 → PENDING監視開始
    setStatus(teamId, { status: 'pending' });
    startWatchTimer(teamId, commandId);

  } catch {
    if (!isActive) return;
    // 通信切断等 → command_idで存在確認
    await verifyAndWatch(teamId, commandId);
  }
}

/** ログアウト時: 全監視停止 & コールバック破棄 */
export function cancelAllWatches(): void {
  isActive = false;
  isPaused = false;

  Object.keys(watchTimers).forEach(id => clearInterval(watchTimers[id]));
  Object.keys(timeoutTimers).forEach(id => clearTimeout(timeoutTimers[id]));
  Object.keys(watchTimers).forEach(id => delete watchTimers[id]);
  Object.keys(timeoutTimers).forEach(id => delete timeoutTimers[id]);

  TEAM_IDS.forEach(id => {
    teamStates[id] = defaultCommandState();
    subscribers[id]?.clear();
  });
}

/** タブ非表示時: 監視タイマーを一時停止 */
export function pauseAllWatches(): void {
  isPaused = true;
  Object.keys(watchTimers).forEach(id => {
    clearInterval(watchTimers[id]);
    delete watchTimers[id];
  });
  Object.keys(timeoutTimers).forEach(id => {
    clearTimeout(timeoutTimers[id]);
    delete timeoutTimers[id];
  });
}

/** タブ再表示時: PENDING中の監視を再開 */
export function resumeAllWatches(): void {
  if (!isActive) return;
  isPaused = false;
  TEAM_IDS.forEach(teamId => {
    const st = teamStates[teamId];
    if (!st?.commandId) return;
    if (st.status === 'pending' || st.status === 'timeout') {
      startWatchTimer(teamId, st.commandId);
    }
  });
}

/** ログイン時にisActiveをリセット（再ログイン対応） */
export function activateCommandService(): void {
  isActive = true;
  isPaused = false;
  lifecycleGeneration++;
  TEAM_IDS.forEach(id => {
    teamStates[id] = defaultCommandState();
    if (!subscribers[id]) subscribers[id] = new Set();
  });
}
