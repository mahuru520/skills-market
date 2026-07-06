# 参数与提示词建议

## 参数建议

| 参数 | 建议 | 说明 |
|------|------|------|
| 输入图片 | 推荐 PNG | 图片会被缩放到指定宽高 |
| width | 640 | 输出视频宽度 |
| height | 640 | 输出视频高度 |
| length | 81 | 视频帧数，81 帧 @16fps ≈ 5 秒 |
| fps | 16 | 帧率 |
| steps | 4 | 固定 4 步（配合 LightX2V LoRA 加速） |
| cfg | 1 | CFG 强度，固定为 1 |
| sampler_name | `euler` | 采样器，固定 |
| scheduler | `simple` | 调度器，固定 |
| 正向提示词 | 英文动作描述 | 描述想要的运动效果 |
| 负向提示词 | 保持手册默认值 | 防止静态、模糊、变形等不良效果 |

## 输出视频参数

- **分辨率**: 640×640
- **帧数**: 81 帧
- **帧率**: 16 fps
- **时长**: 约 5 秒
- **格式**: MP4

## 提示词示例

### 飞行类

```text
The flying pig with superhero cape flaps its wings happily, flying upward through the clouds, gentle movement, joyful atmosphere
```

### 人物类

```text
A woman walking slowly on the beach, gentle waves, sunset background, natural movement
```

### 动物类

```text
A cute cat running in the grass, playful, tail wagging, sunny day
```

### 风景类

```text
Clouds drifting slowly, mountains in background, peaceful atmosphere, gentle movement
```

### 负向提示词（推荐保持默认）

```text
色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸变的肢体，手指融合，静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走
```
