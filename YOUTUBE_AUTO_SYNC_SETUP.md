# Weekly Reset 3.4 — YouTube 自动发现新视频设置指南（零基础版）

这套方案由两部分组成：

1. **Google Cloud / YouTube Data API v3**：提供 YouTube 新视频资料。
2. **Cloudflare Worker**：替 Weekly Reset 保管 YouTube API Key。Weekly Reset 网页里不会保存 API Key。

> Weekly Reset 3.4 会在你打开 App、或从后台回到 App 时检查是否到了自动同步时间。App 完全关闭时不会自己在 iPhone/iPad 后台运行；但你下一次打开 App 时会自动补查。

---

## 第一部分：创建免费的 YouTube API Key

### 1. 打开 Google Cloud Console

在浏览器打开 Google Cloud Console：`https://console.cloud.google.com/`

用你的 Google 账号登录。

### 2. 新建项目

1. 页面顶部点击当前项目名称。
2. 点击 **New Project / 新建项目**。
3. Project name 输入：`Weekly Reset YouTube`。
4. 点击 **Create / 创建**。
5. 等创建完成后，确认顶部已经切换到这个项目。

### 3. 开启 YouTube Data API v3

1. 左上角菜单 → **APIs & Services / API 和服务** → **Library / 库**。
2. 搜索：`YouTube Data API v3`。
3. 点进去。
4. 点击 **Enable / 启用**。

### 4. 创建 API Key

1. 左侧进入 **APIs & Services → Credentials / 凭据**。
2. 点击 **Create Credentials / 创建凭据**。
3. 选择 **API key**。
4. 屏幕会出现一串以 `AIza...` 开头的 Key。
5. 先复制到一个临时安全位置。不要把它放到 GitHub 代码里。

### 5. 限制 API Key（建议）

在刚创建的 API key 详情页：

1. **Application restrictions / 应用限制**：可以先保持 `None`。因为真正调用 API 的是 Cloudflare Worker，不是浏览器。
2. **API restrictions / API 限制**：选择 **Restrict key / 限制密钥**。
3. 只勾选 **YouTube Data API v3**。
4. 保存。

---

## 第二部分：创建免费的 Cloudflare Worker

### 1. 注册 / 登录 Cloudflare

打开：`https://dash.cloudflare.com/`

注册免费账号或登录。

### 2. 创建 Worker

Cloudflare 界面名称可能会略有变化，大致路径是：

1. 左侧进入 **Workers & Pages**。
2. 点击 **Create**。
3. 选择 **Worker** / **Start with Hello World** 一类的选项。
4. Worker 名称建议：`weekly-reset-youtube`。
5. 创建后进入代码编辑页面。

### 3. 替换 Worker 代码

1. 打开本压缩包中的 `cloudflare-worker.js`。
2. 全选并复制里面全部代码。
3. 回到 Cloudflare Worker 编辑器。
4. 删除原来的 Hello World 示例代码。
5. 粘贴 `cloudflare-worker.js` 全部代码。
6. 点击 **Deploy / Save and deploy**。

### 4. 把 YouTube API Key 存成 Secret

这是最重要的一步。**不要直接把 API Key 写进 cloudflare-worker.js。**

1. 打开你刚才创建的 Worker。
2. 进入 **Settings**。
3. 找到 **Variables and Secrets**（有时叫 Environment Variables）。
4. 点击添加变量。
5. 名称填写：`YOUTUBE_API_KEY`
6. 类型一定选择 **Secret**。
7. Value 粘贴前面 Google 给你的 `AIza...` API Key。
8. 保存 / Deploy。

### 5. 可选：限制只允许你的 App 调用

一开始建议先不做，等全部测试成功后再加。

成功后可以再新增普通变量：

- 名称：`ALLOWED_ORIGIN`
- 值：你的 GitHub Pages 网站来源，例如 `https://samname.github.io`

注意只写域名来源，不要写 `/weekly-reset/` 后面的路径。

### 6. 复制 Worker 地址

