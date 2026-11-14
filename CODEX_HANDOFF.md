# CODEX_HANDOFF

## Project Goal

實作第一項可觀察客流／排隊／員工服務及第二項排片收益預測，更新原GitHub Pages；第三項只預製升級貼圖及獨立確認頁，使用者確認後才能實裝。

## Current Phase

- Phase: playable prototype v0.5 release verification。
- Status: 可玩實作及本機驗證通過，正在推送／核對公開版本。基準46d0533，正式地圖及原runtime PNG保持。

## Latest Completed Work

- operations.mjs為逐分鐘交易、客人階段、服務速度、等候流失、退款與清潔權威；operations-world.mjs將真實客人ID／階段映射到合法路徑；renderer顯示實際隊伍、入座、散場與工作中的清潔員。繁忙時人物抽樣，面板精確人數。
- engine.forecastProgramme用相同規則在副本跑三個客流seed，顯示客群、入座、總票房／分帳／毛利、扣人工／租金／維護後淨利。排片表單預測未儲存方案，沒有修改資金／亂數／安排；同一排片換陣列次序不會改變預測。
- 新營業日flow.version1；舊v2營業中無flow則沿用舊結算至日終，下日轉換。UI讀舊檔／首次開業前留lumen-cinema-v2-before-flow-v1備份，既有備份不覆寫。逐筆收支、人物、ID、座位及工作資料有驗證。
- design/art/upgrades-v1為兩張原始ImageGen PNG及12裁切：售票／小食各三級整區、三級獨立座椅、三級影廳外觀參考。公開/upgrade-art/供放大及下載，runtime manifest沒有引用、遊戲沒有請求這批圖。錨點／前景拆層／旗艦腳托碰撞待確認後實裝，不冒稱已整合。
- 保留既有7×7地盤、單格開局、逐格建造、洗手間右門、180秒、事件、小遊戲、物業及兩店直接管理。

## Important Modified Files

engine.mjs（財務、預測與相容）、operations.mjs（營運）、operations-world.mjs（合法路徑）、operations-ui.mjs／game.mjs／studio.css（面板與草案預測）、render.mjs（真實人物）、build-pages.mjs（模組／獨立預覽及0.5快取）；新美術只在design/art/upgrades-v1。

## Verification

- npm test --prefix prototypes/browser：55／55通過；原41項保留，新14項包含逐分鐘對帳、退款／換片、服務及清潔效果、存檔、預測純度與順序穩定、全部實際路徑。
- scripts/verify-operations-browser.cjs：15條真實Chromium流程通過，errors=[]；390／720／1080觸控無頁面溢出。首日實際淨利7309.04與預測7309.04一致（交員工處理、無額外事件費用情境）。暖機CPU p95 6.7ms，34MiB首店快取。
- 新flow存讀檔、離線、舊檔兩店、實際排隊／散場／清潔快照、素材失敗及待確認圖不載入遊戲皆有證據。補充手機捲動提交與原始備份驗證在touch-submit.json。
- studio validate及docs-impact通過。證據production/verification/v0.5；美術來源規格在design/art/upgrades-v1。公開SHA／workflow待本輪上線後補齊。

## Release / Recovery

jacobmaster-97/-lumen-cinema-repository；https://jacobmaster-97.github.io/-lumen-cinema-repository/ 。原workflow，version.json為0.5.0及來源SHA。若需revert功能提交，先保留當前v2存檔，再恢復before-flow-v1備份；新flow營業中已逐筆計票，不能直接交給0.4舊批次結算。歷史未追蹤草稿不屬本輪，不要blanket git add。

## Known Risks / Untested Areas

真人手機／長期服務率及經濟平衡未驗證；預測不含事件／還款／新投資且非保證收入。美術仍須使用者確認，再做精確錨點、遮擋、腳托及容量核對。DEBUG_HANDOFF.md未建立：無反覆修正仍未解缺陷。

## Next Safest Task

完成公開版本核對；使用者試玩第一、二項並確認第三項12張素材的外觀。沒有第三項實裝授權前不要加入runtime。
