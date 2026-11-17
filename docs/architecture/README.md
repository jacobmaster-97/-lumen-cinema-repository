# Lumen Cinema Architecture

Capture game architecture decisions here.

## Mobile Landscape Pages 07

使用者確認手機橫向底部導覽並要求實裝。mobile-input／touch-map處理按鈕步進、滑動收起與鏡頭手勢，renderer用DPR adapter接線；game維持原有引擎／存檔邊界。即時地圖與全部原玩法接入，無審閱版示範狀態或PNG取代。73項測試、11條Chromium流程、8尺寸及DPR2／深色檢查通過，已部署來源9bcbdb7，兩個workflow均success，公開0.7.0／SHA及8項操作通過。詳見design/mobile-interface-v0.7.md及production/verification/v0.7。

## v0.7.1 營業繪圖

針對iPad在2×／4×的卡頓，renderer新增當前scene／scale的靜態深度圖層顯示快取，最多24MiB，鏡頭穩定後每幀至多2層建立，超額回原繪圖；重建／縮放／resize／dispose會清舊canvas。人物與電影投映保持動態及原深度，PNG不變；高密度地圖畫布約125萬像素預算、DPR介於1至2，CSS文字／觸控不變。座位用scene弱索引、拼接路徑隨Navigation實例快取；diagnostics按需計算，經濟引擎與v2存檔不改。公平配對p95約16→6ms，完整主迴圈2×／4×補測，詳design/performance-v0.7.1.md與production/verification/v0.7.1。非Safari真機證據。

0.7.1發布來源605902e5f428f9d005ecfc5bef548314fc2fffc6；測試44040401826及Pages44040401823均success，公開版本／SHA與9項操作核對通過，含Retina iPad尺寸畫布預算。公開HTTPS保留CA驗證，未用本機檔案替代；deployment.json／public.json記錄結果。後續[skip ci]驗證文件不改公開來源。

## v0.7.2 啟動與存檔保護

game啟動先恢復現有v2狀態再顯示歡迎；saveReady阻止未載入／失敗時自動儲存暫時空白新局。備份恢復需預覽並明確確認，恢復及重新開局前保留原始主檔，備份寫入失敗取消操作。引擎及序列化格式不改，0.7.1效能限制保持。重現／驗證及資料恢復界線見docs/save-recovery-v0.7.2.md、production/verification/v0.7.2。

0.7.2功能來源2434fcf437d5cd90180c9a457985c490ce61364c；測試44049651507及Pages44049651443均success。公開0.7.2／同SHA的9項常規及8項存檔恢復檢查通過；證據production/verification/v0.7.2。後續[skip ci]驗證提交不改功能來源。

## v0.7.3 時間表拖曳

schedule-drag.mjs只擁有指針／預覽／手勢rAF；game綁定原validateProgramme與setProgramme，合法放手一次寫入及更新預測。重繪前destroy，取消／第二指／隱藏／resize不改權威資料；mobile-input略過棒條並抑制其相容click，鍵盤與原編輯表單保留。build明確複製新模組、0.7.3快取，81 Node與14條原生拖動流程，方法／限制見design/timetable-touch-v0.7.3.md。
