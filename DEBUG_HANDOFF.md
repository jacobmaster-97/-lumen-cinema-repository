# DEBUG_HANDOFF

## 狀態與最小重現

使用者回報iPad在2×及4×營業卡頓。本輪已修復並部署v0.7.1，來源605902e；公開核對結果見production/verification/v0.7.1/public.json。不能保證未測實機Safari的長時間表現。

scripts/profile-cinema.cjs以真實引擎產生第8日雙廳136座、12員工、587顧客記錄，取走動／滿座／清潔。scripts/profile-live-cinema.cjs載入獨立測試存檔，運行正式game主迴圈2×／4×。844×390及1024×768，請求DPR2、Chromium CPU4倍節流；不讀取玩家存檔。目標p95繪圖33.3ms（30fps預算），不等同螢幕呈現fps／觸控延遲。

## 最終根因與最小修正

靜態深度圖層反覆縮放增加穩定成本；大Retina地圖畫布令多人來源繪製大幅變慢。iPad尺寸只畫靜態的控制組p95 3.5ms，但完整人物畫面約37–52ms。只修靜態快取不足。

最終只保留：高密度地圖約125萬像素預算（DPR最高2、最低1，CSS文字／畫面大小／觸控座標不變）、當前scene／scale的24MiB有界靜態圖層快取、座位索引、Navigation拼接快取及按需診斷。原人物actor方法、PNG、顧客／財務／v2／地圖保持；所有失敗人物快取均撤回。

iPad主迴圈2×／4×的p95由41.3／46.4ms降至14.4／13.9ms。像素預算後，同場cached/direct/direct/cached滿座p95 7.3／16.4／21.9／5.4ms。最終三案p95走動5.9／滿座11.1／清潔12.4ms。證據profile-live-ipad-final.json、profile-ipad-pixel-budget.json、profile-release.json；不挑早期窄畫面數字當iPad證據。

## 撤回的探測與不可重複路線

- 每人物姿勢小canvas：部分actor方法計時下降，總繪圖未改善。一次與Node測試並行的結果作廢；隔離重跑仍失敗。profile-optimized／isolated.json。
- 預縮小人物atlas：同場不穩定，沒有可靠收益，全部撤回。profile-paired-atlas.json。
- iPad增大靜態快取至64MiB探測：實際26.4MB、全部51層仍無收益，保留24MiB正式上限。profile-live-ipad-64-budget-probe.json。首次自動點按未開始的探測沒有營業樣本，不作數據；已加paused=false等待。
- 固定觀眾分組及小原生ImageBitmap：走動人物／大畫布情境仍無可靠收益，全部撤回。profile-ipad-audience／ipad-bitmaps.json。

不再堆人物快取、不增加容量掩蓋、不中途減少真實客流／收入。不並行跑CPU測試與效能基準，不只看單方法或內部百分位。失敗JSON保留作調查證據；只保留正式畫面PNG。

## 驗證與下一步

75項Node、完整自然4×日結／翌日、兩店／物業、三種實際小遊戲、舊v2、8尺寸、DPR2深色、iPad尺寸非整數DPR原生雙指通過。baseline與release三案顧客數、stage、可見ID及座位逐項一致；真實canvas驗證狀態JSON不被render改寫、24MiB上限、縮放／分店／容量／resize失效與釋放。errors／failedRequests／未採用美術請求為空。

下一步是使用者iPad試玩2×及4×；若仍卡頓，記錄型號／Safari版本／發生時客流與鏡頭比例，再重現量測，不能直接重複已失敗方案或廣泛重構。無已知未解JS錯誤；實機Safari、長時熱／耗電與系統記憶體壓力未實測。

## 新事件：v0.7.2 讀檔後要求重建

使用者明確按「繼續已儲存進度」。普通engine save/load於規劃、營業、日結可完整保留起始地圖。已重現另一條根因：boot先建立暫時空白state，尚未按歡迎繼續時再次reload，pagehide無條件persist覆寫主檔；其後繼續即讀到空白檔。原版實際4區域→0、44792.04→68000、日期2→1，production/verification/v0.7.2/baseline.json。未存取用戶iPad原檔，不宣稱已確定其實際受損路徑。

最小修正game啟動先還原、saveReady保護自動／離頁儲存；錯誤檔原樣保留，開業／繼續停用。提供現有合法較早備份預覽及明確確認恢復，取消不改資料；恢復／新局前先備份，寫入失敗不執行重設。無有效備份不捏造最新進度。

77 Node及8個真實存檔流程通過。調查測試曾因運行中loadGame回復paused後未取消暫停而無法日結、測試在離頁前直接注入錯誤檔會被既有合法頁面正常儲存取代，以及about:blank執行fixture初始化觸發Storage SecurityError；均修正測試情境（正式邏輯不繞過驗證）：明確resume、在下一頁初始化錯誤檔、fixture只在HTTP(S)注入。未反覆修改引擎或放寬檔案驗證。證據save-reopen.json、node-tests.txt。

本次0.7.2已發布來源2434fcf437d5cd90180c9a457985c490ce61364c，兩workflow成功，公開9項常規及8項存檔流程通過。無已知未解JS錯誤；未讀取用戶iPad實際主檔，若已被覆蓋且沒有有效備份，不能憑空還原最後一刻進度。

## v0.7.3 觸控時間表驗證

新手勢原生測試：初次「未誤開表單」斷言使用form.count，但關閉dialog會保留其表單DOM，已改為檢查dialog.open；沒有為此修改正式邏輯。背景滑動測試起初從棒條旁3px空隙起手，elementFromPoint顯示track但Chromium觸控命中修正將pointerdown轉到鄰近session，預期被棒條拖動接管。記錄pointer target／preventDefault後確認根因；改用60px高時間軸空白區測試，原生橫捲通過，不全面攔截背景手勢。四項模組測試、正式game DOM接線及14條原生流程均通過；沒有尚未處理的拖曳缺陷，Safari實機手感仍待試玩。

0.7.3已發布74236af，兩workflow成功，公開9項常規與14項原生拖動通過，沒有已知未解拖曳錯誤。0.7.2讀檔保護8條回歸及81 Node均通過，沒有重複先前失敗路線或改權威規則。
