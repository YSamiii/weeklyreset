# Weekly Reset 3.4.1
- YouTube 自动抓取后端从 Cloudflare Worker 改为 Vercel Functions，可直接使用 `*.vercel.app`，无需自定义域名。
- 保留 `/health`、`/search`、`/sync` 同一接口逻辑；App 仅需把后端地址改为 `https://你的项目.vercel.app/api`。
- YouTube API Key 继续只保存在后端 Environment Variable 中，不暴露给浏览器。
- YouTube 时长换算改为向上取整，避免 15:33 被当成 15 分钟用于严格排课。
