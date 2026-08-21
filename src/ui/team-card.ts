import type { TeamState, TeamCommandState, ConnectionStatus } from '../types';
import { formatTimeMMSS, getConnectionStatus, getStatusColorClass, getStatusLabel } from '../connection-status';
import { getPhaseLabel } from '../phase-labels';
import { sendCommand, subscribeStatus } from '../command-service';
import { showConfirmDialog } from './confirm-dialog';
import { getCommandTypeLabel } from '../rejection-labels';
import { RecoveryTargetLabels } from '../recovery-labels';

// GO_PHASES: Go有効なPhase
const GO_PHASES = ['EXAM_IN_PROGRESS', 'MESSAGE_HISTORY', 'WAITING_AT_ZERO'];

function isLocked(cs: TeamCommandState, connStatus: ConnectionStatus, team: TeamState): boolean {
  if (connStatus !== 'CONNECTED') return true;
  if (team.is_go_executed) return true;
  const s = cs.status;
  return s === 'sending' || s === 'pending' || s === 'timeout' || s === 'lock_applied' || s === 'lock_rejected' || s === 'lock_duplicate';
}

function isRecoveryLocked(cs: TeamCommandState, connStatus: ConnectionStatus): boolean {
  if (connStatus !== 'CONNECTED') return true;
  const s = cs.status;
  return s === 'sending' || s === 'pending' || s === 'timeout';
}

function isGoEnabled(team: TeamState, cs: TeamCommandState, connStatus: ConnectionStatus): boolean {
  if (isLocked(cs, connStatus, team)) return false;
  if (team.current_phase === 'PRE_EXAM_WAIT') return true;
  if (!GO_PHASES.includes(team.current_phase)) return false;
  if (team.is_staff_success) return true;
  return team.remaining_seconds <= 0;
}

function getCommandStatusLabel(cs: TeamCommandState): string {
  let statusStr = '';
  switch (cs.status) {
    case 'idle': return '';
    case 'sending': statusStr = '送信中...'; break;
    case 'pending': statusStr = '処理待ち'; break;
    case 'timeout': statusStr = '応答待ち'; break;
    case 'lock_applied': statusStr = '適用済み (同期中)'; break;
    case 'applied': statusStr = '適用済み'; break;
    case 'lock_rejected':
    case 'lock_duplicate': statusStr = cs.rejectionReason ?? '終端状態 (同期中)'; break;
    case 'rejected': statusStr = `拒否: ${cs.rejectionReason ?? ''}`; break;
    case 'duplicate': statusStr = '重複'; break;
    case 'send_failed': statusStr = '送信失敗'; break;
    default: return '';
  }
  const typeStr = getCommandTypeLabel(cs.commandType);
  return `${typeStr} → ${statusStr}`;
}

function createBtn(label: string, extraClass?: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className = `cmd-btn ${extraClass ?? ''}`.trim();
  return btn;
}

export function createTeamCard(team: TeamState): HTMLElement {
  const card = document.createElement('div');
  card.className = 'team-card';
  card.id = `card-${team.team_id}`;
  card.dataset.expanded = '0';

  buildCardDOM(card, team);
  latestTeamStates[team.team_id] = team;

  subscribeStatus(team.team_id, (cs) => {
    const latestTeam = getLatestTeam(team.team_id);
    if (latestTeam) {
      updateTeamCard(card, latestTeam, cs);
    }
  });

  return card;
}

