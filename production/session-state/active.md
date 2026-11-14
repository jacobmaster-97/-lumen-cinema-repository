# Active Session

## Current milestone

satisfaction-maintenance-pages-06：使用者明確授權分項滿意度／漸進影院定位，以及設備狀況／預防維護／現金管理。基準57df4b4；升級貼圖不滿意，維持暫存未採用，不要求本輪確認、不加入runtime。

## Implemented

- strategy.version1保存四項累積評價、四種定位、六類回訪、清潔標準、兩廳設備與保養。當日體驗從真正入場者記錄；退款會移除該票的體驗，換片修正實際類型。價格對比客群預算及當時品質，服務反映等候、延誤與取消；定位每次只移動15%，不鎖定排片。
- 快速／標準／深度清潔有不同工時、潔淨度及耗材；設備依放映及使用量磨損，狀況影響音畫及故障風險。
- 預約例行$900／60分鐘／恢復18點，或深度$2400／180分鐘／恢復55點；即時預付、完成才恢復、衝突阻止、取消退款、未完成日結退款。可整日只做保養仍支付固定開支。費用在maintenance內只計一次，preventive為其中資訊分項。
- 故障檢查共用每店每日最多兩次事件額度，保留平靜日；故障停廳退款並中斷投映，保養時不觸發。客人在按時完成的保養期間可在廳外等候，不會無故離開。
- 新「口碑與維護」頁、日報、預測及周轉預留提示；投資仍由玩家決定。預測用同一規則副本，含已預付保養、停廳、清潔及損耗，排除突發事件。
- 新營業日flow.strategyVersion1才啟用；舊v0.5營業中先照原規則日結，下日啟用。before-strategy-v1留原始舊檔；舊檔資金／物業／兩店保留。

## Verification

73項Node測試通過（原55＋18），11條實際Chromium流程通過，errors=[]、runtimeArtRequests=[]。包括保養預付／取消／時段失敗、完整自然營業日、實際日結與預測同為6292.04、分項評價及定位保留、保養地圖／故障彈窗、舊檔與離線、390／720／1080觸控提交。暖機CPU p95 7.1ms、首店快取34MiB。新設備事件原先未提供片名會令彈窗建構失敗，已補齊事件資料及容錯、實際urgent按鈕驗證通過。無反覆未解缺陷，未建立DEBUG_HANDOFF。

證據production/verification/v0.6與docs/screenshots/v0.6-*。已發佈來源7e570aef888892f7809b3a81f2f585acf378d1b3；測試43553784471與Pages43553784527均success。公開0.6.0及SHA一致，6項公開檢查通過，errors／failedRequests／runtimeArtRequests均為空，見deployment.json及public.json。後續[skip ci]交接提交不改公開來源。

## Documentation Impact

- Decision: updated
- Documents: design/strategy-v0.6.md, design/gdd.md, docs/github.md, production/timeline.md, production/session-state/active.md
- Reason: 品質與定位影響需求、設備影響故障，新增保養／耗材現金流、存檔版本標記、UI、預測及美術暫存邊界。

## Release / recovery

沿用jacobmaster-97/-lumen-cinema-repository與原Pages workflow，模組快取統一0.6.0。可revert功能提交重新部署；先保留最新存檔，再視需要恢復before-strategy-v1原檔，不清玩家資料。歷史未追蹤草稿不是本輪檔案。

## Risks / next safe task

真人手機、長期定位／回訪、清潔工時及保養數值待試玩。預測不含事件；風險為檢查時觸發概率，不是每日必然故障。下一步請使用者試玩已上線版本；升級圖持續未採用。
