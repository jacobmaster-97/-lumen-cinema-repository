# CODEX_HANDOFF

## Goal / phase

使用者回報按「繼續已儲存進度」後需要重建戲院。維護修正，基準5c6a46c（公開0.7.1）。v0.7.2本機存檔回歸通過；待完整流程、CI及原Pages同SHA核對。

## Implemented

- game：啟動先還原現有檔案；saveReady阻止尚未讀檔或讀檔失敗時的pagehide／自動存檔以暫時新局覆蓋原檔。讀取失敗停用開業／繼續；成功載入營業中資料仍暫停，不跳時間。
- 歡迎視窗提供正確的繼續入口；有合法較早備份可先預覽日期／資金／建築、確認才恢復。恢復及確認重新開局前先備份原始檔，備份寫入失敗取消操作。取消預覽不寫入。沒有備份不虛構進度。
- 引擎／經濟／v2格式、已確認地圖／美術、未採用圖邊界與0.7.1高密度畫布／靜態快取不改。0.7.2模組快取。
- 新scripts/verify-save-reopen.cjs及兩項construction回歸。來源與約束詳docs/save-recovery-v0.7.2.md。

## Verification

原版真實瀏覽器重現：已建4區域→0、資金44792.04→68000、日期2→1。原因是歡迎畫面再重載觸發pagehide儲存空白暫時狀態，不是一般map序列化遺失；未讀到用戶iPad實際檔案，不把重現當作已確定其資料現況。

77項Node、8項實際存檔流程通過（重開／營業中／素材載入中離頁／錯誤檔保留／預覽取消／恢復／備份寫入失敗／確認新局）。完整遊戲及裝置流程結果見production/verification/v0.7.2。Safari實機、用戶當前檔案與最後一刻可恢復性未測。DEBUG_HANDOFF新增本次根因。

## Release / recovery

原https://jacobmaster-97.github.io/-lumen-cinema-repository/ main，待發布0.7.2；workflow及公開來源見production/verification/v0.7.2/deployment.json。必要時revert功能提交重跑工作流程，保留主檔與所有備份。前版來源605902e5f428f9d005ecfc5bef548314fc2fffc6。

歷史未追蹤美術／審閱稿不加入；只stage本輪檔案。更新gdd／timeline後refresh-context再validate。docs-impact分類器不識別prototypes/browser，需手動記錄擁有文件。後續驗證文件[skip ci]不改公開功能來源。

## Risks / next safe task

完成公開版本及真實存檔流程核對；讓用戶重新整理後按繼續，若主檔已空白，查看可用較早備份預覽，不能保證所有失去的最新進度可還原。
