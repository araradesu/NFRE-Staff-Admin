

const REJECTION_LABELS: Record<string, string> = {
  STALE_SESSION: 'セッションが古くなっています',
  REVISION_CONFLICT: 'リビジョンが競合しています',
  WRONG_TEAM: 'チームIDが一致しません',
  INVALID_PHASE: 'この操作は現在のフェーズでは実行できません',
  INVALID_STATE: '現在の状態では実行できません',
  INVALID_PAYLOAD: '操作パラメータが不正です',
  NOT_ALLOWED_BEFORE_TIMEOUT: 'タイムアウト前は実行できません',
  ALREADY_EXECUTED_GO: 'Go はすでに実行済みです',
  TIME_IS_ZERO: '残り時間がゼロです',
  UNKNOWN_COMMAND: '不明なコマンドです',
};

export function getRejectionLabel(reason: string | null | undefined): string {
  if (!reason) return '不明なエラー';
  return REJECTION_LABELS[reason] ?? '不明なエラー';
}

const COMMAND_TYPE_LABELS: Record<string, string> = {
  SET_SUCCESS: '成功判定変更',
  ADJUST_SUCCESS_TIME: '成功タイム調整',
  EXECUTE_GO: 'Go実行',
  SET_REMAINING_TIME: '残り時間設定',
  SET_SUCCESS_TIME: '成功タイム設定',
  ADJUST_REMAINING_TIME: '残り時間調整',
  PAUSE_TIMER: '一時停止',
  RESUME_TIMER: '再開',
};

export function getCommandTypeLabel(type: string | null | undefined): string {
  if (!type) return '不明な操作';
  return COMMAND_TYPE_LABELS[type] ?? type;
}
