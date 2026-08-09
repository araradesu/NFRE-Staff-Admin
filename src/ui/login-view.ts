import { login } from '../auth';

export function createLoginView(): HTMLElement {
  const container = document.createElement('div');
  container.className = 'login-container';

  const title = document.createElement('h1');
  title.textContent = 'NFRE 管理画面';

  const form = document.createElement('form');
  form.className = 'login-form';

  const emailGroup = document.createElement('div');
  emailGroup.className = 'input-group';
  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'メールアドレス';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.required = true;
  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);

  const pwdGroup = document.createElement('div');
  pwdGroup.className = 'input-group';
  const pwdLabel = document.createElement('label');
  pwdLabel.textContent = 'パスワード';
  const pwdInput = document.createElement('input');
  pwdInput.type = 'password';
  pwdInput.required = true;
  pwdGroup.appendChild(pwdLabel);
  pwdGroup.appendChild(pwdInput);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'ログイン';
  submitBtn.className = 'btn-primary';

  form.appendChild(emailGroup);
  form.appendChild(pwdGroup);
  form.appendChild(submitBtn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'ログイン中...';

    await login(emailInput.value, pwdInput.value);

    // Auth observer will redirect if successful, but re-enable just in case (e.g. error)
    submitBtn.disabled = false;
    submitBtn.textContent = 'ログイン';
    pwdInput.value = '';
  });

  container.appendChild(title);
  container.appendChild(form);

  return container;
}
