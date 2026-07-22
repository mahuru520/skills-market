# 迁移后的工作流调用

## 配置环境变量

```bash
export GW="https://ai.ospreyai.cn"
export API_KEY="sk-xxx"
```

## 提交文生图任务

```bash
curl -s -X POST "$GW/api/v1/ai/image/generate" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":{...}}'
```

请求体 `prompt` 工作流 JSON 与内网版本保持不变（见根 SKILL.md Route A 节点表）。

## 轮询队列

```bash
curl -s "$GW/api/v1/ai/queue" -H "Authorization: Bearer $API_KEY"
```

## 查任务（按 prompt_id）

> 注意：网关为 `GET /api/v1/ai/tasks/{prompt_id}`，提交任务时返回的 `prompt_id` 需自行记录。

```bash
curl -s "$GW/api/v1/ai/tasks/$PROMPT_ID" -H "Authorization: Bearer $API_KEY"
```

## 下载图片

```bash
OUT=$(bash skills/user-initialization/scripts/get-output-dir.sh --mkdir)
curl -s "$GW/api/v1/ai/image/view/?filename=output.png" \
  -H "Authorization: Bearer $API_KEY" -o "$OUT/output.png"
```

## 429 限流退避

网关限流 10 次/分/IP（突发 5），轮询时建议间隔 5–10 秒并实现指数退避。
