# GitHub 接入

使用者已選擇在 `jacobmaster-97` 建立私有 repository `lumen-cinema`。

本機專案保留 Codex Game Studio 的上游 Git 歷史及 MIT 授權。上游為 `merlinhu1/codex-game-studio`；遊戲自己的遠端為 `jacobmaster-97/lumen-cinema`。

## 內容

可玩瀏覽器原型、實際透明貼圖、Godot 相容資源、21 項設計決策、開發紀錄、測試及 GitHub Actions。

GitHub Actions 在 push / pull request 時以 Node.js 24 執行遊戲的 18 項自動測試，僅授予 contents:read。它不會自動部署、改變私人試玩網站的受眾或存取遊戲存檔。

## 目前限制

現有 GitHub App 能讀寫已授權 repository，但呼叫建立 repository 時，GitHub 回覆 `Resource not accessible by integration (createRepository)`。共享瀏覽器亦未登入 GitHub。

因此本機檔案、提交與遠端可先準備，遠端 repository 必須先成功建立及可被現有 GitHub 連線存取，才可執行首次 push。建立空白私有 repository 時不要預先加入 README、授權或 .gitignore，以便直接保留現有完整 Git 歷史。

## 本機開發

啟動及測試見根目錄 README。原始 Studio 說明保留於 STUDIO_README.md；Godot 的 Web 匯出預設使用專案相對路徑，實際瀏覽器遊戲仍由 prototypes/browser 提供。
