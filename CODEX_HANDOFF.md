# CODEX_HANDOFF

## Goal / phase

使用者要求排片影片棒條可觸控拖曳。基準b6a8c62（公開0.7.2），v0.7.3已實作，待完整回歸、原main Pages與同SHA公開核對。

## Implemented

- schedule-drag：8px點拖分流、5分鐘吸附、完整片長開關門限制、跨廳拖放、預覽時間／文字錯誤、邊緣自動橫捲。只預覽，合法放手才權威提交一次。
- game綁定原validateProgramme／setProgramme，檢查重疊、清潔、保養、未建廳；一次儲存與預測更新，保留scroll／focus。render前destroy，pointercancel／第二指／Escape／blur／resize／隱藏取消。營業中保持鎖定。
- mobile-input略過棒條，使用受限相容click抑制；點按及鍵盤保留。mobile.css只加拖動中的樣式／提示；沒有新增永久說明、置中按鈕或地圖文字。
- build明確複製新模組，0.7.3快取；81項Node含模組及正式game接線，原生瀏覽器拖動腳本。引擎／經濟／v2／0.7.1效能／0.7.2存檔保護／地圖／PNG與未採用升級圖邊界不改。

## Verification

81 Node及14個原生Chromium拖動流程通過，含有效移動／換廳、文字衝突及資金／排片不變、清潔／保養／未建廳、取消／第二指、滑鼠／鍵盤、640×320背景滑動／邊緣捲動與保留視野、營業鎖定。移動中不重算預測，放手後寫入實際v2存檔。errors／failedRequests=[]。預覽截圖已目視核對。完整遊戲、8尺寸、DPR2與舊檔／恢復回歸見production/verification/v0.7.3；契約及UI審核design/timetable-touch-v0.7.3.md。

## Release / recovery

原https://jacobmaster-97.github.io/-lumen-cinema-repository/ main，0.7.3待發布／公開核對。必要時revert本輪功能提交再部署，不刪主檔或備份。原公開0.7.2來源2434fcf437d5cd90180c9a457985c490ce61364c。

只stage本輪檔案，歷史未追蹤美術／審閱稿不加入。gdd／timeline更新後refresh-context再validate；docs-impact分類器不識別prototypes/browser，手動記錄擁有文件。後續[skip ci]驗證提交不改公開功能來源。

## Risks / next safe task

完成完整回歸及同SHA公開拖動核對，再讓用戶iPad Safari試玩；Chromium原生觸控模擬不等同真機，未測實體觸控與輔助閱讀器。
