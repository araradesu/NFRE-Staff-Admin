let dialogLock = false;

export async function showConfirmDialog(teamId: string, actionLabel: string): Promise<boolean> {
  if (dialogLock) return false;
  dialogLock = true;

  return new Promise<boolean>(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const box = document.createElement('div');
    box.className = 'dialog-box';

    const title = document.createElement('h2');
    title.className = 'dialog-title';
    title.textContent = '操作の確認';

    const teamEl = document.createElement('p');
    teamEl.className = 'dialog-team';
    teamEl.textContent = `対象チーム: ${teamId}`;

    const actionEl = document.createElement('p');
    actionEl.className = 'dialog-action';
    actionEl.textContent = `操作: ${actionLabel}`;

    const btnRow = document.createElement('div');
    btnRow.className = 'dialog-btn-row';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.className = 'btn-secondary dialog-btn';

    const execBtn = document.createElement('button');
    execBtn.textContent = '実行';
    execBtn.className = 'btn-danger dialog-btn';

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(execBtn);

    box.appendChild(title);
    box.appendChild(teamEl);
    box.appendChild(actionEl);
    box.appendChild(btnRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function cleanup(result: boolean) {
      dialogLock = false;
      document.body.removeChild(overlay);
      resolve(result);
    }

    cancelBtn.addEventListener('click', () => cleanup(false));
    execBtn.addEventListener('click', () => cleanup(true));
  });
}
