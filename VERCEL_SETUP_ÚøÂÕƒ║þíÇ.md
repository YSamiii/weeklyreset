# Weekly Reset 3.4.1 — Vercel 后端设置（零基础）

你已经有 Google Cloud 的 YouTube API Key，所以不需要重新申请。

## 1. 注册 / 登录 Vercel
打开 https://vercel.com ，用 Google 或 GitHub 登录均可。

## 2. 新建项目
在 Vercel Dashboard 点 **Add New → Project**。

最简单做法：把本压缩包里的 `vercel-backend` 文件夹放进一个新的 GitHub 仓库，然后在 Vercel 选择该仓库并 Import。

如果你不熟 GitHub，也可以安装 Vercel CLI 后从文件夹部署；但优先推荐网页 + GitHub，因为以后更新最简单。

## 3. Root Directory
如果仓库中只上传了 `vercel-backend` 内的文件，Root Directory 保持默认即可。
如果整个 3.4.1 文件夹都上传进同一个仓库，Root Directory 请选择 `vercel-backend`。

## 4. Environment Variable
部署前，在 **Environment Variables** 添加：

- Name: `YOUTUBE_API_KEY`
- Value: 粘贴你 Google Cloud 的 API Key（AIza...）

勾选 Production / Preview / Development 都可以。

不要把 API Key 发给任何人，也不要写进网页代码。

## 5. Deploy
点 **Deploy**。成功后 Vercel 会给你一个 `https://xxxx.vercel.app` 地址。

## 6. 测试
在这个地址后加 `/api/health`，例如：

`https://xxxx.vercel.app/api/health`

正常应看到：

`{"ok":true,"service":"weekly-reset-youtube","platform":"vercel","version":"3.4.1"}`

## 7. 填回 Weekly Reset
在 Weekly Reset 3.4.1 → 设置 → YouTube 自动发现中，把后端地址填写为：

`https://xxxx.vercel.app/api`

注意这里要带 `/api`，但不要带 `/health`、`/sync` 或 `/search`。

然后点击：
1. 保存自动同步设置
2. 立即检查新视频

## 8. 频道
频道可以直接填 YouTube 频道主页网址、`@handle` 或 `UC...` Channel ID。

新视频只进入“待审核”，不会直接参与排课。
