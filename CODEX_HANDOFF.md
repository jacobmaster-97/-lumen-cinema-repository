# CODEX_HANDOFF

## Project Goal

把使用者編排的地圖接入正式遊戲並更新現有GitHub Pages。使用者已明確授權實裝，不再停於設計預覽。

## Current Phase

- Phase: release verification of playable prototype v0.4。
- Status: 正式地圖、施工及存檔遷移已完成；已部署並核對公開Pages v0.4.0；來源76b65bb2af7ff56f1b3b1efddd8db46f3fd5b4bf。

## Latest Completed Work

- 7×7方塊（56×56世界格），新局只有右下角(6,6)地板，逐格相鄰擴建。
- approved座標與洗手間右門保持；無後勤室、候場區。售票／小食／洗手間三張整區PNG接入正式scene，影廳具8排高台與低位側門。
- 基本四區接通才可開業。每格$400，首輪15步施工$30,400，現金$68,000剩$37,600；全圖五區需$65,200。可自行選格，沒有隱藏預鋪走道。
- 未建影廳不可排片。未完工第二分店不阻塞原店且不收營業開支。
- v2舊檔缺map補全49格五區，保留財務／物業／分店／升級；原始舊檔先存lumen-cinema-v2-before-map-v1備份。外層schema2保持，新map子版本1。
- 現有180秒、事件、小遊戲、票房分帳、物業及兩店直接管理保持。

## Important Modified Files

prototypes/browser/map-data.mjs（批准配置）、construction.mjs（建造及連通）、map-world.mjs（幾何）、engine.mjs（財務／遷移）、construction-ui.mjs／game.mjs（操作）、world／scene／render.mjs（導航／快取／動畫）。src/assets/cinema/runtime/zones三張原PNG，manifest是裁切來源；legacy_layout只是舊版測試資料。scripts/build-pages.mjs處理相對路徑與0.4快取。

## Verification

npm test --prefix prototypes/browser：41項通過。實際Chromium腳本 scripts/verify-modular-browser.cjs：14條流程通過（施工／營業／日結、舊檔與離線、390／720／1080觸控、素材失敗），errors=[]，暖機CPU p95 8.3ms。Studio validate 1207項及docs-impact通過；證據production/verification/v0.4。手機主按鈕曾被固定高度column wrap擠出畫面，已以auto height／nowrap修正並真實tap驗證。公開6條檢查通過：版號／SHA、單格開局、施工、營業、洗手間右門、舊檔與兩店；errors=[]、failedRequests=[]。公開HTML／模組／圖片均來自保留TLS驗證的即時遠端HTTPS回應。

## Release / recovery

Repository: jacobmaster-97/-lumen-cinema-repository；Pages: https://jacobmaster-97.github.io/-lumen-cinema-repository/ 。本輪main起點6234b64；功能來源76b65bb，測試run43541664436與Pages run43541664482均success；公開version.json的SHA一致，證據production/verification/v0.4/deployment.json、public.json。後續[skip ci]交接提交不改公開功能來源。沿用Pages workflow，version.json記錄0.4.0與來源SHA。可revert本次功能提交重新部署，不清玩家存檔。歷史未追蹤草稿不屬本輪，不要blanket git add。

## Known Risks / Untested Areas

經濟及日長屬試玩設定；真實手機及長期多日平衡未驗證。DEBUG_HANDOFF.md未建立，沒有反覆未解程式缺陷。

## Next Safest Task

讓使用者於公開網址試玩施工、首日營業與擴建節奏，依回饋調整。
