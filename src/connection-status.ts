import type { ConnectionStatus } from './types';

export function formatTimeMMSS(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0 || !Number.isFinite(seconds)) return '00:00';
  const total = Math.ceil(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

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

export function getConnectionStatus(
  lastSeenAt: string | null | undefined,
  currentTime: Date = new Date(),
  currentPhase?: string,
): ConnectionStatus {
  if (!lastSeenAt) return 'UNREGISTERED';

  const lastSeenDate = new Date(lastSeenAt);
  if (isNaN(lastSeenDate.getTime())) return 'UNREGISTERED';

  const diffSeconds = (currentTime.getTime() - lastSeenDate.getTime()) / 1000;

  // Game PCs report every 5 seconds during operation and every 30 seconds
  // while idle. Match the warning thresholds to that cadence so an idle PC is
  // not falsely marked as disconnected.
  const isOperational = !!currentPhase && OPERATIONAL_PHASES.has(currentPhase);
  const connectedLimit = isOperational ? 10 : 45;
  const delayedLimit = isOperational ? 20 : 90;

  if (diffSeconds <= connectedLimit) return 'CONNECTED';
  if (diffSeconds <= delayedLimit) return 'DELAYED';
  return 'DISCONNECTED';
}

export function getStatusColorClass(status: ConnectionStatus): string {
  switch (status) {
    case 'CONNECTED': return 'status-green';
    case 'DELAYED': return 'status-orange';
    case 'DISCONNECTED': return 'status-red';
    case 'UNREGISTERED': return 'status-gray';
    default: return 'status-gray';
  }
}

export function getStatusLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'CONNECTED': return '接続中';
    case 'DELAYED': return '遅延';
    case 'DISCONNECTED': return '切断';
    case 'UNREGISTERED': return '未登録';
    default: return '不明';
  }
}
