# Weekly Reset 3.4

- 新增通过 Cloudflare Worker 安全代理 YouTube Data API 的自动新视频发现。
- YouTube API Key 不再存入浏览器；改为 Cloudflare Worker Secret。
- 频道支持粘贴频道 URL、@handle 或 UC Channel ID。
- 打开/回到 App 时按设定间隔自动检查，也可手动立即检查。
- 新发现视频只进入“待审核”，不会直接参与排课。
- Worker 成功解析频道后，自动保存稳定 UC Channel ID。
- 保留 3.3.1 的周中重排锁定规则与 3.3 体感强度/挑战一点功能。
