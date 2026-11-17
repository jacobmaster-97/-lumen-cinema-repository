# v0.7.1 營業畫面效能

使用者回報 iPad 在2×及4×營業時卡頓。本輪改善正式繪圖路徑，玩法、日長、真實顧客數、排片、財務、v2存檔、地圖及原PNG不變。未採用升級圖不接入。

## 量測與根因

scripts/profile-cinema.cjs 以真實引擎產生第8日、雙廳136座／12員工／587顧客記錄，取走動、滿座及清潔狀態。在844×390及1024×768、請求DPR2（最終地圖像素預算會限制實際DPR）、Chromium CPU4倍節流，每案130個暖機後樣本量測完整render呼叫（包括分批快取工作）。目標30fps、33.3ms；不是iPad Safari真機或GPU／耗電保證。基準5個來源SHA256載於profile-baseline.json。

基準p95走動15.8／滿座18.0／清潔13.4ms。同頁同狀態交錯cached/direct/direct/cached對照：直接縮放靜態圖層p95 15.4／16.9ms，預縮放快取6.8／5.8ms，約降低60%。證據profile-paired-layers.json；首次完整三案改善見profile-scaled-layers.json。這是繪圖呼叫耗時，不能等同端到端觸控延遲或螢幕呈現fps。

51張靜態深度圖層原本每幀從約52MiB的來源反覆縮放，構成穩定開銷。逐人物小canvas及單張人物atlas都沒有可靠的整體幀時間改善，已全部撤回，詳DEBUG_HANDOFF.md。不以局部actor方法計時判定成功。

## 實裝

- 保持原深度排序，靜態圖層依當前鏡頭比例預縮放。人物／電影螢幕仍即時繪製，與原圖層交錯。
- 每個renderer只保留一組scene／scale。縮放、resize、換店、施工／容量改變會釋放舊顯示canvas；平移可重用，dispose清空。
- 150ms穩定期後分批建立，每次最多2層；單層後達4ms即停止該批，並非單層硬4ms限制。正在移動鏡頭時暫緩。新增顯示快取上限24MiB，原場景快取仍保留；超額或context不可用就沿用原繪圖，地圖高密度畫布另設約125萬像素預算，DPR最高2、最低1；不改CSS大小、介面文字或觸控座標。大型CSS視窗若單倍解析度已超預算，仍維持單倍。
- 按scene建立座位索引，Navigation實例快取已拼接路徑；地圖／升級重建實例，不跨場景重用。診斷快照及百分位改為getDiagnostics呼叫時計算，靜態診斷僅換scene時重建。

畫面同一時間cache開／關對照，RGB平均差4.09/255（像素最近鄰取樣位置差），背景遮罩差0.066%；未改幾何、座位或遮擋順序。paired-layers-seated.png已目視核對。render-cache.json驗證真實顧客ID／stage相同、整個狀態JSON不被render改寫、縮放／分店／容量／DPR2 resize失效及24MiB上限。75項Node測試、11個實際流程（含自然4×日結）、8尺寸、DPR2深色及原生多指通過。

## iPad回報的速度

scripts/profile-live-cinema.cjs 直接載入獨立壓力測試存檔並運行正式game.mjs主迴圈，雙廳136座滿座，在2×及4×下繪圖p95首次分別6.6／9.7ms，真實經過時間、入場、路徑與快取上限核對通過。profile-live.json為窄畫面最終重跑結果；iPad尺寸見profile-live-ipad-final.json。未存取玩家存檔。實機Safari、長時間發熱／記憶體壓力仍待使用者試玩。

## iPad尺寸反證與最終修正

大Retina畫布下，靜態快取單獨不足：1024×768正式主迴圈2×／4×繪圖p95仍41.3／46.4ms。增加快取容量、觀眾分組、原生小ImageBitmap均沒有可靠收益，探測均撤回。最終新增高密度地圖畫布的像素預算，原PNG／人物與CSS介面不變，保留最近鄰像素風格；小畫面仍可用完整DPR2。不能再宣稱所有畫面DPR不變。

iPad尺寸最終同場配對：快取p95 7.3／5.4ms、直接縮放16.4／21.9ms（profile-ipad-pixel-budget.json）。最終主迴圈2×／4×的繪圖p95為14.4／13.9ms（原41.3／46.4ms），見profile-live-ipad-final.json；最終三種人流狀態及來源SHA256見profile-release.json。失敗探測保留作DEBUG證據，不當作正式方案。tablet-map.png及原生多指驗證核對非整數DPR下的觸控與畫面。

## 交付與回退

0.7.1模組／CSS快取版號，原main Pages工作流程。版本及功能SHA見production/verification/v0.7.1/deployment.json、public.json。回退本輪功能提交再發布；保留玩家v2資料。不得用已撤回的人物快取或減少客流代替修復。
