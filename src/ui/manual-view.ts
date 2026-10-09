import { logout } from '../auth';
import turnoverDeskLayoutUrl from '../assets/turnover-desk-layout.png';
import turnoverLostItemsUrl from '../assets/turnover-lost-items.jpg';

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
        <a href="#manual-basics">役割・接客</a>
        <a href="#manual-flow">本番の流れ</a>
        <a href="#manual-dashboard">管理画面</a>
        <a href="#manual-shortcuts">ショートカット</a>
        <a href="#manual-irregular">最終行動</a>
        <a href="#manual-trouble">トラブル</a>
      </nav>
    </div>

    <div class="manual-no-results" hidden>該当する項目がありません。別の言葉で検索してください。</div>

    <main class="manual-content">
      <section class="manual-section" id="manual-basics" data-manual-section>
        <div class="manual-section-heading">
          <span class="manual-section-number">00</span>
          <div><h2>最初に読むこと</h2><p>担当分けと、参加者への接し方</p></div>
        </div>

        <article class="manual-entry manual-card manual-card-accent">
          <div class="manual-card-label">基本の担当分け</div>
          <h3>「案内スタッフ」と「試験スタッフ」で役割を分ける</h3>
          <div class="manual-role-grid">
            <div><strong>案内スタッフ</strong><p>会場への案内・誘導、チーム分け、入場前後の説明、終了後の案内など、ゲーム外のメタ的な部分を担当する。</p></div>
            <div><strong>試験スタッフ</strong><p>オープニングの演技、試験開始、試験中の監視や声掛けなど、ゲーム内のストーリー的な部分を担当する。</p></div>
          </div>
          <p class="manual-note">成功・失敗処理と転換は、空いている人が担当し、試験スタッフが率先する。転換は1stと2ndに分け、余裕があれば別のスタッフが担当する。人手が足りない場合は、1人で最後まで行ってもよい。</p>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">スタッフの設定</div>
          <h3>試験内容を知らされていない「雇われのスタッフ」</h3>
          <p>スタッフは、この試験の管理・運営を任されている雇われのスタッフとして振る舞う。</p>
          <p>試験担当の先生からは、「カンニング防止のため」という理由で、試験問題や答え、それに付随する情報を何も知らされていない。当日の運営方法だけを伝えられている。</p>
          <p class="manual-note">問題の答えや内容だけでなく、試験担当の先生の名前も事前には知らない。質問されても推測で答えず、「知らされていない」という立場を崩さない。</p>
        </article>

        <article class="manual-entry manual-card manual-card-warning">
          <div class="manual-card-label">接客の基本</div>
          <h3>固い言葉で案内しない</h3>
          <p>「～となっております」「～でございます」ではなく、「～ってなってます」「～です」のように、気さくな言葉で参加者と接する。</p>
          <p>このマニュアルは書き言葉の都合で少し固く書いているが、意味が変わらない範囲なら、自分が話しやすい言葉に変えてよい。</p>
          <p class="manual-note">参加者は「謎解きゲーム」を楽しみに来ている。緊張させるのではなく、ドキドキ・ワクワクしてもらえる言葉遣いと身振り手振りを意識する。</p>
        </article>
      </section>

      <section class="manual-section" id="manual-flow" data-manual-section>
        <div class="manual-section-heading">
          <span class="manual-section-number">01</span>
          <div><h2>本番の流れ</h2><p>入場案内から転換のダブルチェックまで</p></div>
        </div>

        <article class="manual-entry manual-card manual-card-accent">
          <div class="manual-card-label">担当：案内スタッフ</div>
          <h3>1．参加意思と人数を確認する</h3>
          <div class="manual-script">
            <blockquote>「こんにちは～。皆さん、11月祭謎解き試験に参加される方ですかね？」</blockquote>
            <blockquote>「何名様ですか？」</blockquote>
          </div>
          <dl class="manual-definition-list">
            <div><dt>3名以下</dt><dd>「では、また準備ができましたら案内しますので、この扉の前でお待ちください。」</dd></div>
            <div><dt>4名以上</dt><dd>「こちらのゲームは1チームにつき3名までしか同時に挑戦できないので、分かれての案内になりますがよろしいですか？」</dd></div>
          </dl>
          <ul>
            <li>チームの分け方はこちらから提案する。4人なら2・2、5人なら2・3、7人なら2・2・3を目安にする。</li>
            <li>小学生未満は人数に数えなくてよい。例：大人3人と未就学児1人は同じチームで案内できる。</li>
          </ul>
          <p class="manual-note">ここまで案内したら、参加者には扉の前でもう少し待ってもらう。</p>
        </article>

        <article class="manual-entry manual-card manual-card-accent">
          <div class="manual-card-label">担当：案内スタッフ</div>
          <h3>2．入場できる状態か確認する</h3>
          <p>会場内を見て、次の両方を確認する。</p>
          <ul class="manual-checklist">
            <li>案内するチーム数分の席が、転換済みになっている</li>
            <li>現在プレイ中の全チームが「オープニングの着信」まで進んでいる</li>
          </ul>
          <p>確認できたら扉を開けて参加者を会場内へ入れ、全員が入ったら扉を閉める。</p>
        </article>

        <article class="manual-entry manual-card manual-card-accent">
          <div class="manual-card-label">担当：案内スタッフ</div>
          <h3>3．役割と準備方法を案内する</h3>
          <div class="manual-script">
            <blockquote>「皆さんは、この実習室に試験を受けに来た学生の皆さんということで、間違いないですね？」</blockquote>
            <p class="stage-direction">否定されても「間違いないですね？？」と繰り返し、試験を受けに来た学生という設定を了承してもらう。</p>
          </div>
          <p>了承されたら説明用紙を見せる。この時点では、まだ渡さない。</p>
          <div class="manual-script">
            <blockquote>「では、皆さんは○番チームとなります。」</blockquote>
            <blockquote>「この説明用紙に従って、準備をしてください。」</blockquote>
            <blockquote>「準備ができましたら、もうゲームを始めてしまって大丈夫です。」</blockquote>
            <blockquote>「この説明用紙は表裏がありますので、しっかり読むようにしてください。」</blockquote>
            <p class="stage-direction">ここまで言い切ってから説明用紙を渡す。</p>
            <blockquote>「では説明用紙を持ったまま、あそこの○番チームの席にお座りください。」</blockquote>
          </div>
          <p class="manual-note">着席後は試験スタッフへ引き継ぐ。「ゲームスタートを押してよいか」などの質問があれば、案内スタッフが対応する。</p>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">担当：試験スタッフ</div>
          <h3>4．オープニング中を見守り、荷物を確認する</h3>
          <ul>
            <li>参加者がオープニングを見ている間、指示前にほかの物へ触っていないか見守る。</li>
            <li>関係のない物へ触っていたら、<blockquote>「指示があるまでは触らないようにお願いします。」</blockquote></li>
          </ul>
          <p>参加者が手を上げたら、準備確認へ進む。</p>
          <div class="manual-script">
            <blockquote>「あ、準備完了ですね。かしこまりました～。」</blockquote>
            <blockquote>「ポケットの中とか、スマートフォン、貴重品入ってないですか？」</blockquote>
            <blockquote>「私物は使えないので、荷物置き場か小物入れの中に入れておいてくださいね～。」</blockquote>
            <p class="stage-direction">確認しながら、しれっと小物入れを閉める。</p>
          </div>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">担当：試験スタッフ</div>
          <h3>5．ペンの落とし物を演じる</h3>
          <div class="manual-script">
            <p class="stage-direction">ほかに不備がないか探すふりをして、床の下のペンを拾う。</p>
            <blockquote>「これ、皆さんの物ですか？」</blockquote>
            <p class="stage-direction"><strong>違うと言われた場合：</strong>「そうですか……」と言い、首をかしげながら「名前のない落とし物ボックス」に置いて戻る。</p>
            <p class="stage-direction"><strong>そうですと言われた場合：</strong>「あ、そうですか。じゃあお返ししますね。」と言って返す。ペンには芯が入っておらず、書けないダミーアイテム。</p>
          </div>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">担当：試験スタッフ</div>
          <h3>6．手帳の落とし物を演じる</h3>
          <div class="manual-script">
            <p class="stage-direction">「もう大丈夫ですかね～……？」などと言いながら、念のためもう一度確認する体で手帳を拾う。名前が書かれていない面だけを見せる。</p>
            <blockquote>「……この手帳は、さすがに誰かのですか……？」</blockquote>
          </div>
          <dl class="manual-branch-list">
            <div>
              <dt>違うと言われた場合</dt>
              <dd>
                <blockquote>「え～、そうですか……あ……。」</blockquote>
                <p>名前に気づいたふりをして、</p>
                <blockquote>「ひらやま……かい先生のか……。」</blockquote>
              </dd>
            </div>
            <div>
              <dt>参加者の物だと言われた場合</dt>
              <dd>
                <blockquote>「あ、そうですか……では、この手帳、名前が書かれていますので、一応お名前確認してもいいですか？」</blockquote>
                <p>名前の面はまだ見せていないため、答えは一致しない想定。</p>
                <blockquote>「……ちょっとお名前違うので、お渡しできないですね。」</blockquote>
                <p>ここで名前の面を見せる。</p>
                <blockquote>「多分これは、ここの学校の平山先生の物ですね……。」</blockquote>
              </dd>
            </div>
          </dl>
          <p>どちらの分岐でも、少し悩むふりをして次へ進む。</p>
          <div class="manual-script">
            <blockquote>「……いったん、先に試験始めてしまいますね。」</blockquote>
            <blockquote>「ただ、試験始まったら、平山先生にこの手帳を渡しに行くので、一瞬いなくなります。」</blockquote>
            <blockquote>「ですので、くれぐれもカンニングとかしないようにお願いしますね。」</blockquote>
            <blockquote>「もう、数秒あったら戻ってくるので、さすがにできないと思いますけど……。」</blockquote>
            <blockquote>「よろしくお願いしますね。では、画面をご覧ください。」</blockquote>
          </div>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">担当：試験スタッフ</div>
          <h3>7．管理画面から試験を開始する</h3>
          <ol>
            <li>対象チームが「試験開始待ち」になったことを確認する。</li>
            <li>対象チームの「試験開始」を押す。</li>
            <li>確認画面でもう一度「実行」を押す。</li>
            <li>カウントダウンが始まったら、手帳を持って部屋を出る。</li>
            <li>手帳をポケットなどへ隠して部屋に戻り、スタッフ机へ置く。</li>
            <li>5カウント後、残り15:00から試験が始まったことを確認する。</li>
          </ol>
          <p class="manual-note">別チームのカードを押さないように注意すること。</p>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">担当：試験スタッフ</div>
          <h3>8．試験中の進行を監視する</h3>
          <ul>
            <li>残り時間・現在フェーズ・接続状態を確認する。</li>
            <li>PCの不具合やルール違反が起きていないか監視する。</li>
            <li>「キーボードの裏を見る」「モニターを上から押す」など勇気のいる行動を不安がっていたら、<blockquote>「何かやりたいことがある場合は、思い切ってやってみていいですよ。」</blockquote></li>
            <li>貼られている紙を剥がそうとしたら、<blockquote>「紙は剥がさなくていいみたいです。」</blockquote></li>
            <li>ノートの紙を取り外そうとしたら、<blockquote>「取り外さなくていいようです。」</blockquote></li>
            <li>ヒント推奨アナウンスから少なくとも1分経ってもヒントを見ていなければ、<blockquote>「詰まった時は、ぜひヒントも活用してくださいね。」</blockquote></li>
          </ul>
          <p class="manual-note">それ以外のイレギュラーは状況に応じて対応する。どうしても判断できない場合は、山平へ確認する。</p>
        </article>

        <article class="manual-entry manual-card manual-card-accent">
          <div class="manual-card-label">担当：試験スタッフ／標準演技</div>
          <h3>9．エラーコード画面へ到達したら先回りして対応する</h3>
          <p>参加者が「傑作」の言葉を送信しようとして、演出上のエラーコード画面へ到達したら、呼ばれるのを待たずにスタッフから話しかけに行く。</p>
          <ol>
            <li>対象チームと、最終問題で表示される想定されたエラー画面であることを確認する。</li>
            <li>残り時間が<strong>02:00以下</strong>なら、Web管理画面から対象チームのタイマーを一時停止する。02:01以上なら止めない。</li>
            <li><blockquote>「あ、エラー起きちゃってますね……。」</blockquote></li>
            <li>スタッフエリアから「エラー発生時対応資料」を持ってくる。</li>
            <li><blockquote>「……そういえば、担当の先生から、エラーが発生した場合はこの資料を渡せと言われていまして……。」</blockquote></li>
            <li>資料を参加者へ渡す。資料の意味や、別の提出方法は説明しない。</li>
            <li>さらに質問された場合は、<blockquote>「こちらに書かれている内容以上のことは、私も知らされていなくて……。」</blockquote></li>
            <li>タイマーを止めていた場合は、資料を渡し、スタッフとのやり取りが終わった時点で再開する。</li>
          </ol>
          <ul>
            <li>参加者が資料を読んで考える時間は止めない。</li>
            <li>参加者へタイマーの一時停止・再開は伝えない。</li>
            <li>画面停止・通信切断・操作不能など、本物の機器トラブルの場合は資料を渡さず、05「トラブル対応」に従う。</li>
          </ul>
          <p class="manual-note">一時停止・再開の前に、別チームを操作していないか必ず確認すること。</p>
        </article>

        <article class="manual-entry manual-card manual-card-success">
          <div class="manual-card-label">担当：空いている人（試験スタッフが率先）</div>
          <h3>10．成功パターン</h3>
          <p><strong>正規：</strong>参加者が正しい小物入れを「落とし物」としてスタッフへ直接渡した場合。</p>
          <p><strong>準正規：</strong>参加者が正しい小物入れを会場内へ実際に落とした場合。</p>
          <blockquote>「これ、落とし物ですかね？ 分かりました。すぐに届けてくるので、カンニングとかしないでくださいね。」</blockquote>
          <ol>
            <li>正しい小物入れを持って会場を出る。</li>
            <li>外で対象チームの「成功判定」をONにする。</li>
            <li>最終行動の時刻とずれていれば、部屋へ戻る前に成功時間を修正する。</li>
            <li>対象チーム・成功判定・成功時間を確認して「Go」を押す。</li>
            <li>部屋へ戻り、小物入れをスタッフ机へ置く。</li>
          </ol>
          <p class="manual-note">Goを押すとエンディングが確定する。必ず対象チームを確認する。</p>
        </article>

        <article class="manual-entry manual-card manual-card-danger">
          <div class="manual-card-label">担当：空いている人（試験スタッフが率先）</div>
          <h3>11．失敗パターン</h3>
          <ol>
            <li>残り時間が00:00であることを確認する。</li>
            <li>「成功判定」がOFFであることを確認する。</li>
            <li>対象チームを確認して「Go」を押す。</li>
          </ol>
        </article>

        <article class="manual-entry manual-card">
          <div class="manual-card-label">1st：空いている人（試験スタッフが率先）</div>
          <h3>12．退出後に転換する（1st）</h3>
          <p>参加者の私物忘れがないことを確認してから、次の順番で会場を初期状態へ戻す。</p>
          <ol>
            <li>PCを「転換チェック」画面へ移行する。</li>
            <li>ブラックライトを探し出し、中の電池を取り出す。電池の向きを確認して入れ直し、電池ケースに「古川」の紙が貼られていることを確認して、ケースを正しい向きでライトへ戻す。</li>
            <li>ライト側のフタは強く締めすぎない。ブラックライトが点灯することを確認する。</li>
            <li>謎の箱を「5963（ごくろうさん）」で開け、中の紙が剥がれていないことと、中に何も残っていないことを確認する。ブラックライトを網側へ入れ、チャックを中央まで閉める。四桁錠はまだ掛けず、謎の箱の上に置く。</li>
            <li>エラーコードメモと説明用紙をスタッフ机へ持っていき、代わりに手帳とペンの落とし物を持ってくる。</li>
            <li>手帳とペンを、落とし物配置写真と同じ位置で床へ置く。</li>
            <li>4枚のピースを回収し、キーボード裏の袋へ入れる。</li>
            <li>キーボードをモニターの前、マウスをキーボードの右側へ置く。参加者が動かさなくても自然に操作できるよう、キーボードは若干奥側に置く。</li>
            <li>小物入れを開け、中の紙が剥がれていないことと、何も入っていないことを確認する。開けた状態でマウスの右側へ置く。</li>
            <li>ノートを開き、ページ抜け・折り目・落書きがないことを確認する。表紙を上にして、キーボードの左側へ置く。</li>
            <li>謎の箱をノートの奥へ置く。</li>
            <li>モニターを一番上まで移動させる。</li>
          </ol>
          <div class="manual-turnover-images" aria-label="転換時の配置見本">
            <figure>
              <a href="${turnoverDeskLayoutUrl}" target="_blank" rel="noreferrer">
                <img src="${turnoverDeskLayoutUrl}" alt="謎の箱、ノート、キーボード、マウス、小物入れの机上配置図">
              </a>
              <figcaption><strong>机上配置図</strong><span>画像を押すと拡大表示</span></figcaption>
            </figure>
            <figure>
              <a href="${turnoverLostItemsUrl}" target="_blank" rel="noreferrer">
                <img src="${turnoverLostItemsUrl}" alt="机の下に置かれた手帳とペンの落とし物配置写真">
              </a>
              <figcaption><strong>落とし物配置写真</strong><span>青い手帳は机の左奥、ペンは左手前の脚元</span></figcaption>
            </figure>
          </div>
          <p class="manual-note">1stでは四桁錠を掛けない。謎の箱の中身は、ブラックライトを入れるときに一度だけ確認する。</p>
        </article>

        <article class="manual-entry manual-card manual-card-warning">
          <div class="manual-card-label">2nd：余裕があれば1stとは別の人</div>
          <h3>13．転換をダブルチェックする（2nd）</h3>
          <p>PCの転換チェック画面を見ながら、次の項目を一つずつ確認する。人手が足りない場合は、1stと同じ人が続けて確認してもよい。</p>
          <ol>
            <li>ブラックライトが正しく点灯する。</li>
            <li>ブラックライトだけが謎の箱の中に入っている。</li>
            <li>手帳とペンが、落とし物配置写真どおりに床へ置かれている。</li>
            <li>4枚のピースが、キーボード裏の袋に入っている。</li>
            <li>小物入れが空で、開いた状態で置かれている。</li>
            <li>ノートにページ抜け・折り目・落書きがない。</li>
            <li>謎の箱に四桁錠を「0000」で取り付け、施錠する。</li>
            <li>アイテムが机上配置図どおりに置かれている。モニターの前にキーボード、その右にマウス、その右に小物入れ、キーボードの左にノート、ノートの奥に謎の箱があることを確認する。</li>
            <li>机の裏・モニターの裏・天井・壁に、それぞれ紙が貼られている。</li>
            <li>モニターが一番上まで移動している。</li>
          </ol>
          <p class="manual-note">10項目すべてを確認し、不足や置き間違いを直してからリセットする。</p>
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
            <div><span class="status-dot status-green"></span><strong>接続中</strong><small>規定時間内に通信あり。通常操作可能。</small></div>
            <div><span class="status-dot status-orange"></span><strong>遅延</strong><small>進行中は10秒、待機中は45秒を超えて通信なし。連打せず待つ。</small></div>
            <div><span class="status-dot status-red"></span><strong>切断</strong><small>進行中は20秒、待機中は90秒を超えて通信なし。PCと回線を確認。</small></div>
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

        <article class="manual-entry manual-card">
          <h3>成功率表示・プロジェクター</h3>
          <ol>
            <li>ダッシュボード上部の「成功率表示」を開く。</li>
            <li>「投影画面を開く」を押し、プロジェクター側の別ウィンドウを全画面表示にする。</li>
            <li>成功・失敗エンディングが完了すると、受験チーム数が自動で増える。成功時は合格チーム数も増える。</li>
          </ol>
          <p>テストプレイや集計修正では、合格チーム数・受験チーム数を入力して「数値を変更」を押す。</p>
          <p class="manual-note">同じチームの結果画面を再表示しても二重加算されない。数値変更はゲームPCの状態には影響しない。</p>
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
          <div><h2>最終行動の対応</h2><p>正規・準正規・不正解行動</p></div>
        </div>

        <article class="manual-entry manual-card manual-card-success">
          <div class="manual-card-label">正規</div>
          <h3>落とし物としてスタッフへ直接渡す</h3>
          <blockquote>「けっさく」のピースだけが入った小物入れを、「落とし物」としてスタッフへ直接渡す。</blockquote>
          <p><strong>判定条件：</strong>小物入れの裏面に「鈴木 優希」と記名され、中には「けっさく」のピースが1枚だけ入っていること。</p>
        </article>

        <article class="manual-entry manual-card manual-card-success">
          <div class="manual-card-label">準正規</div>
          <h3>正しい小物入れを会場内へ実際に落とす</h3>
          <p>参加者が正しい小物入れを床へ落とした場合も成功として扱う。</p>
          <p><strong>判定条件：</strong>正規と同じく、小物入れの裏面に「鈴木 優希」と記名され、中には「けっさく」のピースが1枚だけ入っていること。</p>
        </article>

        <article class="manual-entry manual-card manual-card-accent">
          <div class="manual-card-label">落とされた場合の初動</div>
          <h3>拾って、中身と記名を確認する</h3>
          <ol>
            <li>落とされた物を拾い上げる。</li>
            <li>入れ物であれば、参加者に見せつけないよう自然に中身を確認する。</li>
            <li>裏面などに記名がある場合は、その名前も確認する。</li>
            <li>正しい小物入れなら次の「成功時の共通処理」、違っていれば「不正解行動集」に沿って対応する。</li>
          </ol>
        </article>

        <article class="manual-entry manual-card manual-card-success">
          <div class="manual-card-label">正規・準正規共通</div>
          <h3>成功時の共通処理</h3>
          <blockquote>「これ、落とし物ですかね？ 分かりました。すぐに届けてくるので、カンニングとかしないでくださいね。」</blockquote>
          <ol>
            <li>小物入れを持って会場を出る。</li>
            <li>対象チームの「成功判定」をONにする。</li>
            <li>必要に応じて、最終行動を行った時点の成功タイムへ修正する。</li>
            <li>「Go実行」を押し、成功エンディングを流す。</li>
            <li>会場へ戻り、小物入れをスタッフ机へ置く。</li>
          </ol>
          <p class="manual-note">成功判定・成功タイム・対象チームを確認してからGoを実行すること。</p>
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
          <h3>ペンを「自分の物」と言われた</h3>
          <blockquote>「あ、そうですか。お渡ししますね。」</blockquote>
          <p>そのままペンを渡す。芯が入っておらず使用できないダミーアイテムなので、取り返したり追加説明したりしなくてよい。</p>
        </article>

        <article class="manual-entry manual-card">
          <h3>参加者の声が大きい</h3>
          <blockquote>「他の受験者の方に聞こえるかもしれませんので、もう少しボリュームは抑えめでお願いします。」</blockquote>
          <p>答えや重要な情報がほかのチームへ聞こえる前に、落ち着いて声を掛ける。</p>
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
            <li>何があったかを確認し、必要に応じて着席・退出・救護対応を行う。</li>
            <li>トイレなど一時中断で戻れそうな場合は、中断中に会場内の物へ触れないよう案内する。</li>
            <li>ほかのスタッフへ応援を求める。</li>
            <li>参加者が戻り再開できる状態になったら、必要に応じて残り時間を修正してタイマーを再開する。</li>
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
