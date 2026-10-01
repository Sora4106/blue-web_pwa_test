# ESP32-CAM BLE PWA 測試

此 GitHub Pages 專案使用 Web Bluetooth 與 `ESP32-CAM BLE Test` 雙向傳送 UTF-8 訊息。

## iPhone 測試

1. 確認 ESP32-CAM 已燒錄 BLE 測試程式並正在廣播。
2. 在 iPhone 安裝並啟用 [beacio](https://beacio.com/) Safari 擴充功能。
3. 使用 **Safari** 開啟本 GitHub Pages 網址（不要使用 Facebook、LINE 等 App 內建瀏覽器）。
4. 點「連接 ESP32-CAM」，從 iOS 選單選擇 `ESP32-CAM BLE Test`。
5. 傳送文字後，頁面會顯示 ESP32-CAM 回傳的 `ESP echo: ...`。

## BLE UUID

- Service：`6E400001-B5A3-F393-E0A9-E50E24DCCA9E`
- RX（手機寫入 ESP32-CAM）：`6E400002-B5A3-F393-E0A9-E50E24DCCA9E`
- TX（ESP32-CAM Notify 至手機）：`6E400003-B5A3-F393-E0A9-E50E24DCCA9E`
