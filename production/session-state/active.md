# Active Session

## Current milestone

operations-forecast-pages-05：使用者要求製作第一項真實客流／排隊／員工服務、第二項排片收益預測，第三項只預製升級貼圖，確認後才接入遊戲。本輪以46d0533為基準，已發佈並驗證v0.5.0（來源e5aad16e6f287a5268d489e534bdf6ed1c507102），保留已確認地圖、建造及既有進度。

## Implemented

- operations.mjs的逐分鐘客流是實際交易、入座、流失、散場及清潔權威；renderer使用其人物ID／狀態，密集人流抽樣但面板精確。兩店共時、各自隊伍及員工。
- 票／食品在服務時計帳，入場另計；取消退款一次、片商換片修正抽成。排隊耐性、滿座、延誤、停映／維修皆可追溯。散場4分鐘後清潔，清潔不及會延遲下一場。
- engine.forecastProgramme在副本上跑同一規則及3個客流seed，不含事件／還款／投資。排片列表顯示每場客群、入座、分帳、毛利及全日淨利；表單未儲存方案即更新。依時間／影廳固定次序分配需求，避免只打開編輯器就改變預測。
- 新營業日flow.version1；原v2營業中存檔無flow則保留舊結算至日終，下一日進入新系統；不重算已結算收入。客流存檔驗證人數、金額、ID、階段及座位一致。
- design/art/upgrades-v1兩張ImageGen原PNG、12個裁切、規格及獨立確認頁；售票／小食三級整區、三級獨立椅子及三級影廳外觀參考。runtime manifest不引用、正式遊戲不請求新圖，確認後才校準拆層及實裝。

## Verification

npm test --prefix prototypes/browser：55項通過。新增14項財務／客流／存檔／預測／實際路徑測試，原41項保留。scripts/verify-operations-browser.cjs的15條實際UI／營業日預測對帳／真實狀態／存讀檔／觸控／美術流程通過，errors=[]、暖機CPU p95 6.7ms。實際首日淨利7309.04與預測一致。補充3個尺寸手機捲動提交及原檔備份、無小食員工時親自支援均通過。證據production/verification/v0.5。

## Documentation Impact

- Decision: updated
- Documents: design/operations-v0.5.md, design/gdd.md, docs/github.md, production/timeline.md, production/session-state/active.md
- Reason: 票房由開場批次結算改成實際服務、加入排隊／清潔狀態、預測及存檔相容，第三項美術需保留確認邊界，更新部署版號與證據。

## Release / recovery

沿用jacobmaster-97/-lumen-cinema-repository及Pages workflow，0.5.0統一模組快取版號。來源e5aad16e6f287a5268d489e534bdf6ed1c507102，測試43549699236及Pages43549699308均success。公開6項檢查通過，errors及failedRequests為空，runtimeArtRequests為空；公開版號與SHA一致，見deployment.json／public.json。後續[skip ci]文件提交不改公開來源。必要時revert功能提交重發，不清存檔；新flow營業中存檔不能直接交舊結算，以免重複計票；UI讀舊檔／首日開業前會留lumen-cinema-v2-before-flow-v1備份。必要回退先保留現存檔並恢復這個升級前備份。

## Risks / next safe task

手機實機、長期經濟及新服務率仍待真人試玩；現有3分鐘日長不改。升級美術錨點／前景拆層／腳托碰撞仍待確認後處理；未實裝。DEBUG_HANDOFF.md未建立，無反覆未解缺陷。下一步完成公開驗證，讓使用者確認12項美術外觀並試玩營運。
