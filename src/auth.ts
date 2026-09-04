import { getSupabaseClient } from './supabase';
import { stopPolling, clearStates, pausePolling, resumePolling } from './state-service';
import { cancelAllWatches, pauseAllWatches, resumeAllWatches, activateCommandService } from './command-service';
import { clearScoreboardState, pauseScoreboardPolling, resumeScoreboardPolling, stopScoreboardPolling } from './scoreboard-service';
import { renderInitialAuthenticatedView, renderLogin, showError } from './main';

let isAuthenticated = false;

export async function initAuth() {
  const supabase = getSupabaseClient();
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.warn('Session check failed');
      handleLogout();
    } else if (session) {
      handleLoginSuccess();
    } else {
      handleLogout();
    }
  } catch (err) {
    console.warn('Session check exception');
    handleLogout();
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      if (session && !isAuthenticated) {
        handleLoginSuccess();
      }
    } else if (event === 'TOKEN_REFRESHED') {
      // 再描画しない
    } else if (event === 'SIGNED_OUT') {
      if (isAuthenticated) {
        handleLogout();
      }
    }
  });
}

function handleLoginSuccess() {
  isAuthenticated = true;
  activateCommandService();
  renderInitialAuthenticatedView();
}

function handleLogout() {
  isAuthenticated = false;
  stopPolling();
  clearStates();
  stopScoreboardPolling();
  clearScoreboardState();
  cancelAllWatches();
  renderLogin();
}

export function handleVisibilityForAuth(isHidden: boolean) {
  if (isHidden) {
    pausePolling();
    pauseScoreboardPolling();
    pauseAllWatches();
  } else {
    resumePolling();
    resumeScoreboardPolling();
    resumeAllWatches();
  }
}

export async function login(email: string, password: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showError('ログインに失敗しました。メールアドレスまたはパスワードを確認してください。');
      return false;
    }
    return true;
  } catch (err) {
    showError('ログイン処理中にエラーが発生しました。');
    return false;
  }
}

export async function logout(): Promise<boolean> {
  const supabase = getSupabaseClient();
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError('ログアウトに失敗しました。');
      return false;
    }
    return true;
  } catch (err) {
    showError('ログアウト処理中にエラーが発生しました。');
    return false;
  }
}