Worker 页面会显示类似：

`https://weekly-reset-youtube.你的账号.workers.dev`

复制这一整段。

你可以先在浏览器打开：

`https://weekly-reset-youtube.你的账号.workers.dev/health`

如果看到类似：

`{"ok":true,"service":"weekly-reset-youtube","version":"3.4"}`

说明 Worker 正常。

---

## 第三部分：在 Weekly Reset 3.4 里连接 Worker

### 1. 先部署 Weekly Reset 3.4

和你以前更新版本一样：

1. 解压 `weekly-reset-3.4.zip`。
2. 将 `weekly-reset-3.4` 文件夹里的网页文件覆盖到你当前 GitHub Pages 仓库。
3. 等 GitHub Pages 发布完成。
4. 打开网页确认顶部版本是 **3.4**。

### 2. 打开设置

Weekly Reset → **设置** → **YouTube 新视频自动发现**。

### 3. 填 Worker 地址

在 **Cloudflare Worker 地址** 里粘贴刚才复制的：

`https://weekly-reset-youtube.你的账号.workers.dev`

不要在后面加 `/sync`。App 会自己加。

### 4. 填你要追踪的 YouTuber

每个频道有两栏：

- 左边：频道名称
- 中间：频道地址 / @handle / UC… ID

最简单的方法：

1. 打开 YouTube 对应 YouTuber 的频道主页。
2. 复制浏览器地址。
3. 例如地址形如 `https://www.youtube.com/@某个handle`。
4. 直接完整粘贴到 Weekly Reset 的频道栏。

你不需要自己找 UC Channel ID。第一次成功检查后，Weekly Reset 会自动把地址转换并保存成稳定的 `UC...` Channel ID。

### 5. 自动检查间隔

默认 **6 小时**。

这不是说 App 会在后台每 6 小时强行启动一次，而是：

- 打开 App 时检查；
- 从其他 App 切回来时检查；
- 如果距离上次成功检查已经 ≥ 6 小时，就自动同步。

对你的使用量来说，6–12 小时都很合适。

### 6. 第一次手动测试

1. 点击 **保存自动同步设置**。
2. 点击 **立即检查新视频**。
3. 如果成功：
   - 有新视频 → 提示“发现 X 个新视频，已放入待审核”；
   - 没有新视频 → 提示“没有发现新视频”。
4. 点击底部 **待审核** 页面查看。

---

## 新视频之后会怎样？

新视频不会直接加入自动排课。

流程是：

**YouTube 新上传 → Weekly Reset 自动发现 → 待审核 → 你确认训练类型/强度/安全标签 → 批准进入视频库 → 才可参与未来排课。**

这是为了避免 vlog、Shorts、过强训练、卷腹较多或不适合当前产后恢复阶段的视频直接进入计划。

---

## 常见错误

### “Worker 尚未设置 YOUTUBE_API_KEY Secret”

Cloudflare Worker 里还没有正确添加 `YOUTUBE_API_KEY`，或添加成普通变量后没有保存部署。

### “没有找到频道”

频道地址/handle 填错。建议直接去 YouTube 频道主页复制完整地址。

### “Failed to fetch”

常见原因：

- Worker 地址填错；
- Worker 没有 Deploy；
- `ALLOWED_ORIGIN` 填错导致 CORS 拦截。

如果你刚加了 `ALLOWED_ORIGIN`，可以先删掉它测试。

### Google API 报 quota / quota exceeded

正常个人使用几乎不应该发生。Weekly Reset 每个频道主要使用 `channels.list`、`playlistItems.list`，并批量调用 `videos.list`；这些读取接口成本很低。

---

## 隐私 / 安全

- YouTube API Key 不保存在 Weekly Reset 浏览器 localStorage。
- Key 只存在 Cloudflare Worker Secret。
- 不需要 Google OAuth，不需要让 Weekly Reset 登录你的 YouTube 账号。
- Weekly Reset 只读取公开频道和公开视频资料。