function buildCardDOM(card: HTMLElement, team: TeamState) {
  card.innerHTML = '';
  const teamId = team.team_id;
  const connStatus = getConnectionStatus(team.last_seen_at);
  const isUnreg = connStatus === 'UNREGISTERED';

  // ---- Header ----
  const header = document.createElement('div');
  header.className = 'card-header';

  const title = document.createElement('h2');
  title.className = 'team-title';
  title.textContent = teamId;

  const badge = document.createElement('span');
  badge.className = `status-badge ${getStatusColorClass(connStatus)}`;
  badge.textContent = getStatusLabel(connStatus);

  header.appendChild(title);
  header.appendChild(badge);
  card.appendChild(header);

  // ---- Body ----
  const body = document.createElement('div');
  body.className = 'card-body';

  const msg = document.createElement('div');
  msg.className = 'unregistered-msg';
  msg.textContent = 'デバイスが登録されていません';
  msg.style.display = isUnreg ? 'block' : 'none';
  body.appendChild(msg);

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'card-content';
  contentWrapper.style.display = isUnreg ? 'none' : 'block';

  // Info rows
  const addRow = (label: string, value: string, extra?: string) => {
    const row = document.createElement('div');
    row.className = `data-row${extra ? ' ' + extra : ''}`;
    const l = document.createElement('span'); l.className = 'label'; l.textContent = label;
    const v = document.createElement('span'); v.className = 'value'; v.textContent = value;
    row.appendChild(l); row.appendChild(v);
    contentWrapper.appendChild(row);
  };

  addRow('Phase:', getPhaseLabel(team.current_phase));

  const timeRow = document.createElement('div');
  timeRow.className = 'data-row highlight';
  const timeLabel = document.createElement('span'); timeLabel.className = 'label'; timeLabel.textContent = '残り時間:';
  const timeValue = document.createElement('span'); timeValue.className = 'value data-remaining'; timeValue.textContent = formatTimeMMSS(team.remaining_seconds);
  timeRow.appendChild(timeLabel); timeRow.appendChild(timeValue);
  contentWrapper.appendChild(timeRow);

  addRow('成功判定:', team.is_staff_success ? '済' : '未');
  addRow('成功時間:', formatTimeMMSS(team.staff_success_time));
  addRow('Go実行:', team.is_go_executed ? '済' : '未');

  // Command status label
  const cmdStatusEl = document.createElement('div');
  cmdStatusEl.className = 'cmd-status-label';
  contentWrapper.appendChild(cmdStatusEl);

  // ---- Quick Actions ----
  const quick = document.createElement('div');
  quick.className = 'card-quick-actions';

  // Success toggle
  const successLabel = document.createElement('div');
  successLabel.className = 'action-label';
  successLabel.textContent = '成功判定';
  quick.appendChild(successLabel);

  const successToggle = document.createElement('button');
  successToggle.className = `success-toggle ${team.is_staff_success ? 'active' : ''}`;
  successToggle.textContent = team.is_staff_success ? '成功判定: ON' : '成功判定: OFF';
  successToggle.dataset.teamId = teamId;
  successToggle.dataset.cmdType = 'SET_SUCCESS';
  quick.appendChild(successToggle);

  // Go button
  const goBtn = createBtn(team.current_phase === 'PRE_EXAM_WAIT' ? '試験開始' : 'Go実行', 'btn-danger');
  goBtn.dataset.teamId = teamId;
  goBtn.dataset.cmdType = 'EXECUTE_GO';

  // Detail toggle
  const detailToggle = document.createElement('button');
  detailToggle.className = 'btn-secondary detail-toggle';
  detailToggle.textContent = card.dataset.expanded === '1' ? '▲ 詳細を閉じる' : '▼ 詳細操作';

  quick.appendChild(goBtn);
  quick.appendChild(detailToggle);
  contentWrapper.appendChild(quick);

  // ---- Detail Panel ----
  const detailPanel = document.createElement('div');
  detailPanel.className = 'card-detail-panel';
  if (card.dataset.expanded !== '1') detailPanel.style.display = 'none';

  // Success toggle moved to quick actions

  // Pause / Resume
  const timerRow = document.createElement('div');
  timerRow.className = 'detail-row';
  const pauseBtn = createBtn('一時停止');
  pauseBtn.dataset.teamId = teamId;
  pauseBtn.dataset.cmdType = 'PAUSE_TIMER';
  const resumeBtn = createBtn('再開');
  resumeBtn.dataset.teamId = teamId;
  resumeBtn.dataset.cmdType = 'RESUME_TIMER';
  timerRow.appendChild(pauseBtn);
  timerRow.appendChild(resumeBtn);
  detailPanel.appendChild(timerRow);

  // Set time buttons
  const setTimeRow = document.createElement('div');
  setTimeRow.className = 'detail-row';
  const zeroBtn = createBtn('0秒にする', 'btn-warning');
  zeroBtn.dataset.teamId = teamId;
  zeroBtn.dataset.cmdType = 'SET_REMAINING_TIME';
  zeroBtn.dataset.value = '0';
  const resetBtn = createBtn('15:00に戻す');
  resetBtn.dataset.teamId = teamId;
  resetBtn.dataset.cmdType = 'SET_REMAINING_TIME';
  resetBtn.dataset.value = '900';
  setTimeRow.appendChild(zeroBtn);
  setTimeRow.appendChild(resetBtn);
  detailPanel.appendChild(setTimeRow);

  // Direct Time Inputs
  function createDirectInputGroup(labelStr: string, btnLabel: string, cmdType: string): HTMLElement {
    const container = document.createElement('div');
    container.className = 'direct-input-group';
    container.style.marginTop = '12px';

    const row = document.createElement('div');
    row.className = 'detail-row';

    const label = document.createElement('span');
    label.className = 'input-label';
    label.textContent = labelStr;
    label.style.width = '130px';

    const minInput = document.createElement('input');
    minInput.type = 'text';
    minInput.inputMode = 'numeric';
    minInput.className = 'time-input min-input';
    minInput.placeholder = '分';
    minInput.style.width = '40px';

    const colon = document.createElement('span');
    colon.textContent = ' : ';

    const secInput = document.createElement('input');
    secInput.type = 'text';
    secInput.inputMode = 'numeric';
    secInput.className = 'time-input sec-input';
    secInput.placeholder = '秒';
    secInput.style.width = '40px';

    const btn = document.createElement('button');
    btn.className = 'btn-primary cmd-btn';
    btn.textContent = btnLabel;
    btn.dataset.teamId = teamId;
    btn.dataset.cmdType = cmdType;
    btn.dataset.directBtn = '1';
    btn.style.marginLeft = '8px';

    row.appendChild(label);
    row.appendChild(minInput);
    row.appendChild(colon);
    row.appendChild(secInput);
    row.appendChild(btn);

    const errorMsg = document.createElement('div');
    errorMsg.className = 'input-error-msg';
    errorMsg.style.color = 'var(--danger-color)';
    errorMsg.style.fontSize = '0.85em';
    errorMsg.style.marginTop = '4px';
    errorMsg.style.display = 'none';

    container.appendChild(row);
    container.appendChild(errorMsg);

    return container;
  }

  detailPanel.appendChild(createDirectInputGroup('残り時間直接指定:', '残り時間を設定', 'SET_REMAINING_TIME'));
  detailPanel.appendChild(createDirectInputGroup('成功タイム直接指定:', '成功タイムを設定', 'SET_SUCCESS_TIME'));

  // Recovery Section
  const recoveryLabel = document.createElement('div');
  recoveryLabel.className = 'action-label';
  recoveryLabel.textContent = '▼ 緊急復旧';
  recoveryLabel.style.marginTop = '15px';
  recoveryLabel.style.color = '#ff6b6b';
  detailPanel.appendChild(recoveryLabel);

  const recoveryRow = document.createElement('div');
  recoveryRow.className = 'detail-row';

  const recoverySelect = document.createElement('select');
  recoverySelect.className = 'recovery-select';
  recoverySelect.dataset.teamId = teamId;
  const targets = [
    'WAITING_FOR_START', 'OPENING_INCOMING', 'OPENING_CALL', 'PRE_EXAM_WAIT',
    'EXAM_INITIAL', 'EXAM_P1_ACCESSIBLE', 'EXAM_P2_ACCESSIBLE', 'EXAM_P3_ACCESSIBLE',
    'MESSAGE_HISTORY', 'WAITING_AT_ZERO',
    'ENDING_INCOMING_SUCCESS', 'ENDING_INCOMING_FAILURE',
    'ENDING_CALL_SUCCESS', 'ENDING_CALL_FAILURE',
    'RESULT_SUCCESS', 'RESULT_FAILURE',
    'EXIT_GUIDANCE', 'TURNOVER_CHECK'
  ];
  targets.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = RecoveryTargetLabels[t] || t;
    recoverySelect.appendChild(opt);
  });
  recoveryRow.appendChild(recoverySelect);

  const recoveryBtn = createBtn('強制移動', 'btn-danger');
  recoveryBtn.dataset.teamId = teamId;
  recoveryBtn.dataset.cmdType = 'FORCE_RECOVERY_STATE';
  recoveryRow.appendChild(recoveryBtn);

  detailPanel.appendChild(recoveryRow);

  contentWrapper.appendChild(detailPanel);
  body.appendChild(contentWrapper);
  card.appendChild(body);

  // ---- Event Delegation ----
  // Use event delegation from card to avoid re-binding
  card.addEventListener('click', (e) => handleCardClick(e, card, () => getLatestTeam(teamId)));

  detailToggle.addEventListener('click', () => {
    const isExpanded = card.dataset.expanded === '1';
    card.dataset.expanded = isExpanded ? '0' : '1';
    detailPanel.style.display = isExpanded ? 'none' : 'block';
    detailToggle.textContent = isExpanded ? '▼ 詳細操作' : '▲ 詳細を閉じる';
  });
}

