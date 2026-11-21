# Module for Surge

脚本基于 Surge 测试，其他客户端的兼容性不做保证。

## 模块目录

### 🎥 YouTube Enhance

- **功能**：去广告、画中画、后台播放、翻译
- **适用**：YouTube & YouTube Music
- **安装**：[链接](YouTube.Enhance.sgmodule?raw=true)
- **备选**：[YouTube Lite](YouTube.Lite.sgmodule?raw=true) （内存友好）

#### YouTube ad_break (Surge fork)

[Issue #110](https://github.com/Maasea/sgmodule/issues/110) 回報 YouTube iOS 的片中廣告可透過獨立的 `player/ad_break` 請求取得。這個 Fork 參考 [devchristian1337 的 Loon 實作](https://github.com/devchristian1337/loon-plugins/blob/main/src/YouTube/request.js)，依 [Surge HTTP Request 規格](https://manual.nssurge.com/scripting/http-request.html) 在請求階段直接回傳 HTTP 200 與零位元組 Protobuf，避免把不同結構的回應交給既有解碼器。

- 在 Surge 6 匯入 [Fork 測試版模組](https://raw.githubusercontent.com/jerry74/sgmodule/fix/youtube-ad-break/YouTube.Enhance.sgmodule)，啟用 HTTPS MITM 並確認憑證受信任。請單獨啟用此版本，避免原版或其他 YouTube 模組的規則先匹配。
- 模組參數 `block_ad_break` 預設為 `true`。影片卡住、黑畫面或重試時，設為 `false` 即可放行此 API。若仍有問題，停用 Fork 模組並恢復原版。
- 在專案根目錄執行 `node --test tests/youtube.adbreak.test.js`，可離線驗證規則、開關、放行行為與回應格式。Surge 6 匯入、YouTube iOS 播放與實際廣告效果仍待實機驗證。
- 上游為 [Maasea/sgmodule](https://github.com/Maasea/sgmodule)，沿用 [Apache-2.0 授權](LICENSE)。

---

### 📺 Bilibili Helper

- **功能**：去弹幕、去广告、阻止 P2P
- **适用**：Bilibili
- **安装**：[链接](Bilibili.Helper.sgmodule?raw=true)

---

### 🌐 Aliyun DoH JSON API

- **功能**：适配阿里 DoH JSON API 鉴权
- **安装**：[链接](Alidns.sgmodule?raw=true)
- **备选**：使用[快捷指令](https://www.icloud.com/shortcuts/d94224c9df9f4e7ebe7ef2124f5e0180)动态更新鉴权 DNS（查看注释了解更多）

---

### 🏃‍♂️ Keep

- **功能**：去广告、简化导航栏
- **注意**：可能需重装 Keep 应用
- **安装**：[链接](KeepAds.sgmodule?raw=true)
