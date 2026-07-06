# Changelog

本文件记录 comfyui-image-generation 技能的变更。格式参考 [Keep a Changelog](https://keepachangelog.com/)。

## [2.0.0] - 2026-06-25

### Changed
- 内网 API `http://192.168.1.236:8188` 迁移至外网网关 `https://ai.ospreyai.cn`
- 提交接口由 `POST /prompt` 改为 `POST /api/v1/ai/image/generate`（请求体不变）
- 队列查询改为 `GET /api/v1/ai/queue`
- 历史查询由 `GET /history` 改为 `GET /api/v1/ai/tasks/{prompt_id}`（需自行记录 prompt_id）
- 图片下载改为 `GET /api/v1/ai/image/view/?filename=`

### Added
- 429 限流退避（网关 10 次/分/IP，突发 5）
- 环境变量 `GW` 与 `API_KEY` 配置说明

## [1.0.0] - 2026-01-01

### Added
- 初始版本，调用内网 ComfyUI 文生图工作流
