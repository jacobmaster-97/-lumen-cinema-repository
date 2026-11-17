# CODEX_HANDOFF

## Goal / phase

使用者回報按「繼續已儲存進度」後需要重建戲院。維護修正，基準5c6a46c（公開0.7.1）。v0.7.2已發布，完整回歸、CI及原Pages同SHA核對通過。

## Implemented

- game：啟動先還原現有檔案；saveReady阻止尚未讀檔或讀檔失敗時的pagehide／自動存檔以暫時新局覆蓋原檔。讀取失敗停用開業／繼續；成功載入營業中資料仍暫停，不跳時間。
- 歡迎視窗提供正確的繼續入口；有合法較早備份可先預覽日期／資金／建築、確認才恢復。恢復及確認重新開局前先備份原始檔，備份寫入失敗取消操作。取消預覽不寫入。沒有備份不虛構進度。
- 引擎／經濟／v2格式、已確認地圖／美術、未採用圖邊界與0.7.1高密度畫布／靜態快取不改。0.7.2模組快取。
- 新scripts/verify-save-reopen.cjs及兩項construction回歸。來源與約束詳docs/save-recovery-v0.7.2.md。

## Verification

原版真實瀏覽器重現：已建4區域→0、資金44792.04→68000、日期2→1。原因是歡迎畫面再重載觸發pagehide儲存空白暫時狀態，不是一般map序列化遺失；未讀到用戶iPad實際檔案，不把重現當作已確定其資料現況。

77項Node、8項實際存檔流程通過（重開／營業中／素材載入中離頁／錯誤檔保留／預覽取消／恢復／備份寫入失敗／確認新局）。另有11條完整遊戲流程、8尺寸及4項DPR2／iPad非整數DPR觸控檢查通過。公開9項常規操作及8項專屬存檔流程通過，errors／failedRequests／未採用美術請求為空，見production/verification/v0.7.2。Safari實機、用戶當前檔案與最後一刻可恢復性未測。DEBUG_HANDOFF新增本次根因。

## Release / recovery

原https://jacobmaster-97.github.io/-lumen-cinema-repository/ main，已發布0.7.2，功能來源2434fcf437d5cd90180c9a457985c490ce61364c；測試44049651507及Pages44049651443均success，公開版本／同SHA及17項操作核對通過。公開HTTPS經平台CA驗證後原樣轉交Chromium，沒有停用TLS或本機替代；證據deployment.json、public.json及save-reopen-public.json。後續[skip ci]只記錄驗證／QA，不改公開功能來源。必要時revert功能提交重跑工作流程，保留主檔與所有備份。前版來源605902e5f428f9d005ecfc5bef548314fc2fffc6。

歷史未追蹤美術／審閱稿不加入；只stage本輪檔案。更新gdd／timeline後refresh-context再validate。docs-impact分類器不識別prototypes/browser，需手動記錄擁有文件。後續驗證文件[skip ci]不改公開功能來源。

## Risks / next safe task

公開核對已完成；讓用戶重新整理後按繼續，若主檔已空白，查看可用較早備份預覽，不能保證所有失去的最新進度可還原。
