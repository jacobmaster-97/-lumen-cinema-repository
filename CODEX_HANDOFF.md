# CODEX_HANDOFF

## Project Goal

依使用者從編排器交回的五區座標更新實際像素設計預覽；真正開局仍一塊地板、所有區域 initial=false。確認後才實裝。

## Current Phase

- Phase: published design tools；等待整體設計／實裝下一步。
- Status: 已推送 b42d07ff075ef802f00fc83a86830b19f371cb87 至現有 main 並成功部署 Pages。公開 /design/、/map-preview/、/layout-editor/ 已驗證；洗手間向右，真正開局 1 塊、0 房間，五區入口可達。
- 本輪授權公開設計工具及預覽。新的可玩地圖、建造／擴建及經濟規則仍待整體設計確認，不在本輪修改。source confirmed-config.json 保留使用者已確認方向。

## Latest Completed Work

- scripts/build-pages.mjs 新增 /design/、/map-preview/、/layout-editor/ 及 /design/version.json，重寫副本相對路徑，支援 repository 子路徑；不依賴工作區檔案。
- 編排器新開預設同步已確認五區位置與洗手間向右；保留已有的本機編排儲存。遊戲主頁可另開分頁前往設計工具。
- 最新零基底座標：影廳1=(2,4)、影廳2=(5,3)、售票=(5,5)、小食=(6,5)、洗手間=(3,6)，大小及方向保留。
- 洗手間入口向右已獲使用者確認，世界門座標 [32,52]、entrySide=right。其餘房間座標／大小／方向及開局設定完全保持。
- map-confirmed.png、plan-confirmed.png、review-confirmed.png 是目前版本，五區入口均可接通。向下原案只作歷史比較；方向不再待確認。
- 影廳的左右方向保留，精確門位置放在銀幕低位，避免高台側門懸空；編排器只指定側別，未指定門沿牆座標。
- cinema-layout-editor.html：26KiB 互動元件，拖放及手機先選再點、行列輸入、方向鍵、越界／重疊／起點保護、入口方向、開局啟用、地板筆刷、只看開局、復原／重做。
- index.html：同一元件的單檔獨立版，build.mjs 可重建。自動本機儲存、對話 widgetState、JSON 複製／下載／安全匯入，以及使用者主動按鈕把配置交給 Codex。
- 規劃房間與開局區分開；啟用才加入開局並補地板，入口有方塊級連通檢查。沒有改動正式遊戲存檔或部署；交接按鈕也明確要求先更新設計，確認後才實裝。
- design/art/modular-map-v2：單塊起點、首間影院成形、全圖完成的實際素材地圖及平面截圖；滑桿逐塊檢視、下一塊按鈕及 QA。
- v1 的一廳開業、預先鋪好十字通道及固定正中前方入口已被取代；新入口在初始右下角方塊外側。等角圖的前端對應平面右下角，平面配置有清楚標示。
- 每次擴建只增一塊，須共邊接到已鋪地板；未開發格不能行走。通道隨擴建形成，全圖完成不再有待購空地。影廳四塊及外側入口齊備後才繪製完成房間。
- 第一塊屬開業前建造階段；初始資金或免費建造額度須足夠完成基本影院，數額、土地／買斷關係尚未實裝。
- design/art/integrated-zones-v2：售票（雙服務位、自助機、電影牆）、小食（雙服務位、集中後吧）、洗手間（兩廁格與雙盆）。
- 所有設備、地面與牆身按整區設計，統一墨綠／深藍、酒紅、象牙及黃銅配色；沒有候場座位。
- v1/staff.png 已刪除，v1 其餘三張只為修改來源。v2 才是本次確認版本。
- preview.html 以三張原始 PNG 的地面錨點，放置到相同尺寸的四邊形格網；review.png、review-grid.png 可直接檢視。

## Scope / Ownership

- 遊戲狀態、經濟與存檔：prototypes/browser/engine.mjs，維持 v2 schema 及儲存鍵。
- 遊戲介面與事件：prototypes/browser/game.mjs；新地圖呈現及導航分開實作。
- 已上線地圖基準仍為 32×34 格、48/40 席；新方案提議完整 56×56 格地盤與 16×16 格影廳，不可混為已上線狀態。
- 新角色及海報使用 ImageGen 真正來源圖集；已完成 v3 物件及材質會進入 runtime。
- 預設 180 秒營業日，排片、價格、事件、小遊戲、物業及兩店直接管理保留。

