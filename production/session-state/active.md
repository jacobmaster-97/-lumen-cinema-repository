# Active Session

## Current milestone

光影大亨 v0.3 像素可玩重製已在 GitHub Pages 發佈並驗證。使用者本輪明確授權安裝 gamestudio、重製遊戲／貼圖／地圖及更新現有 Pages。

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
- Documents: design/rebuild-v0.3.md, design/art/art-direction.md, design/gdd.md, production/session-state/active.md, production/timeline.md, docs/github.md
- Reason: 使用者授權實裝；新的遊戲呈現、地圖與素材、安裝的技能、相容存檔及發佈流程需以最終可玩版本記錄。

## Release and recovery

現有網址：https://jacobmaster-97.github.io/-lumen-cinema-repository/ 。部署前 main 起點 c6511c2cd4d24e7bc9b6ca3117dbea5155c8d9f1。

使用既有 Pages workflow，已確認來源 commit、workflow 成功及公開 version.json。後續交接紀錄使用 [skip ci] 文件提交，公開遊戲仍以 9a55adc 為版本基準。回退使用 revert 本輪發佈 commit 後重新部署；不改 v2 存檔格式，不清除玩家進度。
