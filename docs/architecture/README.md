# Lumen Cinema Architecture

Capture game architecture decisions here.

## Mobile Landscape Pages 07

使用者確認手機橫向底部導覽並要求實裝。mobile-input／touch-map處理按鈕步進、滑動收起與鏡頭手勢，renderer用DPR adapter接線；game維持原有引擎／存檔邊界。即時地圖與全部原玩法接入，無審閱版示範狀態或PNG取代。73項測試、11條Chromium流程、8尺寸及DPR2／深色檢查通過，待同來源部署公開核對。詳見design/mobile-interface-v0.7.md及production/verification/v0.7。
