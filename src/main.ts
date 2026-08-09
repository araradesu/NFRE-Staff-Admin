import './styles.css';
import { initAuth, handleVisibilityForAuth } from './auth';
import { createLoginView } from './ui/login-view';
import { createDashboardView, updateDashboardStates } from './ui/dashboard-view';
import { startPolling } from './state-service';

const app = document.getElementById('app')!;

export function renderLogin() {
  app.innerHTML = '';
  app.appendChild(createLoginView());
}

export function renderDashboard() {
  app.innerHTML = '';
  app.appendChild(createDashboardView());
  startPolling(updateDashboardStates);
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

if (!url || !key) {
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
