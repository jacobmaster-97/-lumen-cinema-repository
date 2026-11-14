# CODEX_HANDOFF

## Project Goal

實作第三套分項滿意度／漸進影院定位，以及第四套設備損耗／預防維護／現金管理，更新原Pages。升級貼圖使用者不滿意，保留暫存未採用，本輪不能實裝或再要求確認。

## Current Phase

- Phase: v0.6 playable release verification。
- Status: 已發佈並核對公開v0.6.0，來源7e570aef888892f7809b3a81f2f585acf378d1b3。基準57df4b4。

## Latest Completed Work

strategy.mjs為四項體驗、定位／六類回訪、清潔標準、損耗與保養規則；strategy-ui.mjs為「口碑與維護」。engine／operations負責實際收支、退款、事件、預測、相容；operations-world／render讓停用影廳的客人等在廳外。

實際入場才記錄價格、等候、清潔及觀影品質，退款移除體驗、換片修正片種類別。定位按入場組合逐日移動15%，可混合經營。快速／標準／深度清潔在時間／潔淨度／耗材取捨。設備依放映與使用量損耗；保養$900／60分／18點，檢修$2400／180分／55點，上限100；預付、時段衝突、完成恢復、未完成退款，整日無放映也可保養。

保養預付在ledger.maintenance記一次（preventive是其中分項），耗材實際清潔時扣，日結只扣新增固定維護。故障中斷影廳及退款，與事件共用每店最多兩次停頓且有平靜日。現金預留含人工、租金、固定維護及貸款；不阻止玩家自主投資。

保留v2外層；strategy.version1及flow.strategyVersion1。舊營業中先沿用當日規則，下一日啟用；原始舊檔備份before-strategy-v1。原PNG／地圖及180秒日長保持。未採用美術改標暫存，沒有加入runtime。

## Verification

- npm test --prefix prototypes/browser：73／73（原55＋18）。逐分鐘對帳、評價／定位、維護時段／退款／整日保養、故障、預測、存檔與兩店。
- scripts/verify-strategy-browser.cjs：11條真實Chromium流程通過，errors=[]、未請求暫存美術。自然日結6292.04與預測一致，評價及設備狀況均來自實際營運。390／720／1080觸控預約無頁面溢出，CPU p95 7.1ms、34MiB首店快取。
- 故障彈窗缺少片名的重現已修正，真實urgent按鈕可用。沒有反覆未解缺陷，DEBUG_HANDOFF未建立。
- 證據production/verification/v0.6；公開6項檢查通過，errors=[]、failedRequests=[]、runtimeArtRequests=[]；包含版號／SHA、施工與策略頁、保養與退款、預測成本、真實評價／損耗及未採用圖隔離。

## Release / recovery

https://jacobmaster-97.github.io/-lumen-cinema-repository/ 。沿用main Pages workflow與0.6.0快取。功能來源7e570aef888892f7809b3a81f2f585acf378d1b3，測試run43553784471與Pages run43553784527均success，公開version.json同SHA；見production/verification/v0.6/deployment.json／public.json。公開頁由保留TLS驗證的即時HTTPS回應轉交Chromium呈現，未用本機檔案替代。後續[skip ci]交接提交不改公開功能來源。必要時revert功能提交；先保留最新檔，再視需要恢復before-strategy-v1備份，不刪玩家進度。歷史未追蹤草稿不屬本輪，避免blanket git add。

## Risks / next safe task

真人手機及長期經濟／回訪／保養節奏待試玩；故障風險不等於必然事件，預測不含突發事件。讓使用者試玩「口碑與維護」，觀察長期定位、清潔及保養取捨。升級美術未採用，保持不實裝。
