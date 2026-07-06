# 参数与提示词建议

## 参数建议

| 参数 | 建议 | 说明 |
|------|------|------|
| width | 1024 | 图片宽度 |
| height | 1024 | 图片高度 |
| steps | 25–35 | 采样步数，越高越精细，30 为推荐值 |
| cfg | 4–7 | CFG 强度，4.5 为推荐值 |
| seed | 任意整数 | 固定可复现；修改可生成变体 |
| sampler_name | `res_multistep` | 推荐采样器 |
| scheduler | `simple` | 推荐调度器 |
| denoise | 1 | 去噪强度，1 表示完全去噪 |

## 提示词建议

1. 英文提示词效果更稳定
2. 负向提示词可保持默认或补充不想出现的元素
3. 同一 prompt 更换 seed 可得到不同构图

## 示例提示词

### 宠物

```text
A cute fluffy golden retriever puppy, big shiny eyes, soft fluffy fur, sitting on green grass, sunny day, photorealistic, high quality
```

### 风景

```text
A beautiful sunset over the ocean, golden hour, dramatic clouds, orange and purple sky, professional photography
```

### 人物

```text
A portrait of a woman, soft natural lighting, detailed skin, professional photography, 8k
```

### 建筑

```text
A modern glass skyscraper, sunlight reflecting on glass, blue sky background, architectural photography
```
