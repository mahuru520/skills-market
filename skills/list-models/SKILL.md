---
name: list-models
description: 查询模型供应商提供的可用模型列表，并支持添加/调整模型配置。当用户要求查看供应商全部模型、查看更多模型选项、列出可用模型、或添加/配置模型时使用。
---

# 模型供应商管理

本技能用于查询配置中模型供应商提供的所有可用模型，并支持动态添加或调整模型配置。

## 适用场景

- 用户说"查看供应商下还有哪些模型"
- 用户说"查看所有可用模型"
- 用户说"查询模型列表"
- 用户说"添加模型到配置"
- 用户说"配置新模型"

## 查询步骤

### 1. 获取供应商配置

从配置文件读取当前配置的供应商信息：

```json
{
  "action": "config.get"
}
```

找到 `models.providers.<providerName>`，获取：
- `baseUrl`: API 基础地址
- `apiKey`: API 密钥

### 2. 调用模型列表 API

使用 curl 请求供应商的模型列表接口：

```bash
curl -H "Authorization: Bearer <API_KEY>" "<BASE_URL>models"
```

**不同供应商的 BASE_URL 示例：**

| 供应商 | BASE_URL |
|--------|----------|
| ospreyai_tokens (mini-tokens) | `https://mini-tokens.ospreyai.cn/api/OspreyAi/RequestModel/v1/` |
| ospreyai_tokens (open.ospreyai.cn) | `https://open.ospreyai.cn/v1/` |
| 自定义 IP:Port | `http://211.93.0.206:10027/v1/` |

**完整命令示例：**

```bash
# Windows
curl.exe -s -H "Authorization: Bearer sk-xxx" "https://mini-tokens.ospreyai.cn/api/OspreyAi/RequestModel/v1/models"

# Linux/Mac
curl -s -H "Authorization: Bearer sk-xxx" "https://mini-tokens.ospreyai.cn/api/OspreyAi/RequestModel/v1/models"
```

### 3. 解析结果

API 返回 JSON 格式的模型列表，包含：
- `id`: 模型 ID
- `object`: 类型 (model)
- `owned_by`: 来源 (custom/openai)
- `supported_endpoint_types`: 支持的接口类型

### 4. 对比已配置模型

从配置中读取当前已配置的模型 ID：
```json
{
  "action": "config.schema.lookup",
  "path": "models.providers.<providerName>.models"
}
```

在列表中标记已配置的模型（✅ 已配置）

## 添加模型到配置

### 步骤 1: 准备模型配置

从 API 返回的模型列表中，选择要添加的模型 ID，然后构建模型配置：

```json
{
  "id": "<模型ID>",
  "name": "<模型ID>",
  "reasoning": false,
  "input": ["text"],
  "cost": {
    "input": 0,
    "output": 0,
    "cacheRead": 0,
    "cacheWrite": 0
  },
  "contextWindow": 200000,
  "maxTokens": 8192
}
```

**注意：**
- `contextWindow` 和 `maxTokens` 需要根据实际使用情况设置，默认使用 200K/8K
- 如果是视觉模型，input 应为 `["text", "image"]`

### 步骤 2: 读取当前配置

```json
{
  "action": "config.get"
}
```

提取 `models.providers.<providerName>.models` 数组

### 步骤 3: 应用新配置

使用 `config.apply` 写入完整配置（包含新增的模型），或者使用 `config.patch` 进行部分更新。

**config.apply 示例：**
```json
{
  "action": "config.apply",
  "raw": {
    "models": {
      "providers": {
        "ospreyai_tokens": {
          "models": [
            /* 现有模型 + 新模型 */
          ]
        }
      }
    },
    "agents": {
      "defaults": {
        "models": {
          "ospreyai_tokens/<新模型ID>": {}
        }
      }
    }
  },
  "reason": "添加新模型到配置"
}
```

**config.patch 示例：**
```json
{
  "action": "config.patch",
  "patch": {
    "models": {
      "providers": {
        "ospreyai_tokens": {
          "models": [
            {
              "id": "glm-4.7-fp8",
              "name": "glm-4.7-fp8",
              "reasoning": false,
              "input": ["text"],
              "cost": {"input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0},
              "contextWindow": 200000,
              "maxTokens": 8192
            }
          ]
        }
      }
    }
  }
}
```

## 动态获取配置示例

### 获取指定供应商的 baseUrl 和 apiKey

```json
{
  "action": "config.schema.lookup",
  "path": "models.providers.ospreyai_tokens"
}
```

返回结果包含：
- `baseUrl`: API 基础地址
- `apiKey`: API 密钥（被脱敏显示为 `__OPENCLAW_REDACTED__`）

如果需要用真实 API Key 调用 API，可以：
1. 直接从配置文件读取（如果可访问）
2. 或者让用户提供 API Key

## 注意事项

- API Key 必须从配置文件读取，不要硬编码
- 不同供应商的 BASE_URL 可能不同，确保使用正确的地址
- 某些模型可能是 Embedding 或 Reranker 类型，不适合对话
- 如果 API 返回 401/403 错误，检查 API Key 是否有效
- 添加模型后需要等待网关重启（config.apply 会自动触发重启）
- 同时需要在 `agents.defaults.models` 中注册新模型才能使用

## 常见问题

**Q: 如何知道供应商的 baseUrl？**
A: 从配置文件的 `models.providers.<名称>.baseUrl` 获取。

**Q: API Key 看不到怎么办？**
A: 配置中 API Key 被脱敏显示，可以直接用配置中的 key 测试调用，或者让用户提供。

**Q: 添加模型后无法使用？**
A: 确保同时在 `agents.defaults.models` 中注册了该模型。
