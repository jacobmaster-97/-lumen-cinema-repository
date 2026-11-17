# Lumen Cinema Architecture

Capture game architecture decisions here.

## Mobile Landscape Pages 07

使用者確認手機橫向底部導覽並要求實裝。mobile-input／touch-map處理按鈕步進、滑動收起與鏡頭手勢，renderer用DPR adapter接線；game維持原有引擎／存檔邊界。即時地圖與全部原玩法接入，無審閱版示範狀態或PNG取代。73項測試、11條Chromium流程、8尺寸及DPR2／深色檢查通過，已部署來源9bcbdb7，兩個workflow均success，公開0.7.0／SHA及8項操作通過。詳見design/mobile-interface-v0.7.md及production/verification/v0.7。

## v0.7.1 營業繪圖

針對iPad在2×／4×的卡頓，renderer新增當前scene／scale的靜態深度圖層顯示快取，最多24MiB，鏡頭穩定後每幀至多2層建立，超額回原繪圖；重建／縮放／resize／dispose會清舊canvas。人物與電影投映保持動態及原深度，PNG不變；高密度地圖畫布約125萬像素預算、DPR介於1至2，CSS文字／觸控不變。座位用scene弱索引、拼接路徑隨Navigation實例快取；diagnostics按需計算，經濟引擎與v2存檔不改。公平配對p95約16→6ms，完整主迴圈2×／4×補測，詳design/performance-v0.7.1.md與production/verification/v0.7.1。非Safari真機證據。
