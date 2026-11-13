# Active Session

## Current milestone

可玩瀏覽器原型 v0.2；使用者已要求繼續建構。首批實際貼圖已接入，玩法製作不再暫停。

## User decisions

21 項核心選擇見 design/cinema-concept.md。首版包含買斷物業、第二間分店、獨立售票櫃枱、正常速度至少 3 分鐘日長、可加速不可跳事件；各分店直接管理。

## Prototype Hypothesis

排片、定價、人手及設施配置能否在可理解的營運回饋中形成取捨？玩家能否在自動營業與自選介入之間取得樂趣，並透過盈利買斷與開第二店？

## Implementation

- prototypes/browser：原生 ES modules + Canvas 可玩版本，模擬與畫面分離；沿用實際 PNG 圖集。
- Godot 資源來源與載入測試保留。引擎邊界決策見 design/architecture-browser-prototype.md，不冒稱瀏覽器版使用 Godot 執行。
- 兩店共用日期與資金，獨立排片／人手／價格／租買狀態／收支。
- 保留原貼圖工作台於 art.html。

## Throwaway Boundary

經濟參數、日長、角色程序繪圖與初始界面可按真人試玩調整。保留需求紀錄、素材來源、分離模擬與有意義的行為測試。

## Success Signal

完成安排、營業、事件、日結、投資、次日循環；正常收益能買斷及開第二店；現金流、分帳、成本、容量與事件不因加速出錯。

## Verification

- 17 項確定性模擬測試通過：日長、暫停、加速事件、同時兩店事件、財務對帳、買斷、第二店、排片驗證、需求、週更新、介入、停映、維修、資金不足、存檔、連續經營及貸款。
- 1 項跨畫面 DOM 整合測試通過：排片、售價、人手、投資、三種小遊戲、日結、存讀檔；Canvas 使用測試替身，不能據此宣稱完成視覺 QA。
- 三個執行模組語法檢查通過。
- 本機 Sites preview relay 再次逾時。共享 Chromium 成功顯示私人網站登入頁，但自動審批拒絕按 Continue with ChatGPT，理由是該登入操作授權未確立；未繞過拒絕。

## Risks

正式角色動畫、音效、特別格式及完整影展仍待後續。經濟值與日長尚未真人試玩；瀏覽器視覺 QA 待登入授權或使用者自行試玩。

## Documentation Impact

- Decision: updated
- Documents: design/gdd.md, design/cinema-concept.md, design/architecture-browser-prototype.md, production/timeline.md, docs/github.md
- Reason: 保留可玩版本與技術邊界紀錄；新增 GitHub 接入、相對匯出路徑及測試說明，記錄建立私有 repository 的權限限制。

## Deliverables

私人網站：https://lumen-cinema-hk.jameshh998.chatgpt.site
原貼圖工作台：/art.html
程式來源：prototypes/browser；Godot 相容貼圖：src/assets/cinema。

## Publication

可玩版本已由 Sites 確認部署成功；原網址主頁為遊戲，art.html 保留貼圖工作台。完整部署 ID 與 SHA 見 production/playable-deployment.json。Studio 驗證及文件影響檢查亦已通過。

## GitHub 接入準備

使用者選擇新增私有 jacobmaster-97/lumen-cinema。已整理遊戲 README、保留 STUDIO_README.md、加入 Node.js 24 的 GitHub Actions 測試設定，並改用相對 Godot 匯出路徑。移除未使用且引用不存在 main.gd 的舊場景；實際貼圖場景入口不變。

GitHub App 建立 repository 回覆 Resource not accessible by integration；共享瀏覽器未登入 GitHub。尚未宣稱 repository 已建立或已 push。

## GitHub Pages 接入

使用者已建立公開 jacobmaster-97/-lumen-cinema-repository 並要求 Pages。已沿用實際名稱，新增自足靜態打包與先測試再部署的 workflow；待 push 及遠端部署驗證。

## GitHub 遠端驗證結果

- 已將 main 推送到公開 jacobmaster-97/-lumen-cinema-repository。
- Cinema prototype tests run 43176907651 成功，18 項測試通過。
- Pages run 43176907722 的 build 成功，遊戲與實際貼圖 artifact 已產生。
- deploy 在首次啟用 Pages 時被 GitHub 拒絕：403 Resource not accessible by integration。repository has_pages=false，需要擁有者在 Settings → Pages 將 Source 設為 GitHub Actions，再重試失敗的 deploy job。
- 尚未宣稱 Pages 網站已上線；啟用後可重跑 failed jobs，無需重新要求建立 repository 或修改存取範圍。

## GitHub Pages 已上線

擁有者已設定 Pages。重試既有 run 43176907722 後 build / deploy 均成功。公開網址：https://jacobmaster-97.github.io/-lumen-cinema-repository/ 。

HTTP 200 驗證範圍：index.html、game.mjs、engine.mjs、render.mjs、assets/atlas.json、兩張實際設施 PNG、art.html。GitHub Pages API 狀態 built / workflow。

視覺試玩限制：雲端 Browser Use 回覆 Could not read requirements；native Chromium launch 未產生視窗。沒有把 HTTP 成功誤當作完成視覺遊戲試玩。
