# CODEX_HANDOFF

## Goal / phase

使用者回報iPad在2×／4×營業卡頓，要求解決。本輪基準6abf971；v0.7.1功能完成並通過本機驗證，待發布原GitHub Pages及同SHA公開核對。前版0.7.0來源9bcbdb7。

## Implemented

- render：當前scene／scale的靜態深度圖層顯示快取，最多24MiB；鏡頭穩定150ms後每次最多2層，4ms為層與層之間軟截止。超額／context不可用就原繪圖。平移重用；縮放、resize、換店、施工／容量變動及dispose釋放舊顯示canvas。人物／電影投映仍即時、原深度排序；高密度地圖約125萬像素預算、DPR1至2，CSS文字／觸控不變。
- operations-world／world：按scene弱索引座位；Navigation快取拼接路徑。靜態診斷換scene才重建、營運快照及p95按需讀取，避免逐幀工作。
- gameplay／財務引擎、實際顧客數、日長、地圖座標、東向洗手間、PNG、v2存檔與已確認手機UI保持；未採用升級圖不引用。人物預縮小兩種方案無可靠收益，已撤回，詳DEBUG_HANDOFF。
- profile-cinema／profile-live-cinema／verify-render-cache提供可重跑量測及真實canvas驗證；cache版號0.7.1。

## Verification

75／75 Node。11條完整Chromium流程含自然4×日結／翌日、真實施工／財務／排片／保養／物業／兩店／三種小遊戲／舊v2，8尺寸、DPR2深色及原生多指通過。真實canvas快取上限、失效、釋放、顧客ID／stage相同、完整狀態不被render改寫通過。errors／failedRequests／runtimeArtRequests=[]。

844×390／DPR2／CPU4倍節流，同場cached/direct/direct/cached滿座p95 6.8／15.4／16.9／5.8ms，約60%下降，30fps預算33.3ms。iPad1024×768主迴圈2×／4×滿座，最終p95 14.4／13.9ms（原41.3／46.4ms），高密度畫布像素預算是關鍵。最終重跑數字見production/verification/v0.7.1/profile-release.json及profile-live-ipad-final.json，方法與限制design/performance-v0.7.1.md。證據非Safari／實體iPad／長時熱與耗電。靜態像素最近鄰差異1.6%滿刻度，背景遮罩差0.066%，滿座截圖目視通過。

## Release / recovery

原https://jacobmaster-97.github.io/-lumen-cinema-repository/，main既有Pages workflow。待CI／公開同SHA核對；證據production/verification/v0.7.1。回退本輪功能提交再部署，不清玩家v2資料。歷史未追蹤美術／審閱稿不加入本輪。模板context manifest需在更新設計／時間線後refresh-context再validate；docs-impact分類器不識別prototypes/browser，需手動記錄browser擁有文件。

## Risks / next safe task

iPad Safari實際手感及長時間熱／記憶體表現待使用者試玩；不承諾實機fps。下一步完成原Pages發布及公開版本核對。
