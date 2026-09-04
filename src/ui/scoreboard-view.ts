import type { ScoreboardState } from '../types';
import { setScoreboardTotals } from '../scoreboard-service';
import { showConfirmDialog } from './confirm-dialog';

let latestState: ScoreboardState | null = null;

function createCorner(position: string): HTMLElement {
  const corner = document.createElement('span');
  corner.className = `scoreboard-corner scoreboard-corner-${position}`;
  corner.setAttribute('aria-hidden', 'true');
  return corner;
}

function createScoreboardArtwork(): HTMLElement {
  const artwork = document.createElement('section');
  artwork.className = 'scoreboard-artwork';
  artwork.setAttribute('aria-label', '合格チーム数と受験チーム数');

  artwork.appendChild(createCorner('tl'));
  artwork.appendChild(createCorner('tr'));
  artwork.appendChild(createCorner('bl'));
  artwork.appendChild(createCorner('br'));

  const successGroup = document.createElement('div');
  successGroup.className = 'scoreboard-group scoreboard-success-group';
  successGroup.innerHTML = `
    <div class="scoreboard-label">合格チーム数</div>
    <div class="scoreboard-number-wrap">
      <span class="scoreboard-number" data-scoreboard-success>—</span>
    </div>
  `;

  const rule = document.createElement('div');
  rule.className = 'scoreboard-diagonal-rule';
  rule.setAttribute('aria-hidden', 'true');

  const challengeGroup = document.createElement('div');
  challengeGroup.className = 'scoreboard-group scoreboard-challenge-group';
  challengeGroup.innerHTML = `
    <div class="scoreboard-number-wrap">
      <span class="scoreboard-number" data-scoreboard-challenges>—</span>
    </div>
    <div class="scoreboard-label">受験チーム数</div>
  `;

  artwork.appendChild(successGroup);
  artwork.appendChild(rule);
  artwork.appendChild(challengeGroup);
  return artwork;
}

function displayUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set('view', 'scoreboard-display');
  return url.toString();
}

function showFormMessage(message: string, isError: boolean) {
  const messageEl = document.getElementById('scoreboard-form-message');
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = isError ? 'scoreboard-form-message is-error' : 'scoreboard-form-message is-success';
}

export function createScoreboardView(onBack: () => void): HTMLElement {
  latestState = null;

  const container = document.createElement('div');
  container.className = 'scoreboard-admin-container';

  const header = document.createElement('header');
  header.className = 'dashboard-header';

  const title = document.createElement('h1');
  title.textContent = '成功率表示';

  const backButton = document.createElement('button');
  backButton.type = 'button';
  backButton.className = 'btn-secondary';
  backButton.textContent = 'ダッシュボードへ戻る';
  backButton.addEventListener('click', onBack);

  header.appendChild(title);
  header.appendChild(backButton);

  const error = document.createElement('div');
  error.id = 'scoreboard-error';
  error.className = 'error-message hidden';

  const preview = document.createElement('div');
  preview.className = 'scoreboard-preview';
  preview.appendChild(createScoreboardArtwork());

  const panel = document.createElement('section');
  panel.className = 'scoreboard-edit-panel';
  panel.innerHTML = `
    <h2>表示数値の変更</h2>
    <p>テストプレイや集計修正時に、投影する数値を直接変更できます。</p>
    <div class="scoreboard-input-grid">
      <label>
        <span>合格チーム数</span>
        <input id="scoreboard-success-input" type="number" inputmode="numeric" min="0" step="1">
      </label>
      <label>
        <span>受験チーム数</span>
        <input id="scoreboard-challenge-input" type="number" inputmode="numeric" min="0" step="1">
      </label>
    </div>
    <div id="scoreboard-form-message" class="scoreboard-form-message" aria-live="polite"></div>
    <div class="scoreboard-actions">
      <button id="scoreboard-save" type="button" class="btn-primary">数値を変更</button>
      <a class="btn-secondary scoreboard-link-button" href="${displayUrl()}" target="_blank" rel="noopener">投影画面を開く</a>
    </div>
  `;

  const successInput = panel.querySelector<HTMLInputElement>('#scoreboard-success-input')!;
  const challengeInput = panel.querySelector<HTMLInputElement>('#scoreboard-challenge-input')!;
  [successInput, challengeInput].forEach(input => {
    input.addEventListener('input', () => { input.dataset.dirty = 'true'; });
  });

  const saveButton = panel.querySelector<HTMLButtonElement>('#scoreboard-save')!;
  saveButton.addEventListener('click', async () => {
    if (!latestState) {
      showFormMessage('現在の数値を取得してから操作してください。', true);
      return;
    }

    const successCount = Number(successInput.value);
    const challengeCount = Number(challengeInput.value);

    if (!Number.isSafeInteger(successCount) || successCount < 0 ||
        !Number.isSafeInteger(challengeCount) || challengeCount < 0) {
      showFormMessage('0以上の整数で入力してください。', true);
      return;
    }
    if (successCount > challengeCount) {
      showFormMessage('合格チーム数を受験チーム数より多くすることはできません。', true);
      return;
    }

    const confirmed = await showConfirmDialog(
      '会場全体',
      `表示を「合格 ${successCount}組／受験 ${challengeCount}組」に変更します。よろしいですか？`,
    );
    if (!confirmed) return;

    saveButton.disabled = true;
    try {
      latestState = await setScoreboardTotals(challengeCount, successCount, latestState.revision);
      delete successInput.dataset.dirty;
      delete challengeInput.dataset.dirty;
      successInput.value = String(latestState.success_count);
      challengeInput.value = String(latestState.challenge_count);
      showFormMessage('表示数値を変更しました。', false);
    } catch (err) {
      showFormMessage(err instanceof Error ? err.message : '数値を変更できませんでした。', true);
    } finally {
      saveButton.disabled = false;
    }
  });

  container.appendChild(header);
  container.appendChild(error);
  container.appendChild(preview);
  container.appendChild(panel);
  return container;
}

