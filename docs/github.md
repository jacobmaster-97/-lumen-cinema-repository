# GitHub 與 Pages

使用者建立的實際 repository 為 jacobmaster-97/-lumen-cinema-repository，並選擇公開 Pages。沿用其名稱及公開設定，不改名。

本機 origin 指向該 repository，upstream 保留 merlinhu1/codex-game-studio 的原始歷史與 MIT 授權。

內容包括可玩原型、實際 PNG / Godot 資源、設計紀錄、測試及開發狀態。

## Pages 發佈

網址：https://jacobmaster-97.github.io/-lumen-cinema-repository/

main 推送會觸發 .github/workflows/pages.yml；先跑 27 項遊戲測試，再由 scripts/build-pages.mjs 產生 dist/pages 並部署。build job 只有 contents:read，部署 job 使用 pages:write 與 id-token:write。

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