// Keep a lookup for the latest team state (updated by updateTeamCard)
const latestTeamStates: Record<string, TeamState> = {};

function getLatestTeam(teamId: string): TeamState | undefined {
  return latestTeamStates[teamId];
}

async function handleCardClick(e: Event, card: HTMLElement, getTeam: () => TeamState | undefined) {
  const target = e.target as HTMLElement;
  const btn = target.closest('[data-cmd-type]') as HTMLElement | null;
  if (!btn) return;

  const teamId = btn.dataset.teamId;
  const cmdType = btn.dataset.cmdType as any;
  if (!teamId || !cmdType) return;

  const team = getTeam();
  if (!team) return;

  // Check enabled state (button should already be disabled, but double-check)
  if (btn instanceof HTMLButtonElement && btn.disabled) return;

  let payload: Record<string, unknown> = {};
  if (cmdType === 'SET_REMAINING_TIME') {
    const val = Number(btn.dataset.value);
    if (!isNaN(val)) payload = { value: val };
  } else if (cmdType === 'FORCE_RECOVERY_STATE') {
    const select = card.querySelector<HTMLSelectElement>('.recovery-select');
    if (!select) return;
    payload = { target: select.value };
  } else if (cmdType === 'SET_SUCCESS') {
    payload = { value: !team.is_staff_success };
  }

  if (btn.dataset.directBtn === '1') {
    const container = btn.closest('.direct-input-group') as HTMLElement;
    const minInput = container.querySelector('.min-input') as HTMLInputElement;
    const secInput = container.querySelector('.sec-input') as HTMLInputElement;
    const errorMsg = container.querySelector('.input-error-msg') as HTMLElement;

    const minStr = minInput.value.trim();
    const secStr = secInput.value.trim();

    if (!minStr && !secStr) {
      errorMsg.textContent = '値を入力してください';
      errorMsg.style.display = 'block';
      return;
    }

    if ((minStr && !/^\d+$/.test(minStr)) || (secStr && !/^\d+$/.test(secStr))) {
      errorMsg.textContent = '数字のみ入力可能です';
      errorMsg.style.display = 'block';
      return;
    }

    const min = minStr ? parseInt(minStr, 10) : 0;
    const sec = secStr ? parseInt(secStr, 10) : 0;

    if (min < 0 || min > 15 || sec < 0 || sec > 59) {
      errorMsg.textContent = '分は0～15、秒は0～59で入力してください';
      errorMsg.style.display = 'block';
      return;
    }

    const totalSec = min * 60 + sec;

    if (min === 15 && sec > 0) {
      errorMsg.textContent = '15分を超える指定はできません';
      errorMsg.style.display = 'block';
      return;
    }

    if (totalSec > 900) {
      errorMsg.textContent = '合計900秒以内で入力してください';
      errorMsg.style.display = 'block';
      return;
    }

    errorMsg.style.display = 'none';

    const lbl = cmdType === 'SET_REMAINING_TIME' ? '残り時間' : '成功タイム';
    const minPadded = String(min).padStart(2, '0');
    const secPadded = String(sec).padStart(2, '0');
    const confirmed = await showConfirmDialog(teamId, `${lbl}を${minPadded}:${secPadded}に設定します。よろしいですか？`);
    if (!confirmed) return;

    await sendCommand(teamId, cmdType, { value: totalSec }, team);
    return;
  }

  // Execute with confirmation
  const needsConfirm = ['EXECUTE_GO', 'SET_REMAINING_TIME', 'SET_SUCCESS_TIME', 'PAUSE_TIMER', 'RESUME_TIMER', 'FORCE_RECOVERY_STATE'].includes(cmdType);
  if (needsConfirm) {
    let confirmMsg = 'この操作を実行しますか？';
      if (cmdType === 'EXECUTE_GO') {
        confirmMsg = team.current_phase === 'PRE_EXAM_WAIT'
          ? '試験を開始します。よろしいですか？'
          : 'Goを実行してエンディング着信へ移行します。よろしいですか？';
      }
    else if (cmdType === 'PAUSE_TIMER') confirmMsg = 'タイマーを一時停止しますか？';
    else if (cmdType === 'RESUME_TIMER') confirmMsg = 'タイマーを再開しますか？';
    else if (cmdType === 'FORCE_RECOVERY_STATE') {
      const label = RecoveryTargetLabels[payload.target as string] || payload.target;
      confirmMsg = `${teamId}のフェーズを [${label}] へ強制移動します。\nよろしいですか？`;
    }
    else if (cmdType === 'SET_REMAINING_TIME') confirmMsg = '残り時間を変更します。よろしいですか？';
    else if (cmdType === 'SET_SUCCESS_TIME') confirmMsg = '成功タイムを変更します。よろしいですか？';

    const confirmed = await showConfirmDialog(teamId, confirmMsg);
    if (!confirmed) return;
  }

  await sendCommand(teamId, cmdType, payload, team);
}

