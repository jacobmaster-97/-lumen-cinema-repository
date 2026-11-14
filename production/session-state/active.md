# Active Session

## Current milestone

光影大亨 v0.3 已上線；使用者現要求接入 GitHub。本輪公開已確認配置、像素設計預覽及拖放編排器，使用既有 main／Pages workflow。新的可玩地圖與建造／擴建仍待整體設計確認。

## Current design review

- 本輪發佈 /design/、/map-preview/、/layout-editor/ 及設計版號。遊戲主頁新增另開分頁入口，財務、存檔及既有可玩地圖不變。
- build-pages.mjs 打包最新三張區域圖及相對依賴，編排器預設同步已確認配置；已有儲存仍保留。
- 待本機及遠端工作流程、公開設計版號與瀏覽器驗證後，再宣稱部署成功。
- 使用者最新已確認洗手間入口向右。selected-layout-v2/confirmed-config.json 為目前配置；原始 selected-config.json 留作紀錄。僅 toilets.door 改 east，所有位置及單塊開局不變。
- 預覽預設向右，map-confirmed.png／plan-confirmed.png 為目前畫面；五區入口連通，方向不再待確認。以下「方向待確認」只屬先前脈絡。
- 仍未實裝遊戲或更新 Pages；下一步確認整體像素地圖再實裝。
- 最新來源為使用者第二次貼上的 JSON：design/art/selected-layout-v2/selected-config.json，零基底位置為影廳1 (2,4)、影廳2 (5,3)、售票 (5,5)、小食 (6,5)、洗手間 (3,6)。所有初始旗標仍 false，地板只有 (6,6)。
- 新版像素／平面預覽已按新座標重排。房間無重疊或越界；洗手間向下入口的外側為 (3,7)，超出地圖，與舊版撞影廳的問題不同。
- 保留原方向，另比較向右／向左，不移動區域、不覆寫來源；兩個比較方向均可接通五區走道。入口方向仍未獲確認，遊戲與 Pages 未改動。
- v2 取代下列 selected-layout-v1 的座標脈絡，後續工作應以 v2 為準。
- 最新像素預覽：design/art/selected-layout-v1。來源 selected-config.json 精確保留五區座標與 initial=false，實際開局只有右下角一塊地板。
- 零基底方塊位置：影廳1 (2,5)、影廳2 (5,2)、售票 (5,4)、小食 (6,4)、洗手間 (3,4)。完整規劃／開局／擴建及方向比較已組裝。
- 原洗手間向下入口對到影廳1，是未來全圖規劃衝突；開局尚無啟用區，所以原編排器 validation 無錯。原案保留並標示，向右／向左兩個比較方案不移動房間、不覆寫原來源。
- 已詢問使用者洗手間方向；回答前未採納任何修正方案。左右比較的五區入口均可達；方塊級檢查不等於最終家具導航。
- 最新交付：design/tools/layout-editor，可拖動五區、方格吸附、防重疊／越界、地板筆刷、入口方向、開局啟用、只看開局、復原／重做及 JSON 配置匯出／匯入。
- 預設規劃位置沿用方案 B；真正開局只有右下角一塊地板，所有區域預設不啟用。使用者可在工具內自行調整；不把拖動規劃區誤當成已修改遊戲開局。
- 元件在對話內使用；index.html 為無外部依賴的單檔版本。可儲存本機及 widgetState，也可由使用者主動把配置交回 Codex；該訊息仍保留先更新設計、確認才實裝的邊界。
- 真實瀏覽器已驗證拖放、觸控、鍵盤、匯入匯出、儲存及對話沙箱；qa.json、editor-default.png、editor-mobile.png 為證據。下一步接收使用者選定配置，再更新實際像素預覽。
- 最新方案 B：design/art/modular-map-v2，右下角第 7 行第 7 列只有一塊 8×8 地板起步；預留通道也逐步鋪設，不預建整幅十字通道。
- 玩家向共邊相鄰方塊逐塊擴建；全圖最終 49 塊完成，未放房間的方塊全部為地板／走道，不保留「待購空地」。
- 初始零房間、屬開業前建造；資金／免費建造額度須足夠完成首輪營業，未實裝財務、開業、存檔或新擴建規則。
- 1–49 塊滑桿及下一塊、起點／18 塊首影院／49 塊整圖的實際像素預覽及平面配置已完成。每步共邊連接、無重複、初始狀態及全圖完成已檢查；詳細見 v2/qa.json。
- 下列方案 A 是上版脈絡；「一廳起步、預建十字通道」已被方案 B 取代，不能當成最新要求。
- 最新要求：刪除後勤室後重排整間戲院，採完整大方形地圖，容許逐個方塊區域擴建。
- design/art/modular-map-v1 為最新整體方案：7×7 方塊（56×56 格），8×8 格服務區、2×2 塊影廳、永久主通道及橫向通道。
- 可切換一廳開業／第二廳擴建、顧客動線、格網與放大，使用實際生成區域 PNG、原有座椅／材質及新階梯幾何。
- 本方案提議一廳起步，四塊齊備才建第二廳；尚未改動已上線兩廳開局。遠端地塊須先接支路，主通道不可堵塞。
- 圖面已檢查方塊對齊、正方形、無重疊、入口及通道連通、4/5 條階段路徑；完整家具碰撞、擴建存檔與經濟仍未實裝。下一步等使用者確認整體方案。
- 新要求：刪除後勤室設計，每區以方塊為單位，完整四邊形。
- design/art/integrated-zones-v2：售票、小食、洗手間三張一體化 RGBA PNG；統一 8×8 格正方形底面作確認方案，2:1 等角視角。
- preview.html 展示三區相同地面比例及可切換格網；review.png / review-grid.png 為真實瀏覽器截圖。
- 已刪除 v1/staff.png；沒有從已上線遊戲移除房間，等待設計確認後才改動地圖。
- 本次預覽三區載入、沒有後勤、格網切換及 console errors=[] 已驗證。qa.json 記錄尺寸／雜湊及待完成項目。
- 下一步：使用者確認造型及區域佈局，再清理透明邊緣、拆分遮擋層、對齊入口與碰撞；不可把設計原圖當成已完成 runtime 匯入。

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
