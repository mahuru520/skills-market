# OspreyAI·OpenClaw MiniMax H3 视频生成用户手册

> 本手册介绍如何在 OspreyAI·OpenClaw 中使用 MiniMax H3 生成视频，涵盖文生视频、首帧/尾帧/首尾帧图生视频和多模态参考生视频。
>
> MiniMax H3 通过 Osprey 官方 MiniMax H3 V2 接口提供异步视频生成能力。生成任务提交后，需要等待任务完成，系统会自动获取并保存 MP4 视频。

---

## 一、功能概览

### 1. 支持的生成方式

| 生成方式 | 输入内容 | 适用场景 |
| --- | --- | --- |
| 文生视频 | 文本 Prompt | 根据文字描述从零生成视频 |
| 首帧/尾帧/首尾帧图生视频 | Prompt + 首帧图片和/或尾帧图片 | 让静态图片动起来，控制视频开始或结束画面 |
| 多模态参考生视频 | Prompt + 参考图片、视频或音频 | 参考角色、场景、动作、风格、声音或节奏生成新视频 |

### 2. 三个可用技能

```text
minimax-h3-text-to-video
minimax-h3-first-last-frame-video
minimax-h3-reference-to-video
```

根据任务类型选择对应技能即可。一般情况下，直接描述需求，OpenClaw 会选择合适的技能。

---

## 二、首次使用前的准备

### 1. 配置 Osprey 网关

MiniMax H3 技能使用以下环境变量：

```bash
export GW="https://open.ospreyai.cn"
export API_KEY="sk-your-api-key"
```

其中：

- `GW`：Osprey 官方 MiniMax H3 网关地址。
- `API_KEY`：Osprey 网关 API key。

也可以在调用脚本时使用 `--gw` 和 `--api-key` 临时传入。

### 2. 加载视频生成技能

首次使用时，可以输入：

```text
学习并启用 Osprey MiniMax H3 视频生成能力。根据任务类型使用文生视频、首帧/尾帧/首尾帧图生视频或多模态参考生视频技能。
```

如果需要指定技能，也可以输入：

```text
加载 minimax-h3-text-to-video，用于 MiniMax H3 文生视频。
加载 minimax-h3-first-last-frame-video，用于 MiniMax H3 首帧、尾帧或首尾帧图生视频。
加载 minimax-h3-reference-to-video，用于 MiniMax H3 多模态参考生视频。
```

---

## 三、模型规格与输入条件

### 1. 输出规格

| 项目 | MiniMax H3 |
| --- | --- |
| 模型名称 | `MiniMax-H3` |
| 输出分辨率 | `768P` / `2K`（默认 `768P`，当前网关仅支持 768P，2K 暂不可用） |
| 输出时长 | 4～15 秒，仅支持整数 |
| 支持比例 | `21:9`、`16:9`、`4:3`、`1:1`、`3:4`、`9:16`、`adaptive` |
| 提示词长度 | 不超过 7000 个字符 |

### 2. 不同模式的输入条件

#### 文生视频

- 只传入文本 Prompt。
- `ratio` 必须明确指定，不能使用 `adaptive`。
- 推荐使用 `16:9`、`9:16` 或 `1:1` 等常用比例。

#### 首帧/尾帧/首尾帧图生视频

- 可以只使用首帧图片。
- 可以只使用尾帧图片。
- 可以同时使用首帧和尾帧图片。
- 首帧和尾帧至少给一张。
- 图片支持 JPG、JPEG、PNG、WEBP、HEIC、HEIF。
- 单张图片不超过 30 MB。
- 图片宽高范围为 256～5760 像素。
- 图生视频通常使用 `adaptive`，由输入图片决定最终比例。

#### 多模态参考生视频

- 当前参考生视频技能要求至少提供 2 张参考图片（`--ref0` 和 `--ref1`）。
- 支持在此基础上加入参考图片、参考视频和参考音频。
- 最多支持 9 张参考图片、3 段参考视频和 3 段参考音频。
- 混合参考素材总数不超过 12 个。
- 脚本仅校验素材总数不超过 12 个，其余细分限制（数量、大小、时长）由网关强制。
- 单个视频不超过 50 MB，单段时长 2～15 秒，总时长不超过 15 秒。
- 单个音频不超过 15 MB，单段时长 2～15 秒，总时长不超过 15 秒。
- 视频和音频应使用公网 URL、`mm_file://` 地址或 `data:` URI。

### 3. 图片输入方式

图片参数（`--image`、`--last-image`、`--ref0`、`--ref1`、`--ref-image`）支持两种输入：

