# NFRE Staff Admin

NFREのスタッフ向けWeb管理画面です。

- TEAM_01からTEAM_03の状態監視
- 成功判定と成功タイムの設定
- 残り時間の設定、一時停止、再開
- Go実行とコマンド結果の確認

利用にはSupabaseで登録されたスタッフアカウントが必要です。

## Development

```sh
npm install
npm run dev
```

接続設定は`.env.local`へ保存します。このファイルはGit管理対象外です。
