# NFRE Staff Admin

NFREのスタッフ向けWeb管理画面です。

- TEAM_01からTEAM_03の状態監視
- 成功判定と成功タイムの設定
- 残り時間の設定、一時停止、再開
- Go実行とコマンド結果の確認
- 成功・失敗エンディング完了後の受験／合格チーム数の自動集計
- 集計値の手動修正とプロジェクター専用表示

利用にはSupabaseで登録されたスタッフアカウントが必要です。

## Development

```sh
npm install
npm run dev
```

接続設定は`.env.local`へ保存します。このファイルはGit管理対象外です。

成功率表示を利用するには、NFRE本体側のSupabaseマイグレーション
`supabase/migrations/004_scoreboard.sql`を適用してください。
