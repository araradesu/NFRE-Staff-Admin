import type { ConnectionStatus } from './types';

export function formatTimeMMSS(seconds: number): string {
  if (isNaN(seconds) || seconds < 0 || !Number.isFinite(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function getConnectionStatus(lastSeenAt: string | null | undefined, currentTime: Date = new Date()): ConnectionStatus {
  if (!lastSeenAt) return 'UNREGISTERED';

  const lastSeenDate = new Date(lastSeenAt);
  if (isNaN(lastSeenDate.getTime())) return 'UNREGISTERED';

  const diffSeconds = (currentTime.getTime() - lastSeenDate.getTime()) / 1000;

  if (diffSeconds <= 10) return 'CONNECTED';
  if (diffSeconds <= 20) return 'DELAYED';
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
