import { logout } from '../auth';
import type { TeamState } from '../types';
import { createTeamCard, updateTeamCard } from './team-card';
import { getCommandStatus } from '../command-service';

export function createDashboardView(onOpenManual?: () => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'dashboard-container';

  const header = document.createElement('header');
  header.className = 'dashboard-header';

  const title = document.createElement('h1');
  title.textContent = 'ダッシュボード';

  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'ログアウト';
  logoutBtn.className = 'btn-secondary';
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    const success = await logout();
    if (!success) {
      logoutBtn.disabled = false;
    }
  });

  const manualBtn = document.createElement('button');
  manualBtn.type = 'button';
  manualBtn.textContent = 'マニュアル';
  manualBtn.className = 'btn-secondary';
  manualBtn.addEventListener('click', () => onOpenManual?.());

  const headerActions = document.createElement('div');
  headerActions.className = 'header-actions';
  headerActions.appendChild(manualBtn);
  headerActions.appendChild(logoutBtn);

  header.appendChild(title);
  header.appendChild(headerActions);

  const errorContainer = document.createElement('div');
  errorContainer.id = 'dashboard-error';
  errorContainer.className = 'error-message hidden';

  const cardsContainer = document.createElement('div');
  cardsContainer.id = 'cards-container';
  cardsContainer.className = 'cards-container';

  container.appendChild(header);
  container.appendChild(errorContainer);
  container.appendChild(cardsContainer);

  return container;
}

export function updateDashboardStates(states: TeamState[], error: string | null) {
  const errorContainer = document.getElementById('dashboard-error');
  if (errorContainer) {
    if (error) {
      errorContainer.textContent = error;
      errorContainer.classList.remove('hidden');
    } else {
      errorContainer.classList.add('hidden');
    }
  }

  const container = document.getElementById('cards-container');
  if (!container) return;

  states.forEach(state => {
    const existingCard = document.getElementById(`card-${state.team_id}`);
    const cs = getCommandStatus(state.team_id);

    if (existingCard) {
      // 差分更新
      updateTeamCard(existingCard, state, cs);
    } else {
      // 初回生成
      container.appendChild(createTeamCard(state));
    }
  });
}
