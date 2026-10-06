# 糯糯 · 中文 AI 陪伴猫咪 V1

原创 SVG 猫咪、温暖房间、摸头动作、中文文字对话、按住录音、WAV 转码、ASR、上下文聊天、TTS、取消录音、停止与重新播放、失败重试、昵称、静音、音量、聊天记录和清空。

## 模型与服务端配置

在 Sites 托管平台的服务端环境变量中设置 `DASHSCOPE_API_KEY`。默认北京地域，密钥必须与地域一致。模型支持与接口已按阿里云官方文档接入：

- ASR：`qwen3-asr-flash`，语言 `zh`，16 kHz 单声道 WAV，最长 60 秒。
- TTS：`qwen3-tts-flash`，`Cherry` 系统音色，`Chinese` 语言。
- 对话：`qwen-plus`，当前页面最近 24 条上下文，温柔陪伴角色。

其他可选环境变量见 `.env.example`。`DASHSCOPE_ORIGIN` 可设为所属业务空间的 HTTPS 域名。前端从不读取或接收密钥。仅设置状态会返回浏览器。未配置时不会生成模拟 AI 回复。

官方参考：
- https://www.alibabacloud.com/help/zh/model-studio/qwen-asr-api-reference
- https://www.alibabacloud.com/help/zh/model-studio/qwen-tts-api

## 本地启动

需要 Node.js 22 或以上，无第三方依赖。

```sh
node --env-file=.env.local scripts/preview.mjs
```

将 `.env.example` 复制为 `.env.local`，填入自己的密钥；也可不加载环境文件运行 `node scripts/preview.mjs` 查看界面。打开 http://127.0.0.1:4173 。部署时麦克风要求 HTTPS。首次授权时如果已经松开按钮，授权后再按住一次即可录音。

## 构建与验证

```sh
bash scripts/build.sh
node scripts/validate-artifact.mjs
node scripts/test.mjs
```

构建会将页面打包成单文件 Cloudflare Worker，产物在 `dist/`。托管默认仅所有者可访问，由 Sites 管理身份边界。公开发布前应增加请求频率和费用限制。

## 数据与当前限制

聊天只在页面内存中，刷新清除；昵称、静音与音量保存在浏览器。录音在识别请求结束后释放，本应用不持久存储。录音和对话会发送到阿里云，服务商的数据政策仍适用。

V1 是逐轮对话，未实现实时双向语音或长期记忆。嘴巴按朗读播放状态动画，未做逐音素口型。录音采用广泛兼容的 ScriptProcessorNode（已被浏览器标记废弃；下一版可迁移 AudioWorklet）。

自动测试使用模拟上游，验证接口合同和错误处理；真实 ASR/TTS、麦克风权限、音频播放及移动端验收需配置密钥后进行。当前没有真实服务密钥，因此不宣称已完成真实语音质量验证。

## GitHub 与服务端部署

GitHub 仓库用于保存源码和运行自动检查。GitHub Pages 无法运行 `/api/chat`、`/api/asr` 和 `/api/tts`，完整版本需要支持 Node.js 或 Docker 的服务端平台。

项目提供 Dockerfile，可在支持容器的平台构建运行。配置环境变量 `DASHSCOPE_API_KEY`，运行时监听 `0.0.0.0:8080`，也支持平台提供的 `PORT`。外部访问须启用 HTTPS 才能使用麦克风。`.env.local` 与平台身份配置均不会提交。

独立 Node.js 启动方式：设置 `HOST=0.0.0.0` 和平台 `PORT` 后运行 `node scripts/preview.mjs`。这是首版服务；上线供他人使用前，必须配置身份验证和请求限流，避免他人消耗你的模型额度。
