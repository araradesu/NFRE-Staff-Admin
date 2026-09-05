import { describe, it, expect } from 'vitest';
import { formatTimeMMSS, getConnectionStatus } from './connection-status';
import { getPhaseLabel } from './phase-labels';

describe('formatTimeMMSS', () => {
  it('formats seconds to MM:SS correctly', () => {
    expect(formatTimeMMSS(0)).toBe('00:00');
    expect(formatTimeMMSS(59)).toBe('00:59');
    expect(formatTimeMMSS(60)).toBe('01:00');
    expect(formatTimeMMSS(600)).toBe('10:00');
    expect(formatTimeMMSS(900)).toBe('15:00');
    expect(formatTimeMMSS(12.5)).toBe('00:13'); // handles fractions with ceil
  });

  it('handles negative, NaN or Infinity gracefully', () => {
    expect(formatTimeMMSS(-10)).toBe('00:00');
    expect(formatTimeMMSS(NaN)).toBe('00:00');
    expect(formatTimeMMSS(Infinity)).toBe('00:00');
    expect(formatTimeMMSS(-Infinity)).toBe('00:00');
  });
});

describe('getConnectionStatus', () => {
  it('returns UNREGISTERED if lastSeenAt is missing or invalid', () => {
    expect(getConnectionStatus(null)).toBe('UNREGISTERED');
    expect(getConnectionStatus(undefined)).toBe('UNREGISTERED');
    expect(getConnectionStatus('invalid-date')).toBe('UNREGISTERED');
  });

  it('returns CONNECTED within 10 seconds', () => {
    const now = new Date('2026-08-01T12:00:10Z');
    const lastSeen = '2026-08-01T12:00:00Z'; // exactly 10s
    expect(getConnectionStatus(lastSeen, now, 'EXAM_IN_PROGRESS')).toBe('CONNECTED');

    const lastSeen2 = '2026-08-01T12:00:05Z'; // 5s
    expect(getConnectionStatus(lastSeen2, now, 'EXAM_IN_PROGRESS')).toBe('CONNECTED');
  });

  it('returns DELAYED between 10 and 20 seconds', () => {
    const now = new Date('2026-08-01T12:00:20Z');
    const lastSeen = '2026-08-01T12:00:05Z'; // 15s
    expect(getConnectionStatus(lastSeen, now, 'EXAM_IN_PROGRESS')).toBe('DELAYED');

    const lastSeen2 = '2026-08-01T12:00:00Z'; // exactly 20s
    expect(getConnectionStatus(lastSeen2, now, 'EXAM_IN_PROGRESS')).toBe('DELAYED');
  });

  it('returns DISCONNECTED if more than 20 seconds', () => {
    const now = new Date('2026-08-01T12:00:30Z');
    const lastSeen = '2026-08-01T12:00:00Z'; // 30s
    expect(getConnectionStatus(lastSeen, now, 'EXAM_IN_PROGRESS')).toBe('DISCONNECTED');
  });

  it('allows the 30-second heartbeat while idle', () => {
    const now = new Date('2026-08-01T12:01:00Z');
    expect(getConnectionStatus('2026-08-01T12:00:20Z', now, 'WAITING_FOR_START')).toBe('CONNECTED');
    expect(getConnectionStatus('2026-08-01T12:00:00Z', now, 'WAITING_FOR_START')).toBe('DELAYED');
    expect(getConnectionStatus('2026-08-01T11:59:00Z', now, 'WAITING_FOR_START')).toBe('DISCONNECTED');
  });
});

describe('getPhaseLabel', () => {
  it('maps known phases to Japanese', () => {
    expect(getPhaseLabel('WAITING_FOR_START')).toBe('開始待機');
    expect(getPhaseLabel('EXAM_IN_PROGRESS')).toBe('試験中');
    // Case insensitive
    expect(getPhaseLabel('exam_in_progress')).toBe('試験中');
    expect(getPhaseLabel('OPENING_INCOMING')).toBe('オープニング着信');
    expect(getPhaseLabel('OPENING_CALL')).toBe('オープニング通話中');
    expect(getPhaseLabel('PRE_EXAM_WAIT')).toBe('試験開始待機');
    expect(getPhaseLabel('MESSAGE_HISTORY')).toBe('メッセージ履歴');
    expect(getPhaseLabel('WAITING_AT_ZERO')).toBe('終了待機');
    expect(getPhaseLabel('ENDING_INCOMING_SUCCESS')).toBe('成功エンディング着信');
    expect(getPhaseLabel('ENDING_INCOMING_FAILURE')).toBe('失敗エンディング着信');
    expect(getPhaseLabel('ENDING_CALL_SUCCESS')).toBe('成功エンディング');
    expect(getPhaseLabel('ENDING_CALL_FAILURE')).toBe('失敗エンディング');
    expect(getPhaseLabel('RESULT')).toBe('結果画面');
    expect(getPhaseLabel('EXIT_GUIDANCE')).toBe('退出案内');
    expect(getPhaseLabel('TURNOVER_CHECK')).toBe('転換チェック');
    expect(getPhaseLabel('EXIT')).toBe('退出（旧形式）');
  });

  it('falls back to the raw phase name if unknown', () => {
    expect(getPhaseLabel('UNKNOWN_PHASE')).toBe('UNKNOWN_PHASE');
  });

  it('handles missing values', () => {
    expect(getPhaseLabel(undefined)).toBe('不明');
  });
});
