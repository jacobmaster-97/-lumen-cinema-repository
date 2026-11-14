# 光影大亨 · Lumen Cinema

現代香港像素戲院經營遊戲。安排電影、票價同人手，觀察戲院自動營業；遇突發事件再決定親自救場，並用盈利升級、買斷物業及管理第二間分店。

[立即試玩 · GitHub Pages](https://jacobmaster-97.github.io/-lumen-cinema-repository/) · [遊戲框架](design/gdd.md) · [v0.4 地圖說明](design/rebuild-v0.4.md) · [目前交接](CODEX_HANDOFF.md)

[地圖設計入口](https://jacobmaster-97.github.io/-lumen-cinema-repository/design/) · [像素地圖預覽](https://jacobmaster-97.github.io/-lumen-cinema-repository/map-preview/) · [拖放編排器](https://jacobmaster-97.github.io/-lumen-cinema-repository/layout-editor/)

正式遊戲現已採用你編排的 7×7 方塊地圖，由右下角單塊地板起步，洗手間入口向右。按底部施工指引逐格建造，或在「建造及擴建」自行選格；基本四區完成即可開業。編排器保留作設計工具，新匯出不會自動覆寫遊戲。

![實際營業畫面](docs/screenshots/v0.4-running.png)

## v0.4 正式方塊地圖

- 售票、小食及洗手間採整區像素貼圖；取消後勤室及候場區。
- 7×7方塊、完整56×56遊戲格；只可擴建共邊相鄰地板，每次一格。
- 8排立體階梯座席，後排2.1米、影廳淨高5.2米；兩廳48／40席，建好才啟用。
- 20款電影海報、四方向角色及實際放映；客流經門口、家具及樓梯路徑移動。
- 新局$68,000；首輪指引施工$30,400，完成後可排片開業。日長及建造價格屬試玩值。
- 舊v2存檔自動轉到已完成的新地圖，保留現金、物業、兩店及升級，另留原始備份。

## 經營玩法

- 時間軸排片、電影片長及清潔緩衝、按場次定價。
- 六類客群、每週新片及逐步退熱；票房分帳與小食毛利分開呈現。
- 聘請、培訓、分配員工，系統自動排班及供貨。
- 正常速度一日 180 秒，可 2×／4× 加速，不能跳過事件。
- 售票、小食、清潔小遊戲可自行參與或交給員工；另有停映、謝票及維修事件。
- 裝修、音響、小食、座位、貸款、物業買斷及兩間分店直接管理。
- 每日收支報告、本機存檔與讀檔；所有分店共用日期與公司資金。

目前仍為可玩原型，經濟及日長待真人試玩調整。特別格式及完整影展屬後續內容。

## 本機啟動

遊戲沒有第三方瀏覽器執行依賴，需要 Node.js 24+ 作建置／測試，以及靜態 HTTP server。

```sh
git clone https://github.com/jacobmaster-97/-lumen-cinema-repository.git
cd -- -lumen-cinema-repository
npm ci --prefix prototypes/browser --ignore-scripts
npm test --prefix prototypes/browser
node scripts/build-pages.mjs
python3 -m http.server 8000 --directory dist/pages
```

開啟 `http://localhost:8000`。建置結果包含實際 PNG，不依賴開發用符號連結或外部 CDN。素材檢視器為 `/art.html`。所有素材載入後，可在斷網狀態繼續經營與本機存讀檔。

## 驗證

`npm test --prefix prototypes/browser`：41 項測試，包括財務／事件、DOM 整合、地圖、樓梯、升級容量、來源 PNG 及前版存檔相容。

真實 Chromium 流程使用：

```sh
python3 -m http.server 8192 --directory dist/pages
# 另開終端；需要環境提供 Playwright 及 Chromium
CINEMA_TEST_URL=http://127.0.0.1:8192/ node scripts/verify-modular-browser.cjs
```

本機真實瀏覽器檢查涵蓋按鈕施工、正式地圖營業／日結、離線存讀檔及390／720／1080像素觸控尺寸。證據見 [瀏覽器紀錄](production/verification/v0.4/browser.json) 及 [地圖說明](design/rebuild-v0.4.md)。DOM 測試與瀏覽器模擬尺寸不當作手機實機測試。

## 專案結構

| 路徑 | 內容 |
| --- | --- |
| `prototypes/browser/` | 遊戲狀態、介面、幾何導航、圖層及動態呈現 |
| `src/assets/cinema/runtime/` | 實際PNG、整區圖、裁切及錨點 |
| `src/scenes/asset_preview.tscn` | 保留的 Godot 貼圖放置測試場景 |
| `tests/cinema/` | 模擬、介面、地圖與相容性驗證 |
| `production/verification/v0.4/` | 瀏覽器與發佈證據 |
| `.agents/skills/gamestudio/` | 使用者指定安裝的 gamestudio skill |

Godot 來源與九件舊 AtlasTexture 仍保留；可玩瀏覽器版實際使用 ES modules + Canvas 2D，技術邊界見 [ADR](design/architecture-browser-prototype.md)。

## 工作流程及來源

基於 [merlinhu1/codex-game-studio](https://github.com/merlinhu1/codex-game-studio)，保留 Git 歷史、[MIT 授權](LICENSE) 及 [原始 Studio 說明](STUDIO_README.md)。

本輪安裝並使用 [guangyuspace/codex-gamestudio-skill](https://github.com/guangyuspace/codex-gamestudio-skill)，版本與安裝範圍見 [INSTALLATION.json](.agents/skills/gamestudio/INSTALLATION.json)。上游 skill 的 LICENSE、NOTICE 與來源界線一併保留；未使用其示例遊戲素材或背景多代理 runtime。

新美術來源及提示見 [source-notes.md](src/assets/cinema/runtime/source-notes.md)。

## GitHub Pages 發佈

推送 main 後，既有 workflow 會先測試，再將 `dist/pages` 部署到現有網址。`version.json` 提供版本與建置 commit。回退可 revert 發佈 commit 並重跑同一 workflow，無需刪除玩家 v2 存檔。
