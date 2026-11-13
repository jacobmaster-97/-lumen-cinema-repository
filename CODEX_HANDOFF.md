# CODEX_HANDOFF

## Project Goal

重製《光影大亨》現有瀏覽器版本：32-bit 像素貼圖、無候場區的立體階梯影院、可讀的營運介面，並更新現有 GitHub Pages。

## Current Phase

- Phase: playable rebuild → release
- Status: 已安裝專案本地 gamestudio（guangyuspace/codex-gamestudio-skill，42838f2a4df97f77104a4c7a9561a4f6c9160621），已完成本機可玩實裝與驗證，正在發佈。
- 使用者本輪已明確授權重製美術、地圖及發佈，不再沿用先前只設計待確認的交付邊界。

## Scope / Ownership

- 遊戲狀態、經濟與存檔：prototypes/browser/engine.mjs，維持 v2 schema 及儲存鍵。
- 遊戲介面與事件：prototypes/browser/game.mjs；新地圖呈現及導航分開實作。
- 地圖基準：design/art/map-a/pixel-v3，32×34 格、48/40 席、8 排、0–2.1m高台、5.2m影廳。
- 新角色及海報使用 ImageGen 真正來源圖集；已完成 v3 物件及材質會進入 runtime。
- 預設 180 秒營業日，排片、價格、事件、小遊戲、物業及兩店直接管理保留。

## Verification Required

- 既有模擬與 UI 回歸，舊存檔載入及兩店操作。
- 新地圖碰撞、樓梯升降、座位容量與升級可視化。
- 瀏覽器實際遊玩、控制、存讀檔、console、窄螢幕及效能。
- Pages build、遠端 commit/workflow、公開網址版本與素材。

## Release / Recovery

- Repository: jacobmaster-97/-lumen-cinema-repository；main 起點 c6511c2cd4d24e7bc9b6ca3117dbea5155c8d9f1。
- GitHub Pages: https://jacobmaster-97.github.io/-lumen-cinema-repository/
- 使用原 Pages workflow。保留舊存檔；失敗時可回退本輪 release commit，由相同 workflow 重新部署。

## Known Risks / Next Safest Task

27 項自動測試及 18 項真實 Chromium 流程通過。下一步推送並驗證既有 Pages 工作流程及公開版本。手機實機與長期經濟節奏仍待真人試玩。DEBUG_HANDOFF.md 未建立：沒有經兩次修正仍未解的遊戲缺陷。

## Verification Evidence

- npm test --prefix prototypes/browser: 27/27.
- node scripts/verify-cinema-browser.cjs: 18 player paths, no browser errors.
- production/verification/v0.3/browser.json: 1440×1000 desktop; 390/720/1080 touch layouts; old save, all minigames, day close, offline controls.
- Source map/art are in src/assets/cinema/runtime; world/scene/render own geometry, cache and animation.
