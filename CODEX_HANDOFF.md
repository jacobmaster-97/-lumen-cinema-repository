# CODEX_HANDOFF

## Goal / phase

使用者已確認手機橫向底部導覽、薄欄、觸控及文字精簡，最後要求「置中圖示按鈕也刪除，然後實裝」。審閱批准已完成，本輪正式接入並部署原GitHub Pages。基準8d1b693；v0.7.0已發布並公開核對。

## Implemented

- index／mobile.css：五入口、29／30px橫向欄及44px觸控範圍、工作分頁、即時地圖、區域按需詳情、真實分店／更多選單。直向重排，不縮字。
- game：原施工移至投資；時間／票價／小食步進、影廳選項、原生表單與預測、刪除確認／取消保留草稿；全部事件、三種20秒小遊戲、保養、報表、兩店、物業、音效、存讀檔仍完整。
- mobile-input／touch-map：pointerup啟動、防相容click及焦點覆蓋、長按放手／移出停止、標題滑走、8px點拖分流、短慣性、雙指中點縮放及取消。renderer用CSS↔canvas DPR adapter，保留即時人物與投映。
- 移除置中按鈕、地圖所有區域文字／營業提示及四段指定說明。原地圖位置、洗手間朝東、PNG、180秒日長、引擎經濟與v2存檔不變。未採用升級美術不實裝。

## Verification

73／73 Node；11條真實Chromium流程與8尺寸無溢出；DPR2／深色／48px編輯控制通過。實際施工扣款、排片、價格、人手、保養、兩店、物業、原生多指、三種小遊戲、自然日結／翌日及舊v2存讀檔均已驗證。errors／failedRequests／runtimeArtRequests=[]。取樣p95 2.4ms、完整店快取52MiB，非手機效能。模板validate與diff檢查通過。證據production/verification/v0.7；設計契約design/mobile-interface-v0.7.md。

Node測試調整至新導航；修復舊置中網頁容器導致canvas零尺寸、讀檔後選單未收起。每項均有重現及一次根因修正，無反覆未解缺陷；DEBUG_HANDOFF無需建立。

## Release / recovery

https://jacobmaster-97.github.io/-lumen-cinema-repository/ ，main原workflow。功能來源9bcbdb7dc2efb811dcae8e2ca34e586fbdaca911；測試run43894336484與Pages run43894335818均success，公開version.json為0.7.0及同SHA。8項公開操作檢查通過，errors／failedRequests／runtimeArtRequests=[]，含真實施工、排片步進、保養退款、實際入場／評價／損耗及舊檔兩店。公開HTTPS由平台CA驗證後原樣轉交Chromium，未停用TLS或以本機檔案替代。證據deployment.json／public.json；0.7.0模組／CSS快取。後續[skip ci]驗證文件提交不改公開功能來源。必要時revert功能提交重新部署，不刪玩家v2存檔。前一公開來源7e570aef888892f7809b3a81f2f585acf378d1b3（v0.6.0）。歷史未追蹤美術及審閱稿非本輪正式發布檔案，避免blanket git add。

## Risks / next safe task

同SHA公開檢查已完成，讓使用者用真實手機試玩拇指、系統手勢、安全區／軟鍵盤及長時間效能。模擬器不等於真機。升級圖維持未採用。
