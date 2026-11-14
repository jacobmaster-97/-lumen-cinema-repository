# 光影大亨瀏覽器版 v0.5

ES modules + Canvas 2D，可直接靜態部署。使用現有經營模擬及 v2 存檔，重製像素貼圖、階梯影廳、客流、介面及地圖操作。

在 repository 根目錄：

```sh
npm ci --prefix prototypes/browser --ignore-scripts
npm test --prefix prototypes/browser
node scripts/build-pages.mjs
python3 -m http.server 8000 --directory dist/pages
```

`http://localhost:8000` 為遊戲，`art.html` 為實際素材檢視器。建置只攜帶遊戲、圖片與靜態資源，不需要 Node.js 作網站執行環境。

## 檔案責任

- engine.mjs：確定性經濟、日期、需求、排片、事件、投資與存檔。
- game.mjs：DOM 操作、管理頁、小遊戲與進度保存。
- world.mjs：底座貼合、升級座位、高度與不可跨越家具／高台的導航。
- scene.mjs：靜態像素幾何與緊密邊界圖層快取。
- render.mjs：相機、走動與入座角色、員工、區域狀態及電影投映。
- assets.mjs：預載與角色去綠幕，來源圖片不改寫。
- audio.mjs：使用者啟用後的 Web Audio 提示音，預設關閉。
- studio.css：v0.5 主題與響應式佈局；game.css 保留其餘營運頁的既有結構。

素材來自 src/assets/cinema/runtime/manifest.json，正式地圖來自 map-data.mjs。construction.mjs 負責逐格施工及連通，map-world.mjs 產生正式幾何。早期 Godot .tres 與圖片仍在原路徑，不冒稱瀏覽器遊戲由 Godot 執行。

## 玩家操作

新局只有右下角一塊地板，先按底部指引或7×7施工格網鋪地，建好售票、小食、洗手間及一廳。安排排片／價格／人手後開始營業；可 1×、2×、4× 及暫停。突發事件可交員工或親自玩 20 秒小遊戲。開始新日需玩家操作，不能跳事件。

地圖可拖曳及按鈕縮放，鍵盤焦點在地圖時可用方向鍵、加減號及 0；區域按鈕亦可鍵盤操作。手機預設拉近，可按全景還原。

## 驗證

55 項 Node 測試；另外使用 scripts/verify-operations-browser.cjs 執行真實 Chromium 流程，結果及截圖在 production/verification/v0.5/ 與 docs/screenshots/。DOM Canvas mock 不當作視覺證據。

只暴露唯讀 window.__lumen.getState() / getDiagnostics() 供重複 QA；沒有修改遊戲狀態的測試後門。


v0.5：operations.mjs為每分鐘客流、服務、退款及清潔權威；operations-world.mjs為狀態對應的碰撞路徑；operations-ui.mjs為即時狀態及預測面板。engine.forecastProgramme在副本執行同一規則且排除事件；編輯器未儲存方案不修改資金及排片。新營業日初始化flow.version1；舊營業中v2存檔沒有flow時沿用舊結算至日終，下一日切換，避免重算已結算的票房。升級設計素材只放在獨立/upgrade-art/，不能加入runtime manifest。
