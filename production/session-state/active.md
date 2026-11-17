# Active Session

## Current milestone

busy-cinema-perf-071：使用者回報iPad2×／4×營業卡頓。基準6abf971；v0.7.1本機驗證完成，待main Pages發布及公開同SHA核對。

## Implemented

靜態深度圖層按當前scene／scale快取，最多24MiB、手勢穩定後分批建立、超額回原繪圖，失效／dispose釋放。按scene座位索引及拼接路徑快取；診斷按需。大Retina地圖新增約125萬像素預算（DPR1至2），介面文字／CSS大小／觸控座標保持。真實人流、收入、營業日長、原地圖／PNG、v2及已確認手機介面不改；未採用升級圖不實裝。

## Verification

75／75 Node，11條實際Chromium流程、自然4×日結及舊v2／兩店／三種小遊戲、8尺寸、DPR2深色／多指通過。canvas快取11項檢查含顧客ID／stage一致、完整狀態不變、24MiB上限及失效／釋放。公平同場滿座p95直接15.4／16.9ms，cache6.8／5.8ms。iPad1024×768主迴圈2×／4×滿座最終p95 14.4／13.9ms（原41.3／46.4ms），記錄profile-live-ipad-final.json。33.3ms為30fps繪圖預算，非實機Safarifps保證。證據production/verification/v0.7.1；方法design/performance-v0.7.1.md。失敗人物快取方案撤回，DEBUG_HANDOFF已更新。

## Documentation Impact

- Decision: updated
- Documents: design/performance-v0.7.1.md, design/gdd.md, docs/architecture/README.md, docs/github.md, production/timeline.md, production/session-state/active.md, CODEX_HANDOFF.md, DEBUG_HANDOFF.md
- Reason: iPad營業卡頓修復涉及繪圖架構、記憶體預算、驗證及發布；記錄公平量測、失敗方案、保留玩法及實機限制。分類器未涵蓋prototypes/browser，這是手動browser擁有文件判斷，不以工具無功能路徑省略文檔。

## Release / recovery

原main Pages流程，0.7.1快取版號；CI／公開核對待完成，證據deployment.json／public.json。回退本輪功能提交再部署，保留玩家v2檔。歷史未追蹤美術不加入。

## Risks / next safe task

先完成公開同SHA核對，再請使用者iPad試玩2×及4×。Chromium模擬不能代表Safari／長時熱及耗電。
