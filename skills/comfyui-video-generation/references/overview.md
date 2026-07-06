# ComfyUI 视频生成概览

## 服务地址

- `http://192.168.1.236:8188`

## 核心流程

1. 上传输入图片到 `POST /upload/image`
2. 通过 `POST /prompt` 提交视频工作流
3. 通过 `GET /queue` 轮询任务状态
4. 通过 `GET /history` 或实际文件名确认输出
5. 通过 `GET /view` 下载 mp4

## 环境约定

- 用户目录：`/data/file/`
- 输出视频通常位于 ComfyUI 侧的 `video` 子目录
- 首次使用前应确保视频生成技能已加载

## 工作流依赖

当前手册示例依赖以下典型节点：

- `CLIPLoader`
- `VAELoader`
- `UNETLoader`
- `LoadImage`
- `WanImageToVideo`
- `CreateVideo`
- `SaveVideo`
- `KSamplerAdvanced`
- `LoraLoaderModelOnly`
- `ModelSamplingSD3`

## 默认输出参数

- 分辨率：`640x640`
- 帧数：`81`
- 帧率：`16 fps`
- 时长：约 5 秒
- 格式：MP4