export function createScoreboardDisplayView(): HTMLElement {
  latestState = null;

  const shell = document.createElement('main');
  shell.className = 'scoreboard-display-shell';
  shell.appendChild(createScoreboardArtwork());

  const status = document.createElement('div');
  status.id = 'scoreboard-display-status';
  status.className = 'scoreboard-display-status';
  status.setAttribute('aria-live', 'polite');
  shell.appendChild(status);

  const fullscreenButton = document.createElement('button');
  fullscreenButton.type = 'button';
  fullscreenButton.className = 'scoreboard-fullscreen-button';
  fullscreenButton.textContent = '全画面表示';
  fullscreenButton.addEventListener('click', async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      status.textContent = 'ブラウザの全画面表示（F11）を使用してください。';
    }
  });
  shell.appendChild(fullscreenButton);

  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.hidden = document.fullscreenElement !== null;
  }, { once: false });

  return shell;
}

function updateNumber(selector: string, value: number) {
  document.querySelectorAll<HTMLElement>(selector).forEach(element => {
    const next = String(value);
    const previous = element.textContent;
    if (previous === next) return;
    element.textContent = next;
    if (previous && previous !== '—') {
      element.classList.remove('scoreboard-number-changed');
      void element.offsetWidth;
      element.classList.add('scoreboard-number-changed');
    }
  });
}

export function updateScoreboardView(state: ScoreboardState | null, error: string | null) {
  const errorElement = document.getElementById('scoreboard-error');
  if (errorElement) {
    errorElement.textContent = error ?? '';
    errorElement.classList.toggle('hidden', !error);
  }

  const displayStatus = document.getElementById('scoreboard-display-status');
  if (displayStatus) {
    displayStatus.textContent = error ? '通信確認中' : '';
    displayStatus.classList.toggle('is-visible', Boolean(error));
  }

  if (!state) return;
  latestState = state;
  updateNumber('[data-scoreboard-success]', state.success_count);
  updateNumber('[data-scoreboard-challenges]', state.challenge_count);

  const successInput = document.getElementById('scoreboard-success-input') as HTMLInputElement | null;
  const challengeInput = document.getElementById('scoreboard-challenge-input') as HTMLInputElement | null;
  if (successInput && successInput.dataset.dirty !== 'true') {
    successInput.value = String(state.success_count);
  }
  if (challengeInput && challengeInput.dataset.dirty !== 'true') {
    challengeInput.value = String(state.challenge_count);
  }
}
