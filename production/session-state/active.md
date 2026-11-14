# Active Session

## Current milestone

modular-map-pages-04：依使用者明確指示，把已編排配置接入正式遊戲並更新原GitHub Pages。v0.4可玩實作完成，正在驗證及部署；不是只更新預覽。

## Confirmed design

7×7方塊，每塊8×8世界格，初始只(6,6)地板、所有房間未建。位置：影廳1(2,4)2×2向右，影廳2(5,3)2×2向左，售票(5,5)與小食(6,5)1×1向下，洗手間(3,6)1×1向右。無後勤室及候場區。8排影廳後排2.1m、淨高5.2m。180秒自動營業、可加速不可跳事件、物業及兩店保持。

## Implemented

- map-data／construction／map-world 是正式配置、施工規則及幾何；新局逐格鋪地，完成基本四區才開業。
- 每格$400；首輪15步指引$30,400，完成12格四區，$68,000剩$37,600。全圖49格五區共$65,200。數值待試玩。
- 三張整區PNG原圖進runtime，地面錨點、牆及櫃枱前後拆層；人物、門、家具碰撞及各排階梯可達。
- 未完成第二店不阻止原店營業、不收營業成本；未建影廳不可排片。
- v2舊檔缺map轉為已完成49格五區，保留財務／物業／兩店／座位升級，UI先備份原始存檔。新圖存檔連通及門驗證。
- 公開設計工具保留，hub文字更新為已正式實裝；0.4版號與整個模組依賴圖快取更新。

## Verification

41項Node測試通過。真實Chromium整合腳本 scripts/verify-modular-browser.cjs：14條實際按鈕施工、完整開業／日結、舊檔、離線、390／720／1080觸控及失敗回復通過，errors=[]，暖機CPU繪製p95為8.3ms。Studio validate 1207項及docs-impact通過。證據輸出 production/verification/v0.4 及 docs/screenshots/v0.4-*。本輪發佈驗證完成後補上公開版本與workflow來源。

## Documentation Impact

- Decision: updated
- Documents: design/rebuild-v0.4.md, design/gdd.md, docs/github.md, production/timeline.md, production/session-state/active.md
- Reason: 正式地圖、開局施工與建造費、未完成分店、整區貼圖、舊存檔轉換、版本及部署皆為玩家可見變更。

## Risks / next safe task

真人手機、長期經濟及日長未驗證；以公開版本試玩調整。DEBUG_HANDOFF.md未建立：沒有反覆修正仍未解的程式缺陷。部署沿用原main workflow，可revert本次功能提交重發；不清除玩家資料。
