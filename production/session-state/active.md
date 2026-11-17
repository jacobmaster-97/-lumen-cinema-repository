# Active Session

## Current milestone

save-reopen-072：使用者按繼續後需要重建。基準5c6a46c，已重現歡迎畫面重載會pagehide覆寫主檔；v0.7.2已發布並核對公開版本及同SHA。

## Implemented

先還原再歡迎，讀取前／錯誤檔案禁止暫時新局自動寫入。明確新局及恢復前先備份；預覽較早備份後才確認恢復，取消／備份寫入失敗不改進度。引擎／v2／財務／地圖／PNG與0.7.1效能修正保持。Safari實際原檔未讀取。

## Verification

原版真實重現4區域→0、44792.04→68000、日期2→1，baseline.json。77項Node與8項存檔瀏覽器流程通過，完整／iPad觸控回歸、CI與公開結果見production/verification/v0.7.2。不是因為需每日重建，不推測沒有資料的最新進度。

## Documentation Impact

- Decision: updated
- Documents: docs/save-recovery-v0.7.2.md, docs/architecture/README.md, docs/github.md, design/gdd.md, production/timeline.md, production/session-state/active.md, CODEX_HANDOFF.md, DEBUG_HANDOFF.md
- Reason: 已確認瀏覽器啟動／離頁覆寫原存檔，新增安全讀取及明確較早備份恢復流程；記錄原始重現、資料保留界線及發布。工具分類器未涵蓋prototypes/browser，這是手動擁有文件判斷。

## Release / recovery

原main Pages，0.7.2快取版號，來源2434fcf437d5cd90180c9a457985c490ce61364c，測試44049651507及Pages44049651443成功。公開0.7.2／SHA一致，9項常規與8項存檔流程通過；HTTPS經平台CA驗證後原樣轉交Chromium，未停用TLS、未以本機替代。證據deployment.json／public.json／save-reopen-public.json。後續[skip ci]僅驗證與QA文件，不改公開功能來源。回退revert功能提交再發布，保留lumen-cinema-v2及所有備份。歷史未追蹤美術不加入。

## Risks / next safe task

公開存檔流程已核對，下一步用戶iPad試玩。使用者iPad既有資料是否已覆蓋未知，較早備份只能恢復該時間點；無有效備份不自動重建或補錢。
