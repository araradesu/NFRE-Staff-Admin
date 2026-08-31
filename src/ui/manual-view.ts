import { logout } from '../auth';

type ManualViewOptions = {
  onBack: () => void;
};

export function createManualView({ onBack }: ManualViewOptions): HTMLElement {
  const container = document.createElement('div');
  container.className = 'manual-container';

  container.innerHTML = `
    <header class="manual-header">
      <div>
        <p class="manual-eyebrow">NFRE STAFF GUIDE</p>
        <h1>スタッフマニュアル</h1>
        <p class="manual-lead">困ったときは、状況や台詞を検索してください。</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn-secondary" data-manual-back>ダッシュボードへ</button>
        <button type="button" class="btn-secondary" data-manual-logout>ログアウト</button>
      </div>
    </header>

    <div class="manual-sticky-tools">
      <label class="manual-search-wrap">
        <span>マニュアル内検索</span>
        <input type="search" class="manual-search" placeholder="例：Go、切断、ペン、ショートカット" autocomplete="off">
      </label>
      <nav class="manual-jump-nav" aria-label="マニュアル目次">
        <a href="#manual-flow">本番の流れ</a>
        <a href="#manual-dashboard">管理画面</a>
        <a href="#manual-shortcuts">ショートカット</a>
        <a href="#manual-irregular">最終行動</a>
        <a href="#manual-trouble">トラブル</a>
      </nav>
    </div>

    <div class="manual-no-results" hidden>該当する項目がありません。別の言葉で検索してください。</div>

    <main class="manual-content">
      <section class="manual-section" id="manual-flow" data-manual-section>
        <div class="manual-section-heading">
          <span class="manual-section-number">01</span>
          <div><h2>本番の流れ</h2><p>受付完了から転換まで</p></div>
        </div>

        <article class="manual-entry manual-card manual-card-accent">
          <div class="manual-card-label">開始前</div>
          <h3>1．接続と会場を確認</h3>
          <ul class="manual-checklist">
            <li>使用するTEAMが緑色の「接続中」になっている</li>
            <li>各PCが「開始待機」になっている</li>
            <li>アイテム全てを初期位置へ戻した</li>
            <li>参加者の荷物を荷物置き場へ移動してもらった</li>
          </ul>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">導入演出</div>
          <h3>2．ペンと手帳の落とし物</h3>
          <div class="manual-script">
            <blockquote>「このペン落ちてますけど、どなたのですか？」</blockquote>
            <p class="stage-direction">違うと言われたら、軽く謝って無記名落とし物ボックスへ入れに行く。</p>
            <blockquote>「あ、そうですか、失礼しました。」</blockquote>
            <p class="stage-direction">戻りながら、ほかに落とし物がないか確認する。</p>
            <blockquote>「すみませんね、時間かかりまして。」</blockquote>
            <p class="stage-direction">手帳を見つけ、落とし物の多さにあきれ笑いする。</p>
            <blockquote>「え～……これは皆さんの物じゃ……ないですかね？」</blockquote>
            <p class="stage-direction">手帳の裏面を見て、読みながら平山 海先生の物だと気付く。</p>
            <blockquote>「平山……海……先生のか。」</blockquote>
            <p class="stage-direction">「この人」で裏面をしれっと参加者側へ向ける。</p>
            <blockquote>「一旦今から試験始めますね。で、始まったらこの人に手帳渡してくるんで、ちょっとスタッフいなくなります。その間、立ち歩いたり、カンニングしたりしないようにお願いします。では、画面をご覧ください。」</blockquote>
          </div>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">試験開始</div>
          <h3>3．管理画面から開始</h3>
          <ol>
            <li>対象チームが「試験開始待ち」になったことを確認する。</li>
            <li>対象チームの「試験開始」を押す。</li>
            <li>確認画面でもう一度「実行」を押す。</li>
            <li>5カウント後、残り15:00から試験が始まったことを確認する。</li>
          </ol>
          <p class="manual-note">別チームのカードを押さないように注意すること。</p>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">試験中</div>
          <h3>4．進行を監視する</h3>
          <ul>
            <li>残り時間・現在フェーズ・接続状態を確認する。</li>
            <li>通常進行中は「詳細操作」を開かない。</li>
            <li>参加者から答えや解き方を聞かれても回答しない。</li>
            <li>画面停止や操作不能などの機器トラブルに気付いたら、参加者から呼ばれるのを待たずに自分から対応しに行く。</li>
            <li>安全・体調・機器トラブルへの対応は、ゲーム判定より優先する。</li>
          </ul>
        </article>

        <article class="manual-entry manual-card manual-card-success">
          <div class="manual-card-label">成功</div>
          <h3>5．正しい最終行動を確認した</h3>
          <ol>
            <li>台詞を挟まず、正しい小物入れを持って会場を出る。</li>
            <li>対象チームの「成功判定」をONにする。</li>
            <li>成功時間が固定されたことを確認し、必要なら修正する。</li>
            <li>少し時間を空けて、対象チームの「Go実行」を押す。</li>
          </ol>
          <p class="manual-note">Goを押すとエンディングが確定する。必ずチーム番号と成功判定を確認する。</p>
        </article>

        <article class="manual-entry manual-card manual-card-danger">
          <div class="manual-card-label">時間切れ・失敗</div>
          <h3>6．成功判定を付けずにGo</h3>
          <ol>
            <li>残り時間が00:00であることを確認する。</li>
            <li>「成功判定」がOFFであることを確認する。</li>
            <li>対象チームの「Go実行」を押す。</li>
          </ol>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">終了後</div>
          <h3>7．退出と転換</h3>
          <ul class="manual-checklist">
            <li>参加者の私物忘れがないか確認する</li>
            <li>使用したピースと備品をすべて回収する</li>
            <li>手帳・ペン・小物入れを初期位置へ戻す</li>
            <li>PCが「転換チェック」または次回の開始待機へ進んだことを確認する</li>
          </ul>
        </article>
      </section>

      <section class="manual-section" id="manual-dashboard" data-manual-section>
        <div class="manual-section-heading">
          <span class="manual-section-number">02</span>
          <div><h2>Web管理画面の使い方</h2><p>ボタンの意味と操作条件</p></div>
        </div>

        <article class="manual-entry manual-card">
          <h3>接続表示</h3>
          <div class="manual-status-grid">
            <div><span class="status-dot status-green"></span><strong>接続中</strong><small>最終通信から10秒以内。通常操作可能。</small></div>
            <div><span class="status-dot status-orange"></span><strong>遅延</strong><small>最終通信から11～20秒。連打せず待つ。</small></div>
            <div><span class="status-dot status-red"></span><strong>切断</strong><small>20秒を超えて通信なし。PCと回線を確認。</small></div>
          </div>
        </article>

        <article class="manual-entry manual-card">
          <h3>通常操作</h3>
          <dl class="manual-definition-list">
            <div><dt>成功判定</dt><dd>ONにした瞬間の経過時間を成功タイムとして固定する。Go前なら変更可能。</dd></div>
            <div><dt>試験開始</dt><dd>「試験開始待ち」のチームで表示される。5カウントを開始する。</dd></div>
            <div><dt>Go実行</dt><dd>成功・失敗を確定し、エンディング着信へ進める。</dd></div>
            <div><dt>詳細操作</dt><dd>タイマー変更や緊急復旧を開く。通常進行では使用しない。</dd></div>
          </dl>
        </article>

        <article class="manual-entry manual-card manual-card-warning">
          <h3>詳細操作</h3>
          <dl class="manual-definition-list">
            <div><dt>一時停止／再開</dt><dd>安全対応や機器トラブルで試験を止める場合に使用。</dd></div>
            <div><dt>0秒にする</dt><dd>残り時間を強制的に00:00へ変更する。</dd></div>
            <div><dt>15:00に戻す</dt><dd>タイマーを初期値へ戻す。誤操作すると進行が大きく変わる。</dd></div>
            <div><dt>残り時間直接指定</dt><dd>分・秒を指定して残り時間を修正する。</dd></div>
            <div><dt>成功タイム直接指定</dt><dd>成功判定ONのチームだけ、記録時間を訂正できる。</dd></div>
            <div><dt>緊急復旧・強制移動</dt><dd>画面停止などの復旧専用。現在地と移動先を確認してから使う。</dd></div>
          </dl>
        </article>

        <article class="manual-entry manual-card">
          <h3>操作結果の表示</h3>
          <ul>
            <li><strong>送信中／処理待ち：</strong>操作中。別のボタンを押さずに待つ。</li>
            <li><strong>適用済み：</strong>PCへの反映完了。</li>
            <li><strong>応答待ち：</strong>通信が遅れている。連打せず接続状態を確認する。</li>
            <li><strong>拒否：</strong>現在のフェーズでは実行できないなど、表示された理由を確認する。</li>
            <li><strong>送信失敗：</strong>回線を確認し、PCの状態が変わっていないことを確認してから再操作する。</li>
          </ul>
        </article>
      </section>

      <section class="manual-section" id="manual-shortcuts" data-manual-section>
        <div class="manual-section-heading">
          <span class="manual-section-number">03</span>
          <div><h2>PC側ショートカット</h2><p>通常進行では操作しない</p></div>
        </div>

        <article class="manual-entry manual-card manual-card-warning">
          <h3>必要な場合だけ使用する</h3>
          <p class="manual-note">ショートカットはすべて通常進行では使用しない。復旧・動作確認・スタッフ操作が必要な場合に限って使用する。</p>
          <div class="shortcut-list">
            <div><kbd>Ctrl</kbd><span>＋</span><kbd>Shift</kbd><span>＋</span><kbd>F12</kbd><strong>1秒長押し</strong><p>ローカル管理者メニューを開く／閉じる。</p></div>
            <div><kbd>Esc</kbd><p>管理者メニューまたは確認画面を閉じる。</p></div>
            <div><kbd>Ctrl</kbd><span>＋</span><strong>左クリック</strong><p>通話・プロローグの文字送りや待機を即時スキップする。</p></div>
            <div><kbd>Enter</kbd><span>／</span><kbd>Space</kbd><p>操作説明画面で「次へ」と同じ動作。</p></div>
            <div class="shortcut-danger"><kbd>Ctrl</kbd><span>＋</span><kbd>Shift</kbd><span>＋</span><kbd>F11</kbd><p>試験開始待ちから試験中へ直接移動する開発用操作。本番では使用しない。</p></div>
            <div class="shortcut-danger"><kbd>F10</kbd><p>デバッグ情報画面を表示する開発用操作。本番では使用しない。</p></div>
          </div>
        </article>
      </section>

      <section class="manual-section" id="manual-irregular" data-manual-section>
        <div class="manual-section-heading">
          <span class="manual-section-number">04</span>
          <div><h2>最終行動の対応</h2><p>正解行動・別解・不正解行動</p></div>
        </div>

        <article class="manual-entry manual-card manual-card-success">
          <div class="manual-card-label">正解行動</div>
          <h3>参加者が行う正式な最終行動</h3>
          <blockquote>「けっさく」のピースだけが入った小物入れを、会場の床に落とす。</blockquote>
          <p><strong>判定条件：</strong>小物入れの裏面に「鈴木 優希」と記名され、中には「けっさく」のピースが1枚だけ入っていること。</p>
        </article>

        <article class="manual-entry manual-card manual-card-accent">
          <div class="manual-card-label">共通の初動</div>
          <h3>何か物が落とされたら</h3>
          <ol>
            <li>落とされた物を拾い上げる。</li>
            <li>入れ物であれば、参加者に見せつけないよう自然に中身を確認する。</li>
            <li>裏面などに記名がある場合は、その名前も確認する。</li>
            <li>下記の「正解の場合」または「不正解行動集」に沿って対応する。</li>
          </ol>
        </article>

        <article class="manual-entry manual-card manual-card-success">
          <div class="manual-card-label">正解の場合</div>
          <h3>無言で持って会場を出る</h3>
          <ol>
            <li>参加者には何も言わず、小物入れを持って会場を出る。</li>
            <li>対象チームの「成功判定」をONにする。</li>
            <li>必要に応じて、最終行動を行った時点の成功タイムへ修正する。</li>
            <li>少し時間を空けて「Go実行」を押し、成功エンディングを流す。</li>
            <li>成功エンディングが始まってから会場へ戻る。</li>
          </ol>
          <p class="manual-note">成功判定・成功タイム・対象チームを確認してからGoを実行すること。</p>
        </article>

        <article class="manual-entry manual-card manual-card-success">
          <div class="manual-card-label">別解</div>
          <h3>正しい小物入れをスタッフへ直接渡された</h3>
          <p class="manual-examples">「けっさく」のピースだけが入った正しい小物入れを渡され、「渡してほしい」「落としていた」と言われた場合。</p>
          <blockquote>「落とし物ですかね？ ありがとうございます。渡してきますね。」</blockquote>
          <ol>
            <li>小物入れを持って会場を出る。</li>
            <li>対象チームの「成功判定」をONにする。</li>
            <li>必要に応じて成功タイムを修正する。</li>
            <li>少し時間を空けて「Go実行」を押し、成功エンディングを流す。</li>
            <li>成功エンディングが始まってから会場へ戻る。</li>
          </ol>
        </article>

        <article class="manual-entry manual-card manual-card-danger manual-subheading-card">
          <div class="manual-card-label">不正解行動集</div>
          <h3>以下は成功判定を押さない</h3>
          <p>間違っている理由や正しい提出方法は説明せず、それぞれの台詞に沿って対応する。</p>
        </article>

        <article class="manual-entry manual-card">
          <h3>記名のない物・ピースだけを落とされた</h3>
          <ol>
            <li>落とされた物を持って参加者の元へ行く。</li>
            <li><blockquote>「こちら、皆さんの物ですか？」</blockquote></li>
            <li>否定されても、確認のためもう一度聞く。<blockquote>「本当に皆さんの物ではないんですね？」</blockquote></li>
            <li>再び自分たちの物ではないと言われたら、<blockquote>「分かりました。名前が書かれていないので、一度預かっておきますね。」</blockquote></li>
            <li>無記名落とし物ボックスへ入れる。</li>
          </ol>
          <p class="manual-note">参加者が返却を求めた場合は返す。</p>
        </article>

        <article class="manual-entry manual-card">
          <h3>違う入れ物に入った物を落とされた</h3>
          <ol>
            <li>落とされた物を持って参加者の元へ行く。</li>
            <li><blockquote>「こちら、皆さんの物ですか？」</blockquote></li>
            <li>否定されても、確認のためもう一度聞く。<blockquote>「本当に皆さんの物ではないんですね？」</blockquote></li>
            <li>再び自分たちの物ではないと言われたら、<blockquote>「分かりました。では、この方に届けてきますね。」</blockquote></li>
            <li>物を持って会場を出る。成功判定は押さない。</li>
          </ol>
        </article>

        <article class="manual-entry manual-card">
          <h3>記名のない物を、特定の人へ届けるよう頼まれた</h3>
          <p class="manual-examples">記名のない物やピースだけを渡され、「○○先生に届けてほしい」「○○先生が落とした」と言われた場合。</p>
          <blockquote>「名前のないものは、取り違え防止のため学校が預かる決まりでして……。」</blockquote>
          <blockquote>「これがその方の物である証拠があればお届けできるんですが……。」</blockquote>
          <p>物は受け取らず、参加者へ返す。</p>
        </article>

        <article class="manual-entry manual-card">
          <h3>答え・先生・正誤を質問された</h3>
          <p class="manual-examples">例：「答えは傑作？」「どちらの鈴木先生？」「このピースで合ってる？」</p>
          <blockquote>「スタッフは試験内容や担当者を知らされていないため、解答や正誤に関してはお答えできません。」</blockquote>
        </article>

        <article class="manual-entry manual-card">
          <h3>持っていった後に返してほしいと言われた</h3>
          <blockquote>「取ってきますね。」</blockquote>
          <p>可能な限り返却する。参加者の満足度を優先し、間違いの内容は説明しない。</p>
        </article>
      </section>

      <section class="manual-section" id="manual-trouble" data-manual-section>
        <div class="manual-section-heading">
          <span class="manual-section-number">05</span>
          <div><h2>トラブル対応</h2><p>人の安全を最優先し、操作は連打しない</p></div>
        </div>

        <article class="manual-entry manual-card manual-card-warning">
          <h3>本物の私物が落ちていた</h3>
          <p>財布・スマートフォン・鍵など、参加者の本物の私物はゲームの最終行動として扱わない。</p>
          <blockquote>「こちら、皆さんの落とし物ではありませんか？」</blockquote>
          <p>持ち主を確認してすぐに返却する。ゲーム上の2回確認や成功・失敗処理には入れない。</p>
        </article>

        <article class="manual-entry manual-card manual-card-danger">
          <h3>物を投げた・危険な行為があった</h3>
          <blockquote>「危険ですので、物を投げないでください。床へ静かに置いてください。」</blockquote>
          <p>最終行動の判定より先に、周囲の安全を確保する。安全確認後、置かれた物を通常どおり確認する。</p>
        </article>

        <article class="manual-entry manual-card manual-card-danger">
          <h3>体調不良・けが</h3>
          <ol>
            <li>対象チームのタイマーを一時停止する。</li>
            <li>参加者の状態を確認し、必要に応じて着席・退出・救護対応を行う。</li>
            <li>ほかのスタッフへ応援を求める。</li>
            <li>再開できる場合は、必要に応じて残り時間を修正してから再開する。</li>
          </ol>
          <p class="manual-note">ゲームの継続や成功判定より、参加者の安全を優先する。</p>
        </article>

        <article class="manual-entry manual-card manual-card-danger">
          <h3>PCが止まった・画面が進まない</h3>
          <ol>
            <li>対象チームのタイマーを一時停止する。</li>
            <li>管理画面の接続表示と現在フェーズを確認する。</li>
            <li>PC側でローカル管理者メニューを開く。</li>
            <li>復旧できなければ、Web管理画面の「緊急復旧」を使用する。</li>
            <li>必要に応じて残り時間を直接指定し、タイマーを再開する。</li>
          </ol>
        </article>

        <article class="manual-entry manual-card">
          <h3>管理画面が「遅延」「切断」になった</h3>
          <ol>
            <li>同じ操作を連打しない。</li>
            <li>対象PCが起動しており、ゲーム画面が表示されているか確認する。</li>
            <li>PCと管理端末のネットワーク接続を確認する。</li>
            <li>復旧後、現在フェーズと残り時間が正しいか確認する。</li>
          </ol>
        </article>

        <article class="manual-entry manual-card">
          <h3>誤って成功判定をONにした</h3>
          <p>Go実行前なら、成功判定をもう一度押してOFFへ戻す。Go実行後はエンディングが確定しているため、緊急復旧で正しいフェーズへ戻す。</p>
        </article>

        <article class="manual-entry manual-card">
          <h3>操作が拒否された</h3>
          <p>表示された理由を確認する。「現在のフェーズでは実行できません」の場合は、対象チームと現在フェーズが正しいか確認する。状態が更新されるまで次の操作を行わない。</p>
        </article>
      </section>
    </main>
  `;

  container.querySelector<HTMLButtonElement>('[data-manual-back]')?.addEventListener('click', onBack);
  container.querySelector<HTMLButtonElement>('[data-manual-logout]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget as HTMLButtonElement;
    button.disabled = true;
    const success = await logout();
    if (!success) button.disabled = false;
  });

  const search = container.querySelector<HTMLInputElement>('.manual-search');
  const noResults = container.querySelector<HTMLElement>('.manual-no-results');
  const sections = Array.from(container.querySelectorAll<HTMLElement>('[data-manual-section]'));

  search?.addEventListener('input', () => {
    const query = normalizeSearchText(search.value);
    let visibleCount = 0;

    sections.forEach(section => {
      const heading = section.querySelector<HTMLElement>('.manual-section-heading');
      const sectionMatches = !query || normalizeSearchText(heading?.textContent ?? '').includes(query);
      section.querySelectorAll<HTMLElement>('.manual-entry').forEach(entry => {
        const visible = sectionMatches || normalizeSearchText(entry.textContent ?? '').includes(query);
        entry.hidden = !visible;
        if (visible) visibleCount++;
      });
      const hasVisibleEntry = Array.from(section.querySelectorAll<HTMLElement>('.manual-entry'))
        .some(entry => !entry.hidden);
      section.hidden = !hasVisibleEntry;
    });

    if (noResults) noResults.hidden = visibleCount !== 0;
  });

  return container;
}

function normalizeSearchText(value: string): string {
  return value.toLocaleLowerCase('ja-JP').replace(/[\s　・／/]+/g, '');
}
