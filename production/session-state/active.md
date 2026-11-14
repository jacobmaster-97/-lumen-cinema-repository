# Active Session

## Current milestone

光影大亨 v0.3 及設計工具已上線。本輪已推送 b42d07ff075ef802f00fc83a86830b19f371cb87，測試與 Pages 工作流程成功。新的可玩地圖與建造／擴建仍待整體設計確認。

## Current design review

- 最新零基底方塊位置：影廳1 (2,4)、影廳2 (5,3)、售票 (5,5)、小食 (6,5)、洗手間 (3,6)。
- 使用者已確認洗手間入口向右。design/art/selected-layout-v2/confirmed-config.json 為目前配置，selected-config.json 保留原始匯出。
- 真正起始地板只有 (6,6)，所有房間 initial=false；完整規劃預覽展開全圖，房間位置不代表開局啟用。
- /design/、/map-preview/、/layout-editor/ 已接入 Pages 打包；編排器新開預設同步已確認配置，已有儲存仍保留。遊戲主頁提供另開分頁連結。
- 本輪 GitHub 及 Pages 部署已完成驗證。建造／擴建玩法、家具導航及存檔整合尚未實裝，沒有改動既有財務或遊戲地圖。
- 27 項遊戲測試、本機子路徑瀏覽器及公開網址通過；公開設計版號與 b42d07f 一致，見 production/verification/design-pages 的 local.json、public.json、deployment.json。
- 工作流程：測試 43535976756、Pages 43535976626，均 success。後續僅交接文件提交使用 [skip ci]，公開設計來源維持 b42d07f。

## User decisions

- 32-bit 年代像素，現代香港，等角視角。
- 取消獨立候場區；影廳要有高度，可重排地圖。
- 使用 32×34 格立體影院，8 排高台、每排 +0.3m、後排 +2.1m、淨高 5.2m；低位側門入場。
- 保留正常速度 180 秒、自動營運、可選小遊戲提高收益、不可跳事件、物業買斷及兩店直接管理。

## Implemented

- gamestudio 專案本地安裝：.agents/skills/gamestudio；上游 commit 42838f2a4df97f77104a4c7a9561a4f6c9160621。
- 新的幾何／導航、緊密邊界深度圖層快取、實際貼圖、角色、座位、投映及區域操作。
- 16 款物件來源、16 格角色姿勢、20 張電影插畫、地板及影廳材質；原始來源未程式修圖。
- 裝修及小食新增設備，座位容量與畫面一致。
- 介面、觸控尺寸、縮放拖曳、失敗重試及可選提示音。
- 所有原有營運／經濟及 v2 schema／存檔鍵保持；使用前版產生的存檔 fixture 驗證相容。

## Verification

- npm test --prefix prototypes/browser：27 / 27 通過。
- node scripts/verify-cinema-browser.cjs：18 項真實 Chromium 流程通過，console errors=[]。
- 三種小遊戲、營業、定價、可視升級、舊檔、兩店資料、日結與下一日、載入後離線存讀檔均已驗證。
- 1440×1000 暖機 CPU 繪製 p95 約 10.5ms，初次圖層建立約 401ms，約 58MiB 快取／店。
- 390×844、720×1280、1080×2400 模擬觸控檢查無頁面橫向溢出。手機實機、長期經濟節奏仍待真人試玩。
- 遠端測試 run 43375605633 與 Pages run 43375605632 均成功；公開 version.json 確認 v0.3.0、來源 9a55adcf4ab1b4316ecf615668ac23aba1556307。
- 公開版六張 runtime 圖片均 HTTP 200；實際開始營業、33 人入場、48/40 席、後排樓層點選及導航正常，errors=[]。證據見 production/verification/v0.3/public.json、deployment.json。

## Architecture / key files

- engine.mjs 為唯一財務權威；world.mjs 為幾何、底座及導航；scene.mjs 為分層快取；render.mjs 為動態呈現；game.mjs 為操作。
- src/assets/cinema/runtime/manifest.json 為 v0.3 素材與地圖來源。
- CODEX_HANDOFF.md、design/rebuild-v0.3.md、src/assets/cinema/runtime/source-notes.md 記錄規格及交接。

## Documentation Impact

- Decision: updated
- Documents: docs/github.md, design/tools/layout-editor/README.md, production/session-state/active.md
- Reason: 使用者要求接入 GitHub，新增公開預覽／編排器與 Pages 打包入口；記錄相對依賴、已確認配置及保留可玩遊戲契約。

## Release and recovery

現有網址：https://jacobmaster-97.github.io/-lumen-cinema-repository/ 。部署前 main 起點 c6511c2cd4d24e7bc9b6ca3117dbea5155c8d9f1。

使用既有 Pages workflow，已確認來源 commit、workflow 成功及公開 version.json。後續交接紀錄使用 [skip ci] 文件提交，公開遊戲仍以 9a55adc 為版本基準。回退使用 revert 本輪發佈 commit 後重新部署；不改 v2 存檔格式，不清除玩家進度。
