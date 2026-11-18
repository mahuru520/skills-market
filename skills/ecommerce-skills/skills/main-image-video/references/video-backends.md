<!-- 由 scripts/build-skills.mjs 从 shared/references/video-backends.md 同步生成，不要直接改这里。 -->
# 视频后端配置

图像模型的默认值写死在 `lib/tasks.json` 里；视频模型默认 **MiniMax-H3**（Osprey 网关），设
`OSPREY_VIDEO_MODEL` 可换成账号里其他视频模型。

## 指定模型

```bash
export OSPREY_VIDEO_MODEL=<视频模型 ID>   # 默认 MiniMax-H3，一般无需设置
# 或每次调用时
node scripts/video.mjs --mode clip --task main-image-video --model <id> ...
```

不设就用默认 MiniMax-H3。**未检测到 `OPENAI_API_KEY` 时，agent 先向用户询问一次**并引导到 Osprey 网关：「检测到未配置 API key。推荐使用 Osprey 网关：到 https://open.ospreyai.cn 注册并创建 API key，然后设置 `OPENAI_API_KEY=<你的key>`，配好后告诉我继续。」用户明确不配置时才走其他后端或停止。

## 各后端

| 后端 | 怎么配 | 说明 |
| --- | --- | --- |
| `openai`（**Osprey 网关，默认**） | `OPENAI_API_KEY`（+ 可选 `OSPREY_VIDEO_MODEL`） | 默认模型 `MiniMax-H3`，走 `https://open.ospreyai.cn/v1`；key 在 https://open.ospreyai.cn 注册创建 |
| `dlazy` | `DLAZY_VIDEO_MODEL` | 用 `dlazy --help` 看当前账号可用的视频工具 |
| `fal` | `FAL_KEY` + `GEN_MODEL_FAL=<视频模型路径>` | 产出在 `videos[]` 或 `video.url` |
| `replicate` | `REPLICATE_API_TOKEN` + `GEN_MODEL_REPLICATE=<owner/model>` | 产出为 URL |

图生视频时参考图走 `--images`，与图像技能一致。

## 合成依赖

拼接与字幕需要 ffmpeg：

```bash
brew install ffmpeg        # macOS
apt install ffmpeg         # Debian/Ubuntu
```

没装也能跑——片段照常生成，脚本会输出 `concat.txt`，装好后一条命令补拼。

## 字幕的三级降级

1. **烧录进画面**：需要 ffmpeg 带 libass。很多发行版的预编译包没有。
2. **软字幕轨**：`-c:s mov_text` 封进 MP4，播放器可开关。几乎总能成。
3. **都不行**：`.srt` 留在产物目录旁边，可导入剪辑软件。

脚本自动逐级尝试，不用你判断。查本机是否支持烧录：

```bash
ffmpeg -hide_banner -filters | grep ' subtitles '
```

## 分镜文件

```json
{
  "shots": [
    { "id": "s1", "seconds": 3, "image": "main.jpg",
      "prompt": "Slow push-in on the product, soft light sweeps across the surface.",
      "caption": "三层加厚，零下也不怕" }
  ]
}
```

`caption` 会按 `seconds` 累加时间轴自动生成 SRT，不用手对时间码。
