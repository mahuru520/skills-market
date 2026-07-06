# 更新流程详解

## 手动执行流程

### 步骤 1：执行更新脚本

```bash
node skills/model-price-updater/update-prices.js
```

脚本会：
1. 读取 `openclaw.json` 配置文件
2. 遍历 ospreyai provider 下的模型
3. 根据 PRICE_MAP 更新匹配的模型价格
4. 将更新写入配置文件

### 步骤 2：验证更新

脚本输出示例：
```
🔄 正在读取配置文件...
✅ minimax-m2.5: 输入 $1.80/M, 输出 $6.48/M
✅ glm-latest: 输入 $1.80/M, 输出 $1.62/M

📝 已更新 2 个模型价格
💡 请手动重启 Gateway 使配置生效
   使用命令: gateway restart
```

### 步骤 3：重启 Gateway

```bash
gateway restart
```

## 定时任务流程

### 添加定时任务

```bash
cron add --name model-price-updater --schedule "0 0 * * *" --message "从 ospreyai.cn 获取最新模型价格"
```

### 定时任务执行时间

- 每天午夜 00:00 执行
- 执行后需要手动重启 Gateway

## 配置文件结构

更新前的模型配置：
```json
{
  "id": "minimax-m2.5",
  "name": "MiniMax M2.5",
  "cost": {
    "input": 2.00,
    "output": 2.00,
    "cacheRead": 1.00,
    "cacheWrite": 1.00
  }
}
```

更新后的模型配置：
```json
{
  "id": "minimax-m2.5",
  "name": "MiniMax M2.5",
  "cost": {
    "input": 1.80,
    "output": 6.48,
    "cacheRead": 0.90,
    "cacheWrite": 0.90
  }
}
```