- **本地文件路径**：脚本会把文件读出并转为 `data:` URI 内嵌进提交请求（不是上传到服务器）。图片较大时请求体会膨胀约 33%（高分辨率图可能达到数 MB），大图建议先用下面的方式转成公网 URL 再传入。
- **公网 URL / URI**：`http://` / `https://` / `mm_file://` / `data:` URI，原样提交。

如果需要把本地图片转换为公网 URL，可以使用 OspreyAI 图床：

```text
https://pic.ospreyai.cn/
```

上传并取得公网 URL 后，把 URL 传给对应的图片参数即可。例如：

```text
https://pic.ospreyai.cn/i/2026/08/26/example.png
```

图片 URL 需要能够被 Osprey 网关访问。视频和音频请准备可访问的公网 URL（仅支持公网 URL、`mm_file://` 或 `data:` URI）。

---

## 四、工作流程

MiniMax H3 视频生成是异步过程，包含以下步骤：

1. 根据输入内容选择对应技能。
2. 提交视频生成任务。
3. 系统取得任务 ID，并自动查询任务状态。
4. 任务完成后从 `task.content.url` 获取成片地址，下载并保存 MP4 视频。成片地址为公网直链（OSS 预签名，下载无需 Bearer token），有时效，任务完成后应及时下载。

生成时间取决于视频时长、分辨率、参考素材和服务负载，通常 3～8 分钟，请等待任务完成，不要重复提交相同任务。

---

## 五、文生视频

### 1. 使用方式

适合没有参考图片或其他素材，只通过文字描述生成视频的场景。

自然语言示例：

```text
生成一段 5 秒的 16:9 视频：清晨的海边，金色阳光穿过薄雾，一只白色海鸥从礁石上起飞，镜头缓慢向前推进，画面电影感，带有海浪和风声。
```

### 2. 命令行示例

```bash
python scripts/text_to_video.py \
  --prompt "A cinematic sunrise at the seaside, golden sunlight through mist, a white seagull takes off from a rock, slow camera push-in, ocean waves and wind ambience" \
  --resolution 768P \
  --ratio 16:9 \
  --duration 5 \
  --output ./seaside.mp4
```

### 3. Prompt 编写建议

一个完整的视频 Prompt 可以包含：

```text
主体 + 动作 + 场景 + 镜头 + 光线 + 风格 + 声音
```

示例：

```text
主体：一位穿红色斗篷的女孩
动作：沿着积雪的森林小路缓慢行走
场景：冬日森林，远处有微弱灯光
镜头：中景跟拍，随后切换到面部近景
光线：冷蓝色月光与暖黄色灯光对比
风格：电影感、细腻、浅景深
声音：脚踩积雪的声音、轻微风声和远处钟声
```

整理成 Prompt：

```text
A girl in a red cloak walks slowly along a snow-covered forest path. Faint warm lights glow in the distance. Start with a medium tracking shot, then move into a close-up of her face. Cold blue moonlight contrasts with warm yellow lights. Cinematic, detailed, shallow depth of field. Include the sound of footsteps on snow, a gentle winter wind, and a distant bell.
```

---

## 六、首帧/尾帧/首尾帧图生视频

### 1. 使用方式

适合以下场景：

- 让一张静态图片自然动起来。
- 控制视频的起始画面（首帧）。
- 控制视频的结束画面（尾帧），由模型生成通向尾帧的过程。
- 指定开始和结束画面，并生成中间过渡过程（首尾帧）。
- 根据产品图、人物图或场景图生成动态展示视频。

### 2. 只使用首帧

自然语言示例：

```text
使用这张图片作为首帧，生成 5 秒产品展示视频。镜头缓慢推近，产品表面出现柔和高光，背景保持稳定，并加入轻微环境音。
```

命令行示例：

```bash
python scripts/image_to_video.py \
  --image first.png \
  --prompt "Use the input image as the first frame. Slowly push in toward the product, add soft highlights on the surface, keep the background stable, and include subtle ambient sound." \
  --resolution 768P \
  --duration 5 \
  --output ./product.mp4
```

### 3. 使用首帧和尾帧

自然语言示例：

```text
使用第一张图片作为首帧，第二张图片作为尾帧，生成 8 秒视频。镜头从室内桌面平滑移动到窗边，主体和光线自然过渡。
```

命令行示例：

```bash
python scripts/image_to_video.py \
  --image first.png \
  --last-image last.png \
  --prompt "Create an 8-second smooth cinematic transition from the first frame to the last frame. Move the camera naturally from the indoor desk toward the window while preserving the subject and lighting continuity." \
  --resolution 768P \
  --duration 8 \
  --output ./transition.mp4
```

