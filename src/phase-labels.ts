export function getPhaseLabel(phase: string | undefined): string {
  if (!phase) return '不明';
  const p = phase.toUpperCase();
  switch (p) {
    case 'WAITING_FOR_START': return '開始待機';
    case 'OPENING_INCOMING': return 'オープニング着信';
    case 'OPENING_CALL': return 'オープニング通話中';
    case 'PRE_EXAM_WAIT': return '試験開始待機';
    case 'EXAM_IN_PROGRESS': return '試験中';
    case 'MESSAGE_HISTORY': return 'メッセージ履歴';
    case 'WAITING_AT_ZERO': return '終了待機';
    case 'ENDING_INCOMING_SUCCESS': return '成功エンディング着信';
    case 'ENDING_INCOMING_FAILURE': return '失敗エンディング着信';
    case 'ENDING_CALL_SUCCESS': return '成功エンディング';
    case 'ENDING_CALL_FAILURE': return '失敗エンディング';
    case 'RESULT': return '結果画面';
    case 'EXIT_GUIDANCE': return '退出案内';
    case 'TURNOVER_CHECK': return '転換チェック';
    case 'EXIT': return '退出（旧形式）';
    default: return phase;
  }
}