/** 差分更新: 既存カードのテキスト・ボタン状態のみ更新 */
export function updateTeamCard(cardEl: HTMLElement, team: TeamState, cs: TeamCommandState) {
  const card = cardEl;
  latestTeamStates[team.team_id] = team;

  const connStatus = getConnectionStatus(team.last_seen_at);
  const isUnreg = connStatus === 'UNREGISTERED';

  const msg = card.querySelector<HTMLElement>('.unregistered-msg');
  if (msg) msg.style.display = isUnreg ? 'block' : 'none';

  const wrapper = card.querySelector<HTMLElement>('.card-content');
  if (wrapper) wrapper.style.display = isUnreg ? 'none' : 'block';

  // Status badge
  const badge = card.querySelector<HTMLElement>('.status-badge');
  if (badge) {
    badge.textContent = getStatusLabel(connStatus);
    badge.className = `status-badge ${getStatusColorClass(connStatus)}`;
  }

  // Values
  const remainEl = card.querySelector<HTMLElement>('.data-remaining');
  if (remainEl) remainEl.textContent = formatTimeMMSS(team.remaining_seconds);

  // Rebuild info rows if phase changed
  const rows = card.querySelectorAll<HTMLElement>('.data-row:not(.highlight)');
  rows.forEach(row => {
    const label = row.querySelector('.label')?.textContent;
    const valueEl = row.querySelector<HTMLElement>('.value');
    if (!valueEl) return;
    if (label === 'Phase:') valueEl.textContent = getPhaseLabel(team.current_phase);
    if (label === '成功判定:') valueEl.textContent = team.is_staff_success ? '済' : '未';
    if (label === '成功時間:') valueEl.textContent = formatTimeMMSS(team.staff_success_time);
    if (label === 'Go実行:') valueEl.textContent = team.is_go_executed ? '済' : '未';
  });

  // Command status
  const cmdStatus = card.querySelector<HTMLElement>('.cmd-status-label');
  if (cmdStatus) cmdStatus.textContent = getCommandStatusLabel(cs);

  // Success toggle state
  const successToggle = card.querySelector<HTMLButtonElement>('.success-toggle');
  if (successToggle) {
    successToggle.textContent = team.is_staff_success ? '成功判定: ON' : '成功判定: OFF';
    successToggle.className = `success-toggle ${team.is_staff_success ? 'active' : ''}`;
  }

  // APPLIED になった入力欄をクリアする
  if (cs.status === 'applied') {
    if (cs.commandType === 'SET_REMAINING_TIME' || cs.commandType === 'SET_SUCCESS_TIME') {
      const btn = card.querySelector<HTMLButtonElement>(`button[data-cmd-type="${cs.commandType}"][data-direct-btn="1"]`);
      if (btn) {
        const container = btn.closest('.direct-input-group');
        if (container) {
          const m = container.querySelector('.min-input') as HTMLInputElement;
          const s = container.querySelector('.sec-input') as HTMLInputElement;
          if (m) m.value = '';
          if (s) s.value = '';
        }
      }
    }
  }

  updateCommandUI(card, team, cs);
}