### 4. 只使用尾帧

自然语言示例：

```text
使用这张图片作为尾帧，生成 5 秒视频。画面从模糊逐渐清晰，镜头缓缓稳定下来，最终定格在这张图上。配上轻柔的环境音。
```

命令行示例：

```bash
python scripts/image_to_video.py \
  --last-image ending.png \
  --prompt "The scene slowly resolves into this final frame, camera settling gently into the ending composition" \
  --resolution 768P \
  --duration 5 \
  --output ./ending.mp4
```

### 5. 使用图片公网 URL

如果图片已经上传到 `pic.ospreyai.cn`，可以直接使用 URL：

```bash
python scripts/image_to_video.py \
  --image "https://pic.ospreyai.cn/i/2026/08/26/first.png" \
  --last-image "https://pic.ospreyai.cn/i/2026/08/26/last.png" \
  --prompt "Smoothly transition from the first image to the last image with a slow cinematic camera move." \
  --duration 8 \
  --output ./transition.mp4
```

---

## 七、多模态参考生视频

### 1. 使用方式

多模态参考生视频不是简单地把参考图作为首帧，而是让模型参考素材中的角色、场景、动作、画面风格、声音或节奏，生成新的完整视频。

适合以下场景：

- 根据人物参考图生成角色一致的视频。
- 根据场景参考图生成同风格画面。
- 结合参考视频生成相似动作或镜头节奏。
- 结合参考音频生成具有相似音色或声音表现的视频。

### 2. 使用参考图片

```bash
python scripts/reference_to_video.py \
  --ref0 character.png \
  --ref1 scene.png \
  --prompt "Use reference image 1 for the character appearance and reference image 2 for the environment. Create a cinematic scene in which the character walks through the environment and looks toward the camera." \
  --resolution 768P \
  --ratio 16:9 \
  --duration 5 \
  --output ./reference-video.mp4
```

建议在 Prompt 中说明各参考素材的用途，例如：

```text
Reference image 1 defines the character appearance.
Reference image 2 defines the environment and color palette.
Keep the character identity consistent and create a natural camera movement.
```

### 3. 使用参考图片、视频和音频

```bash
python scripts/reference_to_video.py \
  --ref0 character.png \
  --ref1 scene.png \
  --ref-video-url "https://example.com/motion-reference.mp4" \
  --ref-audio-url "https://example.com/voice-reference.mp3" \
  --prompt "Use the reference images for the character and environment, follow the motion rhythm of the reference video, and use the reference audio as the voice style. Create a polished cinematic performance." \
  --resolution 768P \
  --ratio adaptive \
  --duration 8 \
  --output ./multimodal-reference.mp4
```

### 4. 使用图片公网 URL

```bash
python scripts/reference_to_video.py \
  --ref0 "https://pic.ospreyai.cn/i/2026/08/26/character.png" \
  --ref1 "https://pic.ospreyai.cn/i/2026/08/26/scene.png" \
  --prompt "Use reference image 1 for the character and reference image 2 for the setting. Generate a cinematic scene with consistent identity and natural motion." \
  --duration 5 \
  --output ./character-scene.mp4
```

---

## 八、常用参数

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `--prompt` | 视频描述，必填 | 无 |
| `--resolution` | `768P` 或 `2K` | `768P` |
| `--ratio` | 视频比例 | 文生视频为 `16:9`，图生视频/参考生视频为 `adaptive` |
| `--aspect-ratio` | `--ratio` 的兼容写法 | 同 `--ratio` |
| `--duration` | 视频时长，4～15 秒整数 | `5` |
| `--output` | MP4 保存路径 | 当前目录，文件名按技能为 `minimax_h3_t2v.mp4` / `minimax_h3_i2v.mp4` / `minimax_h3_r2v.mp4` |
| `--timeout` | 任务轮询超时时间 | `600` 秒 |
| `--gw` | Osprey 网关地址 | `https://open.ospreyai.cn` |
| `--api-key` | Osprey 网关 API key | 使用 `API_KEY` |

图片技能额外参数：

| 技能 | 参数 |
| --- | --- |
| 首帧/尾帧/首尾帧图生视频 | `--image`、`--last-image` |
| 多模态参考生视频 | `--ref0`、`--ref1`、`--ref-image`、`--ref-video-url`、`--ref-audio-url` |

---

## 九、推荐指令模板

### 1. 文生视频