## Verification Required

- 既有模擬與 UI 回歸，舊存檔載入及兩店操作。
- 新地圖碰撞、樓梯升降、座位容量與升級可視化。
- 瀏覽器實際遊玩、控制、存讀檔、console、窄螢幕及效能。
- Pages build、遠端 commit/workflow、公開網址版本與素材。

## Release / Recovery

- Repository: jacobmaster-97/-lumen-cinema-repository；main 起點 c6511c2cd4d24e7bc9b6ca3117dbea5155c8d9f1。
- GitHub Pages: https://jacobmaster-97.github.io/-lumen-cinema-repository/
- Design release: b42d07ff075ef802f00fc83a86830b19f371cb87；測試 run 43535976756、Pages run 43535976626 均成功。公開 design/version.json 與來源一致。後續僅文件提交使用 [skip ci]。
- Released code: 9a55adcf4ab1b4316ecf615668ac23aba1556307；測試 run 43375605633、Pages run 43375605632 均成功，公開 version.json 與該 commit 一致。
- 使用原 Pages workflow。保留舊存檔；失敗時可回退本輪 release commit，由相同 workflow 重新部署。

## Known Risks / Next Safest Task

公開設計工具／預覽及主頁連結已部署驗證。整體新地圖的可玩實裝仍待確認；家具導航、素材拆層、擴建存檔與經濟尚未實裝。下一步依使用者決定接入可玩版本。DEBUG_HANDOFF.md 未建立：沒有經反覆修正仍未解的程式缺陷。

## Verification Evidence

- production/verification/design-pages：27 項遊戲測試、8 組本機子路徑流程、遠端兩個成功 workflow，以及公開版本／預覽／編排器／原遊戲驗證。public.json 的 errors 及 failedRequests 均為空。
- selected-layout-v2/qa-confirmed.json：僅 toilets.door 由 south 改為 east；其他配置一致，預覽預設向右，五區入口均可達，console errors=[]。
- selected-layout-v2/qa.json：來源雜湊、五區新座標／尺寸比對，無重疊或越界，起始 1 塊及 initial=false 保留；原入口開出邊界偵測、左右替代方案五區連通、49 步相鄰擴建及瀏覽器預覽。
- 編排器：真實 Chromium 完成拖放、重疊／越界、筆刷、入口、復原／重做、鍵盤、觸控、JSON 下載／匯入及失敗原子性、本機儲存、離線、320px、對話沙箱／widgetState／交接訊息內容檢查；證據見 design/tools/layout-editor/qa.json。
- 本次方案 B：初始一塊、零房間及零預建通道網；49 次地板狀態中的新增方塊均共邊相連、無重複；房間齊塊及入口已連接；最終 49 塊全開發、38 塊為走道地板。證據：design/art/modular-map-v2/qa.json。這不是家具／座位級導航驗證。
- 本次：三張 RGBA PNG 的尺寸及 SHA256 已記錄；真實 Chromium 預覽顯示三區、沒有後勤室，格網切換及截圖完成，errors=[]。證據：design/art/integrated-zones-v2/qa.json。
- 先前僅設計階段未部署；本輪新增公開入口及打包，已重新執行 27 項測試並成功部署，證據以 design-pages 為準。
- 已上線 v0.3 的既有基準：npm test --prefix prototypes/browser 27/27；node scripts/verify-cinema-browser.cjs 18 player paths, no browser errors。
- production/verification/v0.3/browser.json: 1440×1000 desktop; 390/720/1080 touch layouts; old save, all minigames, day close, offline controls.
- production/verification/v0.3/deployment.json / public.json: 成功的遠端 workflow 與公開網站實測。公開瀏覽器透過平台 CA 驗證的 HTTPS APIRequestContext 載入遠端回應，保留 TLS 驗證，避開雲端 Chromium 獨立憑證庫的代理 CA 限制；未替換成本機遊戲檔案。
- Source map/art are in src/assets/cinema/runtime; world/scene/render own geometry, cache and animation.
