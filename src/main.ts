import './styles.css';
import { initAuth, handleVisibilityForAuth } from './auth';
import { createLoginView } from './ui/login-view';
import { createDashboardView, updateDashboardStates } from './ui/dashboard-view';
import { createManualView } from './ui/manual-view';
import { startPolling, stopPolling } from './state-service';
import { createScoreboardDisplayView, createScoreboardView, updateScoreboardView } from './ui/scoreboard-view';
import { startScoreboardPolling, stopScoreboardPolling } from './scoreboard-service';

const app = document.getElementById('app')!;

export function renderLogin() {
  stopScoreboardPolling();
  document.title = 'NFRE Staff Admin';
  app.className = '';
  app.innerHTML = '';
  app.appendChild(createLoginView());
}

export function renderDashboard() {
  stopScoreboardPolling();
  stopPolling();
  document.title = 'NFRE Staff Admin';
  app.className = '';
  app.innerHTML = '';
  app.appendChild(createDashboardView(renderManual, renderScoreboard));
  startPolling(updateDashboardStates);
}

export function renderManual() {
  stopScoreboardPolling();
  stopPolling();
  document.title = 'スタッフマニュアル | NFRE';
  app.className = '';
  app.innerHTML = '';
  app.appendChild(createManualView({ onBack: renderDashboard }));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function renderScoreboard() {
  stopPolling();
  stopScoreboardPolling();
  document.title = '成功率表示 | NFRE Staff Admin';
  app.className = '';
  app.innerHTML = '';
  app.appendChild(createScoreboardView(renderDashboard));
  startScoreboardPolling(updateScoreboardView);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function renderScoreboardDisplay() {
  stopPolling();
  stopScoreboardPolling();
  document.title = '合格チーム数 / 受験チーム数';
  app.className = 'app-scoreboard-display';
  app.innerHTML = '';
  app.appendChild(createScoreboardDisplayView());
  startScoreboardPolling(updateScoreboardView);
}

export function renderInitialAuthenticatedView() {
  const view = new URLSearchParams(window.location.search).get('view');
  if (view === 'scoreboard-display') {
    renderScoreboardDisplay();
    return;
  }
  renderDashboard();
}

export function showError(message: string) {
  let errorEl = document.getElementById('global-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.id = 'global-error';
    errorEl.className = 'error-message';
    app.prepend(errorEl);
  }
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

// visibilitychangeでstate-serviceとcommand-service両方を制御
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    handleVisibilityForAuth(document.hidden);
  });
}

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const previewParams = new URLSearchParams(window.location.search);
const isManualPreview = import.meta.env.DEV && previewParams.has('manual-preview');
const isScoreboardPreview = import.meta.env.DEV && previewParams.has('scoreboard-preview');
const isScoreboardAdminPreview = import.meta.env.DEV && previewParams.has('scoreboard-admin-preview');

if (isScoreboardPreview || isScoreboardAdminPreview) {
  const previewState = {
    id: 1,
    challenge_count: 20,
    success_count: 5,
    revision: 1,
    updated_at: new Date().toISOString(),
  };
  if (isScoreboardPreview) {
    app.className = 'app-scoreboard-display';
    app.appendChild(createScoreboardDisplayView());
  } else {
    app.appendChild(createScoreboardView(() => undefined));
  }
  updateScoreboardView(previewState, null);
} else if (isManualPreview) {
  renderManual();
} else if (!url || !key) {
  app.innerHTML = '';
  const errContainer = document.createElement('div');
  errContainer.style.padding = '20px';
  errContainer.style.color = 'var(--danger-color)';
  errContainer.style.fontWeight = 'bold';
  errContainer.textContent = '接続設定がありません';
  app.appendChild(errContainer);
} else {
  initAuth();
}
