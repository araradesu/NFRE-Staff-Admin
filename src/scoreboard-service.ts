import { getSupabaseClient } from './supabase';
import type { ScoreboardState } from './types';

export type ScoreboardCallback = (state: ScoreboardState | null, error: string | null) => void;

const POLL_INTERVAL_MS = 2000;

let pollingTimer: ReturnType<typeof setTimeout> | null = null;
let isPolling = false;
let isPaused = false;
let currentPollId = 0;
let currentCallback: ScoreboardCallback | null = null;
let lastKnownState: ScoreboardState | null = null;

function notify(error: string | null) {
  currentCallback?.(lastKnownState, error);
}

async function fetchScoreboard(pollId: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('scoreboard_totals')
      .select('id, challenge_count, success_count, revision, updated_at')
      .eq('id', 1)
      .single();

    if (!isPolling || currentPollId !== pollId) return;

    if (error || !data) {
      notify('成功率情報を取得できません。通信状態とデータベース設定を確認してください。');
      return;
    }

    lastKnownState = data as ScoreboardState;
    notify(null);
  } catch {
    if (!isPolling || currentPollId !== pollId) return;
    notify('成功率情報を取得できません。通信状態を確認してください。');
  }
}

function scheduleNextPoll() {
  if (!isPolling || isPaused) return;
  if (pollingTimer) clearTimeout(pollingTimer);

  pollingTimer = setTimeout(async () => {
    if (!isPolling || isPaused) return;
    const pollId = ++currentPollId;
    await fetchScoreboard(pollId);
    scheduleNextPoll();
  }, POLL_INTERVAL_MS);
}

export function startScoreboardPolling(callback: ScoreboardCallback) {
  stopScoreboardPolling();
  isPolling = true;
  isPaused = false;
  currentCallback = callback;

  const pollId = ++currentPollId;
  fetchScoreboard(pollId).then(scheduleNextPoll);
}

export function stopScoreboardPolling() {
  isPolling = false;
  isPaused = false;
  currentCallback = null;
  currentPollId++;
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
}

export function pauseScoreboardPolling() {
  if (!isPolling || isPaused) return;
  isPaused = true;
  currentPollId++;
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
}

export function resumeScoreboardPolling() {
  if (!isPolling || !isPaused || !currentCallback) return;
  isPaused = false;
  const pollId = ++currentPollId;
  fetchScoreboard(pollId).then(scheduleNextPoll);
}

export function clearScoreboardState() {
  lastKnownState = null;
}

export async function setScoreboardTotals(
  challengeCount: number,
  successCount: number,
  expectedRevision: number,
): Promise<ScoreboardState> {
  if (!Number.isSafeInteger(challengeCount) || challengeCount < 0) {
    throw new Error('受験チーム数は0以上の整数で入力してください。');
  }
  if (!Number.isSafeInteger(successCount) || successCount < 0) {
    throw new Error('合格チーム数は0以上の整数で入力してください。');
  }
  if (successCount > challengeCount) {
    throw new Error('合格チーム数を受験チーム数より多くすることはできません。');
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('set_scoreboard_totals', {
    p_challenge_count: challengeCount,
    p_success_count: successCount,
    p_expected_revision: expectedRevision,
  });

  if (error || !data) {
    throw new Error('数値を変更できませんでした。最新の値を確認して、もう一度実行してください。');
  }

  const updated = (Array.isArray(data) ? data[0] : data) as ScoreboardState | undefined;
  if (!updated) {
    throw new Error('変更後の数値を取得できませんでした。');
  }

  lastKnownState = updated;
  notify(null);
  return updated;
}
