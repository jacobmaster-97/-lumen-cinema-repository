# 光影大亨 · 實際設施貼圖 01

首批 9 件靜態設施，包含獨立有人售票櫃枱。不是概念場景截圖。

## 檔案

- `props-atlas.png`：1536 × 1024 RGBA，8 件設施來源圖。
- `ticket-counter.png`：1774 × 887 RGBA，售票櫃枱來源圖。
- `props/*.tres`：9 個 Godot AtlasTexture，已設定各物件裁切區域。
- `atlas.json`：資源 ID、裁切座標、底部中央基準點、建議世界寬度及佔地。

來源 PNG 保留原始生成檔；Godot 資源引用其中的物件區域。來源圖大面積透明留白不佔遊戲格數。

## Godot 使用方式

將 `assets/cinema/` 複製到 Godot 專案相同路徑。建立 Sprite2D，把對應 `.tres` 拖入 Texture。Texture Filter 設 Nearest，避免放大時模糊。

以 `atlas.json` 的 `scale` 設定 Sprite2D 縮放。若 Sprite2D 使用預設 centered=true，將 offset 設為 `(0, -region_height / 2)`，節點 position 即為底部中央基準。建議格尺寸為 64 × 32。

`filter_clip=true` 避免讀到鄰近圖集區域；碰撞與遮擋範圍按 `footprint` 另建，不能把來源圖片矩形當作實際佔地。

## 內容

影院座椅、自助售票機、小食櫃枱、爆谷機、汽水機、分類垃圾桶、清潔車、盆栽、有人售票櫃枱。

這批不含角色／員工動畫、地板牆身正式貼圖、電影海報、特別格式設備或 UI。放置預覽內的地板與牆只是測試底板。所有美術仍可在實際遊戲比例下調整。

資源包附 Godot 放置測試場景；匯入後執行 asset_preview.tscn 即可查看，沒有經營玩法。
