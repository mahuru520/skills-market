---
name: ragflow-knowledge-qa
description: 通过 RAGFlow 企业知识库进行问答检索。当用户询问知识库相关内容、方案细节、产品信息时使用此技能。触发词：知识库问答、知识库检索、问答、查一下这个方案。
---

# RAGFlow 知识库问答

通过 RAGFlow 企业知识库检索并回答问题。

## 知识库配置

- **服务器**: http://192.168.150.202:1280
- **知识库ID**: e8192f4e03cc11f1b8700ed4340b7097
- **API Key**: ragflow-IwNmU1NDBjYTY2NDExZjA5MWZkM2FkND

## 知识库文档

1. 短剧AI数字人自动化生产解决方案 - 企业汇报PPT框架架.md
2. AI短剧制作Agent平台：产品策划报告.pdf
3. AI短剧制作Agent平台：产品策划报告.md
4. AI漫画工作室流程说明(1).docx
5. AI漫画工作室流程图说明(1).pdf
6. AI工具影剧算力研讨会内容.docx

## 检索 API

```bash
curl -s -X POST "http://192.168.150.202:1280/api/v1/datasets/e8192f4e03cc11f1b8700ed4340b7097/chunks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ragflow-IwNmU1NDBjYTY2NDExZjA5MWZkM2FkND" \
  -d '{
    "question": "用户问题",
    "document_ids":[],
    "top_k": 5
  }'
```

## 执行步骤

1. 提取用户问题
2. 调用上述 API 进行检索
3. 解析返回结果，提取 chunk.content
4. 基于检索内容回答用户问题
5. 可选：标注参考文档来源
