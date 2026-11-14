# 使用者第二版配置 — 洗手間入口向右已確認

使用者已明確確認「洗手間入口改向右」。目前使用 confirmed-config.json，僅把洗手間 door 由 south 改為 east，所有區域座標、大小、其他方向、初始地板及 initial=false 保持。preview.html 預設顯示已確認的向右版本；整體遊戲／Pages 實裝仍未獲本輪授權。

## Latest source

selected-config.json 保存使用者第二次貼上的 JSON，將訊息中的 HTML 空白與行尾跳脫還原為一般 JSON。零基底方塊座標、大小、方向、初始地板及 initial=false 均按原文保留。

本版只更新設計預覽，沒有修改正式可玩地圖、runtime 素材、財務或存檔。使用者之後要求接入 GitHub，目前預覽及編排器已加入既有 Pages 打包流程。此版本取代 selected-layout-v1 作為最新位置來源。

| 區域 | 方塊座標 (列,行) | 大小 | 原入口 |
| --- | --- | --- | --- |
| 影廳 1 | (2,4) | 2×2 | 右 |
| 影廳 2 | (5,3) | 2×2 | 左 |
| 售票區 | (5,5) | 1×1 | 下 |
| 小食部 | (6,5) | 1×1 | 下 |
| 洗手間 | (3,6) | 1×1 | 下 |

真正開局依舊只有 (6,6) 一塊 8×8 地板，五個區域都不在開局啟用。完整規劃畫面暫時全開地板，只顯示未來配置。

## Entry review

房間無重疊、無越界，也沒有佔用起點。洗手間現在位於最下行，向下入口的外側格為 (3,7)，超出 7×7 地圖，不能接到館內走道。

原向下方向保存在 selected-config.json 及原案截圖。confirmed-config.json 和 layout.json 目前採用使用者已確認的向右方向，五區入口均可接通；下方／左方仍可檢視比較，不覆寫已確認設定。

影廳左右入口依原側別，精確門位置放在銀幕低位。編排器提供的是方向，沒有指定沿牆門座標。此階段沒有處理最終設備碰撞或角色路徑。

## Files

- preview.html / preview.mjs：完整規劃、真正開局、49 步示例、入口方向比較及通道顯示。
- map-original.png / plan-original.png：新版原配置，洗手間向下開到地圖外。
- map-suggested-east.png / plan-suggested-east.png：僅比較入口向右，不移動區域。
- map-start.png：右下角單塊地板，零房間。
- map-confirmed.png / plan-confirmed.png / review-confirmed.png：已確認向右方向的目前版本。
- qa-confirmed.json：僅洗手間方向改動及五區入口連通的驗證。
- map-routes.png：向右方案五區方塊路徑。
- qa.json：來源 SHA256、座標比對、無重疊、邊界入口問題、替代方向通路及瀏覽器檢查。

## Next step

洗手間方向已確認。下一步確認整體像素設計後再實裝。所有截圖為實際生成素材及幾何組合，不是已上線遊戲畫面；未宣稱家具級導航或經濟驗證。
