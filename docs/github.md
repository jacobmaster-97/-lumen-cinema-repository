# GitHub 與 Pages

使用者建立的實際 repository 為 jacobmaster-97/-lumen-cinema-repository，並選擇公開 Pages。沿用其名稱及公開設定，不改名。

本機 origin 指向該 repository，upstream 保留 merlinhu1/codex-game-studio 的原始歷史與 MIT 授權。

內容包括可玩原型、實際 PNG / Godot 資源、設計紀錄、測試及開發狀態。

## Pages 發佈

網址：https://jacobmaster-97.github.io/-lumen-cinema-repository/

main 推送會觸發 .github/workflows/pages.yml；先跑 41 項遊戲測試，再由 scripts/build-pages.mjs 產生 dist/pages 並部署。build job 只有 contents:read，部署 job 使用 pages:write 與 id-token:write。

遊戲主頁及貼圖工作台都使用相對資源路徑，適用於 repository 子路徑。正式發佈會複製 PNG 與 AtlasTexture 為一般檔案，不依賴 GitHub Pages 對符號連結的支援。

Sites 私人網站的原有受眾與設定不變。兩個網域的本機瀏覽器存檔互相獨立。

## 發佈狀態

repository 擁有者已啟用 GitHub Actions 作 Pages 來源。重試 run 43176907722 後，build 與 deploy 均成功，公開遊戲入口、程式模組、貼圖清單、兩張 PNG 與 art.html 均回傳 HTTP 200。

首次啟用時曾被 GitHub App 的 403 限制阻擋，現已由擁有者設定解決。之後更新 main 可由既有 workflow 自動測試、打包及發佈。

公開 Pages 無需 ChatGPT 登入；本機存檔按網域分開，不會自動承接 Sites 網站的進度。v0.3 已完成真實 Chromium 自動遊玩與公開網站營業驗證；手機實機及長期經濟平衡仍需真人試玩。

## v0.3 像素重製發佈

沿用現有公開 repository 與 Pages workflow。新增 world / scene / assets / audio 模組、studio.css 及 runtime PNG；Node 測試增至 27 項。scripts/build-pages.mjs 生成自足 dist/pages，並產生包含 GITHUB_SHA 的 version.json。

發佈來源 9a55adcf4ab1b4316ecf615668ac23aba1556307：測試 run 43375605633、Pages run 43375605632 均成功，公開 version.json 回傳 v0.3.0 與相同 commit。manifest、六張 runtime PNG 及公開版實際營業驗證通過。

本機真實瀏覽器驗證見 production/verification/v0.3/browser.json；公開驗證見 public.json、public-cinema.png，工作流程見 deployment.json。公開版由保留 TLS 驗證的平台 HTTPS 請求轉交 Chromium 呈現，以處理雲端 Chromium 獨立憑證庫的代理 CA 限制。必要時 revert 發佈 commit 後重新執行相同 workflow，v2 存檔格式不變。

## 地圖設計及編排器

使用者要求接入 GitHub，沿用現有 main 及 Pages workflow 發佈目前已確認配置、預覽及獨立工具：

- `/design/`：設計入口，連到預覽、編排器、JSON 及目前可玩遊戲。
- `/map-preview/`：selected-layout-v2 的像素預覽，預設洗手間向右；真正開局仍只有一塊地板、零啟用房間。
- `/map-preview/confirmed-config.json`：已確認配置，房間位置保留。
- `/layout-editor/`：單檔 HTML，預設採用已確認位置及向右方向；已有的本機編排儲存優先保留。
- `/design/version.json`：設計修訂及來源 commit，用於核對部署。

build-pages.mjs 只複製最新需要的三張區域 PNG、目前預覽及工具；調整發佈副本中的相對匯入，避免暴露或依賴工作區路徑。遊戲主頁增加獨立分頁入口，不改財務、存檔或可玩地圖。新的建造／擴建玩法沒有在此輪實裝。

已發佈來源 b42d07ff075ef802f00fc83a86830b19f371cb87：測試 run 43535976756、Pages run 43535976626 均成功。公開 /design/version.json 與來源一致，預覽座標／向右入口、單塊開局、編排器放置及 JSON 匯出、遊戲入口均通過驗證。

本機建置與子路徑驗證見 production/verification/design-pages/local.json；遠端工作流程及公開 HTTPS 瀏覽器證據見 deployment.json、public.json、public-map.png。公開瀏覽器用平台 CA 驗證的 HTTPS 請求載入遠端回應，保留 TLS 驗證。後續 [skip ci] 文件提交不改公開設計的來源版本。回退發佈 commit 可移除設計入口及新工具，既有 v2 存檔不受影響。

## v0.4 正式地圖接入

使用者澄清要正式遊戲採用已編排地圖，本輪已接入。根入口即為新地圖及逐格建造玩法，`/design/`僅保留工具入口；前節「未實裝」是先前設計版的歷史狀態。本版Node測試增至41項。

`map-data.mjs`同步已確認配置，洗手間向右；新局單格起步、施工後開業。三張整區PNG與地圖幾何／門／座位／導航在遊戲中實際使用，詳細規則見 design/rebuild-v0.4.md。舊v2存檔保留進度轉為已建完整地圖，並備份原始舊檔。

本輪驗證在 production/verification/v0.4：打包後真實Chromium測試、遠端workflow及公開HTTPS版本。version.json為0.4.0並記錄來源SHA；全部相對模組匯入附0.4版號。發布後補上來源及成功workflow，回退revert功能提交重跑相同工作流程。