function updateCommandUI(card: HTMLElement, team: TeamState, cs: TeamCommandState) {
  const connStatus = getConnectionStatus(team.last_seen_at);
  const locked = isLocked(cs, connStatus, team);

  // All cmd-btn and success-toggle
  card.querySelectorAll<HTMLButtonElement>('[data-cmd-type]').forEach(btn => {
    const cmdType = btn.dataset.cmdType;
    if (cmdType === 'EXECUTE_GO') {
      btn.textContent = team.current_phase === 'PRE_EXAM_WAIT' ? '試験開始' : 'Go実行';
    }
    let enabled = !locked;

    if (enabled) {
      if (cmdType === 'EXECUTE_GO') {
        enabled = isGoEnabled(team, cs, connStatus);
      } else if (cmdType === 'SET_SUCCESS_TIME') {
        enabled = team.is_staff_success;
      } else if (cmdType === 'PAUSE_TIMER') {
        enabled = team.timer_running && !team.timer_paused;
      } else if (cmdType === 'RESUME_TIMER') {
        const waitingAtZeroResume = team.current_phase === 'WAITING_AT_ZERO' && team.remaining_seconds > 0;
        enabled = team.timer_paused || waitingAtZeroResume;
      }
    }

    if (cmdType === 'FORCE_RECOVERY_STATE') {
      enabled = !isRecoveryLocked(cs, connStatus);
    }

    btn.disabled = !enabled;
    if (btn.dataset.directBtn === '1') {
      const container = btn.closest('.direct-input-group');
      if (container) {
        container.querySelectorAll<HTMLInputElement>('.time-input').forEach(inp => {
          inp.disabled = !enabled;
        });
      }
    }

    if (cmdType === 'FORCE_RECOVERY_STATE') {
      const select = btn.parentElement?.querySelector<HTMLSelectElement>('.recovery-select');
      if (select) select.disabled = !enabled;
    }
  });
}