```text
生成一段【时长】秒、【比例】的视频：
主体：【人物/动物/物体】
动作：【动作过程】
场景：【环境和时间】
镜头：【景别、运镜、镜头变化】
光线：【光线和色彩】
风格：【电影感/广告感/纪实感/动画风格等】
声音：【环境音、对白、音乐或音效】
输出为【分辨率】。
```

### 2. 首帧图生视频

```text
使用这张图片作为首帧，生成一段【时长】秒视频。
保持主体的外观、构图和主要环境不变。
动作：【主体如何运动】
镜头：【如何运镜】
光线：【光线变化】
声音：【环境音和音效】
```

### 3. 首尾帧图生视频

```text
使用第一张图片作为首帧，第二张图片作为尾帧。
生成一段【时长】秒的视频，让画面从第一张自然过渡到第二张。
过渡方式：【镜头移动/人物行走/季节变化/场景转换】
保持：【人物身份、主体形状、色彩风格】
声音：【环境音、音乐或音效】
```

### 4. 多模态参考生视频

```text
参考图片 1：【角色/人物/物体用途】
参考图片 2：【场景/服装/风格用途】
参考视频：【动作/运镜/节奏用途】
参考音频：【声音/音色/情绪用途】

请根据以上参考素材生成一段视频：
主体：【主体描述】
动作：【动作描述】
镜头：【镜头描述】
风格：【视觉风格】
声音：【声音要求】
```

---

## 十、常见问题

| 问题现象 | 可能原因 | 解决方案 |
| --- | --- | --- |
| 提示缺少 `API_KEY` | 未设置网关密钥 | 设置 `API_KEY` 或使用 `--api-key` |
| 返回 401 | API key 无效或过期 | 检查 Osprey 网关密钥 |
| 返回 400 | 参数格式错误 | 检查 Prompt、图片地址、比例和时长 |
| 文生视频提交失败 | `ratio` 使用了 `adaptive` | 文生视频使用明确比例，例如 `16:9` |
| 图生视频提交失败 | 图片地址不可访问或超过限制 | 检查图片 URL、格式和 30 MB 大小限制 |
| 参考生视频提交失败 | 参考素材过多或 URL 不可访问 | 检查素材数量、URL 和单文件限制 |
| 任务长时间没有完成 | 服务繁忙或素材较复杂 | 等待任务完成，必要时提高 `--timeout` |
| 任务失败 | Prompt 或素材不符合服务要求 | 根据返回的错误信息调整内容后重新提交 |
| 视频下载失败 | 成片地址已过期或网络中断 | 重新查询任务获取新的 `task.content.url` 并及时下载 |
| 输出文件找不到 | `--output` 路径不正确 | 使用绝对路径或确认当前工作目录 |

---

## 十一、接口流程说明

Osprey MiniMax H3 技能使用以下两个接口：

```text
POST https://open.ospreyai.cn/v2/video_generation          # 创建任务
GET  https://open.ospreyai.cn/v2/query/video_generation/{task_id}  # 查询任务并获取 task.content.url
```

创建任务时使用 MiniMax H3 模型：

```json
{
  "model": "MiniMax-H3",
  "content": [
    {
      "type": "text",
      "text": "A cinematic scene..."
    }
  ],
  "resolution": "768P",
  "duration": 5,
  "ratio": "16:9"
}
```

任务成功后，从查询结果的 `task.content.url` 字段获取成片地址（OSS 预签名直链，无需 Bearer token，有时效，过期可重新查询获取），用 `curl -L` 或脚本下载保存。

当前 Osprey MiniMax H3 能力范围仅包含上述两个接口：创建视频生成任务、查询视频生成任务。官方文档中的 `callback_url` 回调、`aigc_watermark` 水印、任务列表、任务取消/删除、H3-Context-IR 和视频再生成等能力，当前网关部署不支持，不在本手册覆盖范围内。

---

## 十二、更新日志

| 版本 | 日期 | 更新内容 |
| --- | --- | --- |
| v1.2.0 | 2026-08-27 | 下载改回 `task.content.url`（OSS 预签名直链，无需 token）；注明 2K 当前网关暂不支持，仅 768P 可用；新增仅尾帧图生视频说明 |
| v1.1.0 | 2026-08-26 | 明确网关不支持 callback_url/aigc_watermark 等官方扩展能力 |
| v1.0.0 | 2026-08-26 | 新增 Osprey MiniMax H3 用户手册：文生视频、首帧/首尾帧图生视频、多模态参考生视频说明，图片输入方式、常用参数、Prompt 模板和常见问题 |
