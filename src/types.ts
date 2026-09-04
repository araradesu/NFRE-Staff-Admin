export interface TeamState {
  team_id: string;
  device_id: string;
  session_id: string;
  revision: number;
  current_phase: string;
  remaining_seconds: number;
  timer_running: boolean;
  timer_paused: boolean;
  is_staff_success: boolean;
  staff_success_time: number;
  is_go_executed: boolean;
  last_command_id: string | null;
  last_command_result: 'PENDING' | 'APPLIED' | 'REJECTED' | 'DUPLICATE' | null;
  updated_at: string;
  last_seen_at: string;
}

export type ConnectionStatus = 'CONNECTED' | 'DELAYED' | 'DISCONNECTED' | 'UNREGISTERED';

export type CommandType =
  | 'SET_SUCCESS'
  | 'ADJUST_SUCCESS_TIME'
  | 'EXECUTE_GO'
  | 'SET_REMAINING_TIME'
  | 'SET_SUCCESS_TIME'
  | 'ADJUST_REMAINING_TIME'
  | 'PAUSE_TIMER'
  | 'RESUME_TIMER'
  | 'FORCE_RECOVERY_STATE';

export type CommandResult = 'PENDING' | 'APPLIED' | 'REJECTED' | 'DUPLICATE';

export type RejectionReason =
  | 'STALE_SESSION'
  | 'REVISION_CONFLICT'
  | 'WRONG_TEAM'
  | 'INVALID_PHASE'
  | 'INVALID_STATE'
  | 'INVALID_PAYLOAD'
  | 'NOT_ALLOWED_BEFORE_TIMEOUT'
  | 'ALREADY_EXECUTED_GO'
  | 'TIME_IS_ZERO'
  | 'UNKNOWN_COMMAND';

export interface CommandRecord {
  command_id: string;
  team_id: string;
  expected_session_id: string;
  expected_revision: number;
  command_type: CommandType;
  payload: Record<string, unknown>;
  result: CommandResult;
  rejection_reason: string | null;
  applied_revision: number | null;
  issued_at: string;
  processed_at: string | null;
}

export interface ScoreboardState {
  id: number;
  challenge_count: number;
  success_count: number;
  revision: number;
  updated_at: string;
}

// 'timeout' = PENDINGが15秒経過しても終端状態にならない（監視は継続）
// 'lock_applied' = APPLIED済みだがrevisionがまだ反映されていない
// 'lock_rejected' = REJECTEDで次のState更新待ち
// 'lock_duplicate' = DUPLICATEで次のState更新待ち
export type TeamCommandStatus =
  | 'idle'
  | 'sending'
  | 'pending'
  | 'timeout'
  | 'applied'
  | 'lock_applied'
  | 'lock_rejected'
  | 'lock_duplicate'
  | 'rejected'
  | 'duplicate'
  | 'send_failed';

export interface TeamCommandState {
  status: TeamCommandStatus;
  commandId: string | null;
  commandType: CommandType | null;
  appliedRevision: number | null;
  rejectionReason: string | null;
}
