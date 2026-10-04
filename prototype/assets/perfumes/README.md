# 香水瓶身圖片

本目錄保存 10 品牌、50 款香水的展示圖與可追溯來源，查閱日期為 2026-10-04。

- `manifest.json`：每款一筆，IM01–IM50。包含中英文名稱、發布者、官方商品頁、原圖網址、對應香氣來源、查閱日期、各版本檔案與處理方式。
- `originals/`：取自品牌或官方香水製造商的原始檔。COACH 圖片來自 Interparfums；個別品牌採不同地區官網，詳見逐筆商品頁。
- `cutouts/`：35 張以內建 ImageGen 去背的輸出；不是官方發布的透明圖。已比對品名、瓶蓋和款式，細小文字或反光仍可能受 AI 改動。官方原檔始終另存，外觀細節請回查原圖。
- `image-edit-prompts.json`：35 張最終採用版本的完整提示詞及工具名稱。
- `display/`：50 張透明 WebP 縮圖，供建置內嵌。Jo Malone、Penhaligon’s、Aesop 共 15 張直接沿用官方透明素材；其他 35 張由已核對的 AI 去背輸出縮小。

圖片是辨識香水的輔助，不參與香調分組及圖表計數。各瓶以相同可見高度呈現，不代表相同容量。原始長寬比維持不變，CSS 依 manifest 的 display_bounds 收去留白與外側投影。

在專案根目錄執行 `python3 scripts/prepare-perfume-images.py` 可重建 WebP 縮圖和顯示邊界，需 Pillow 與 NumPy。此腳本只調整解析度、轉存格式及計算邊界，保留 alpha，不移除背景或重繪瓶身。接著執行 `python3 scripts/build-prototype.py` 重新內嵌圖片；一般修改版面只需後者。

原圖的品牌標誌與產品攝影屬其各自權利人；本目錄的來源紀錄不代表品牌背書。
