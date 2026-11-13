---
name: minimax-h3-video
description: "MiniMax H3 文/图生视频：把商品图或一句描述变成 4–15 秒带同步音频的 mp4（Osprey 网关 /v2 异步端点，提交任务→轮询→自动下载）。Use when the user wants product video, 主图视频, 图生视频, 文生视频, MiniMax H3, 生成短视频, 商品动起来, or needs a real video model for storyboard shots — with audio, no ffmpeg needed for generation itself."
---

# MiniMax H3 视频 · Text/Image → Video

通过 Osprey 网关官方 MiniMax H3 V2 接口（`https://open.ospreyai.cn`）生成视频并自动下载 mp4。
MiniMax H3 原生**音视频联合生成**，输出 mp4 自带同步音频轨（环境音/配乐/音效），无需额外 TTS。

> Part of [ecommerce-video-skills](https://github.com/xianyu110/ecommerce-video-skills) · 商品图从哪来？用姊妹仓库 [ecommerce-image-skills](https://github.com/xianyu110/ecommerce-image-skills) 先出白底图/场景图。
> 纯 Python 标准库实现，零第三方依赖；异步任务通常 3–8 分钟。

## 环境 Environment

| 变量 | 必填 | 说明 |
|---|---|---|
| `API_KEY` | 是 | Osprey 网关 key（`sk-xxx`），或用 `--api-key` 传入 |
| `GW` | 否 | 网关地址，默认 `https://open.ospreyai.cn` |

生成慢（3–8 分钟/条），agent 应**后台运行**脚本并告知用户等待，不要卡住对话。

## 用法 Usage

```bash
# 文生视频：默认 768P / 16:9 / 5 秒
python scripts/text_to_video.py --prompt "A bird spreading its wings and flying away"

# 图生视频（商品首帧）：--image 传本地图片或 URL，9:16 竖屏适合电商
python scripts/text_to_video.py \
  --image product.jpg \
  --prompt "Slow push-in, soft studio light sweeps across the product surface" \
  --ratio 9:16 --duration 5 \
  --output ./out/main-video.mp4 --timeout 600

# 2K 高清 / 更长时长
python scripts/text_to_video.py --prompt "..." --resolution 2K --duration 10
```

### 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--prompt` | 视频描述（最多 7000 字符，必须） | — |
| `--image` | 首帧参考图（本地路径或 URL），图生视频用 | — |
| `--resolution` | `768P` / `2K` | `768P` |
| `--ratio` | `21:9` `16:9` `4:3` `1:1` `3:4` `9:16` | `16:9` |
| `--duration` | 4–15 秒整数 | `5` |
| `--output` | mp4 保存路径 | 当前目录 `minimax_h3_t2v.mp4` |
| `--timeout` | 轮询超时秒数 | `600`（建议 900–1800） |

## 工作原理

1. `POST {GW}/v2/video_generation` 提交任务（`model=MiniMax-H3`，提示词与首帧图放进 `content` 数组），拿 `task_id`
2. 每 10 秒轮询 `GET {GW}/v2/query/video_generation/{task_id}`，直到 `task.status=succeeded`
3. 从 `task.content.url`（OSS 预签名直链，无需 token，有时效）下载 mp4 到 `--output`

## 电商流程中的位置

- **单个镜头**：`image-to-video-shots` 写好商品一致性锁与镜头提示词 → 本 skill 逐条生成
- **整条片子**：`selling-point-storyboard` 出分镜 → 每个 shot 用本 skill 生成片段 → `ffmpeg-auto-assemble` 拼接成片
- 生成失败/排队久时，用分镜里的 `motion` 字段走 Ken Burns 本地兜底

## 提示词技巧

MiniMax H3 的文本编码器基于 Qwen3-VL，**支持长篇分镜脚本**：

```text
Realistic live-action cinematic look...
Scene overview: ...
Storyboard (each shot a separate scene, rapid cuts):
[0s-1.5s] Shot 1: ...
[1s-2.5s] Shot 2: ...
Audio: wind, rapid footsteps, city ambience, low score underneath...
```

- 英文提示词效果最佳；商品一致性锁（形状/颜色/Logo 不变）每条都带上
- 音频提示写在 `Audio:` 段，模型会据此生成同步音轨

## 常见报错

| 错误 | 原因 | 解法 |
|------|------|------|
| 401 | Token 无效 | 检查 `API_KEY` |
| 429 `queue maintenance` | 网关队列维护 | 等几十秒重试提交 |
| 任务 failed | 内容审核 / 参数非法 | 看 `task.error`，调整 prompt |
| 轮询超时 | 生成排队久 | 调大 `--timeout` |
| 下载 404 | `task.content.url` 有时效 | 重新查询任务取新链接；仅支持最近 7 天任务 |
