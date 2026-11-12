# 光影大亨 · Lumen Cinema

以現代香港為背景的等角像素戲院經營遊戲原型。安排電影、票價及人手，觀察戲院自動營業，遇突發事件再選擇親自救場；累積盈利後買斷物業，並管理第二間分店。

[開啟 Sites 私人試玩網站](https://lumen-cinema-hk.jameshh998.chatgpt.site) · [遊戲框架](design/gdd.md) · [開發狀態](production/session-state/active.md)

## 已有玩法

- 影廳時間軸排片、清潔緩衝及票價設定。
- 六類客群、戲仿電影與片商、每週新片及逐步退熱。
- 票房分帳、小食收入與成本、員工薪金、租金及維護。
- 員工聘請、培訓、崗位配置與自動排班。
- 正常速度一日 180 秒，可加速但不可跳事件。
- 售票、小食、清潔三種可選小遊戲；停映、謝票、維修等事件。
- 區域設施升級、物業買斷、第二分店親自管理。
- 每日報告、本機存檔與讀檔。

本專案為可玩原型，數值與日長仍待真人試玩調整。正式角色動畫、聲音、特別格式及完整影展會後續擴充。

## 本機啟動

瀏覽器遊戲本身沒有第三方執行依賴。需要 Node.js 24+ 作開發測試，以及 Python 3 或其他靜態 HTTP server 作本機預覽。

```sh
git clone https://github.com/jacobmaster-97/-lumen-cinema-repository.git
cd -- -lumen-cinema-repository
npm ci --prefix prototypes/browser --ignore-scripts
npm test --prefix prototypes/browser
python3 -m http.server 8000 --directory prototypes/browser
```

以瀏覽器開啟 `http://localhost:8000`。`prototypes/browser/assets` 及 `favicon.svg` 為指向專案素材的相對符號連結；Windows 使用者可將 `src/assets/cinema` 複製成 `prototypes/browser/assets`，並將 `src/assets/icon.svg` 複製成 `prototypes/browser/favicon.svg`。

## 專案結構

| 路徑 | 內容 |
| --- | --- |
| `prototypes/browser/` | 可玩的原生 ES modules + Canvas 瀏覽器版本 |
| `src/assets/cinema/` | 實際透明 PNG、九個 Godot AtlasTexture、尺寸及基準點 |
| `src/scenes/asset_preview.tscn` | Godot 貼圖放置測試場景 |
| `tests/cinema/` | 模擬、介面整合及 Godot 資源測試 |
| `design/` | 遊戲框架、21 項訪談決策、美術方向及技術決策 |
| `production/` | 里程碑、驗證結果與開發狀態 |
| `.codex/`, `.agents/` | Codex Game Studio 的角色、工作流程與技能 |

## 測試與素材

`npm test --prefix prototypes/browser` 執行 17 項模擬測試及 1 項 DOM 整合測試。DOM 測試使用 jsdom，不等於完成視覺瀏覽器試玩。

Godot 4.6.3 可開啟 `src/project.godot` 查看實際貼圖放置場景。瀏覽器可玩原型使用 Canvas 2D，技術邊界見 [實作決策](design/architecture-browser-prototype.md)。

素材包括獨立有人售票櫃枱、自助售票機、座椅、小食櫃枱、爆谷機、汽水機、垃圾桶、清潔車及盆栽。原始 PNG 與 Godot 資源一併保留。

## Studio 來源

本專案基於 [merlinhu1/codex-game-studio](https://github.com/merlinhu1/codex-game-studio)，保留上游 Git 歷史、[MIT 授權](LICENSE) 與 [原始 Studio 說明](STUDIO_README.md)。

## GitHub Pages

公開版本網址：https://jacobmaster-97.github.io/-lumen-cinema-repository/ 。首次部署完成後即可使用，無需 ChatGPT 登入。

推送 main 分支後，Pages workflow 會先跑 18 項遊戲測試，再以 `node scripts/build-pages.mjs` 打包實際 PNG 與遊戲檔案並部署。打包會解析原始素材路徑，發佈內容不依賴符號連結。
