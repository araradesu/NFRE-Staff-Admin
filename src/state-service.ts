import { getSupabaseClient } from './supabase';
import type { TeamState } from './types';
import { notifyRevision } from './command-service';

export type StateCallback = (states: TeamState[], error: string | null) => void;

let pollingTimer: ReturnType<typeof setTimeout> | null = null;
let isPolling = false;
let currentCallback: StateCallback | null = null;
let lastKnownStates: Record<string, TeamState> = {};
let isPaused = false;

let currentPollId = 0;

const TARGET_TEAMS = ['TEAM_01', 'TEAM_02', 'TEAM_03'];
const ACTIVE_POLL_INTERVAL_MS = 2000;
const IDLE_POLL_INTERVAL_MS = 15000;
const OPERATIONAL_PHASES = new Set([
  'PRE_EXAM_WAIT',
  'EXAM_IN_PROGRESS',
  'MESSAGE_HISTORY',
  'WAITING_AT_ZERO',
  'ENDING_INCOMING_SUCCESS',
  'ENDING_INCOMING_FAILURE',
  'ENDING_CALL_SUCCESS',
  'ENDING_CALL_FAILURE',
  'RESULT',
  'EXIT_GUIDANCE',
]);

function getPollIntervalMs(): number {
  return Object.values(lastKnownStates).some(state => OPERATIONAL_PHASES.has(state.current_phase))
    ? ACTIVE_POLL_INTERVAL_MS
    : IDLE_POLL_INTERVAL_MS;
}

async function fetchTeamsState(pollId: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('teams_state')
      .select('team_id, session_id, revision, current_phase, remaining_seconds, timer_running, timer_paused, is_staff_success, staff_success_time, is_go_executed, last_seen_at')
      .in('team_id', TARGET_TEAMS);

    if (!isPolling || currentPollId !== pollId) {
      return;
    }

    if (error) {
      if (currentCallback) {
        currentCallback(buildSortedStates(), '状態を取得できません。通信状態を確認してください。');
      }
    } else if (data) {
      data.forEach(row => {
        // Fields not used by the admin UI are deliberately not downloaded.
        const state = {
          device_id: '',
          last_command_id: null,
          last_command_result: null,
          updated_at: '',
          ...row,
        } as TeamState;
        lastKnownStates[state.team_id] = state;
        // command-serviceへrevisionを通知
        notifyRevision(state.team_id, state.revision);
      });
      if (currentCallback) {
        currentCallback(buildSortedStates(), null);
      }
    }
  } catch (err: any) {
    if (!isPolling || currentPollId !== pollId) return;
    if (currentCallback) {
      currentCallback(buildSortedStates(), '状態を取得できません。通信状態を確認してください。');
    }
  }
}

function buildSortedStates(): TeamState[] {
  return TARGET_TEAMS.map(teamId => {
    return lastKnownStates[teamId] || {
      team_id: teamId,
      device_id: '',
      session_id: '',
      revision: 0,
      current_phase: '',
      remaining_seconds: 0,
      timer_running: false,
      timer_paused: false,
      is_staff_success: false,
      staff_success_time: 0,
      is_go_executed: false,
      last_command_id: null,
      last_command_result: null,
      updated_at: '',
      last_seen_at: '',
    } as TeamState;
  });
}

function scheduleNextPoll() {
  if (!isPolling || isPaused) return;
  if (pollingTimer) clearTimeout(pollingTimer);

  pollingTimer = setTimeout(async () => {
    if (!isPolling || isPaused) return;
    const pollId = ++currentPollId;
    await fetchTeamsState(pollId);
    if (isPolling && !isPaused) {
      scheduleNextPoll();
    }
  }, getPollIntervalMs());
}

export function startPolling(callback: StateCallback) {
  if (isPolling) return;
  isPolling = true;
  isPaused = false;
  currentCallback = callback;

  const pollId = ++currentPollId;
  fetchTeamsState(pollId).then(() => {
    if (isPolling && !isPaused) {
      scheduleNextPoll();
    }
  });
}

export function stopPolling() {
  isPolling = false;
  isPaused = false;
  currentCallback = null;
  currentPollId++;
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
}

export function pausePolling() {
  if (!isPolling) return;
  isPaused = true;
  currentPollId++;
  if (pollingTimer) {
    clearTimeout(pollingTimer);
    pollingTimer = null;
  }
}

export function resumePolling() {
  if (!isPolling || !isPaused || !currentCallback) return;
  isPaused = false;
  const pollId = ++currentPollId;
  fetchTeamsState(pollId).then(() => {
    if (isPolling && !isPaused) {
      scheduleNextPoll();
    }
  });
}

export function clearStates() {
  lastKnownStates = {};
  if (currentCallback) {
    currentCallback([], null);
  }
}

export function handleVisibilityChange(isHidden: boolean) {
  if (isHidden) {
    pausePolling();
  } else {
    resumePolling();
  }
}
