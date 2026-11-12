# GitHub 與 Pages

使用者建立的實際 repository 為 jacobmaster-97/-lumen-cinema-repository，並選擇公開 Pages。沿用其名稱及公開設定，不改名。

本機 origin 指向該 repository，upstream 保留 merlinhu1/codex-game-studio 的原始歷史與 MIT 授權。

內容包括可玩原型、實際 PNG / Godot 資源、設計紀錄、測試及開發狀態。

## Pages 發佈

網址：https://jacobmaster-97.github.io/-lumen-cinema-repository/

main 推送會觸發 .github/workflows/pages.yml；先跑 18 項遊戲測試，再由 scripts/build-pages.mjs 產生 dist/pages 並部署。build job 只有 contents:read，部署 job 使用 pages:write 與 id-token:write。

遊戲主頁及貼圖工作台都使用相對資源路徑，適用於 repository 子路徑。正式發佈會複製 PNG 與 AtlasTexture 為一般檔案，不依賴 GitHub Pages 對符號連結的支援。

Sites 私人網站的原有受眾與設定不變。兩個網域的本機瀏覽器存檔互相獨立。
