# 常见问题排查

## 问题列表

### 1. 未找到配置文件

**错误信息**：
```
❌ 未找到 ospreyai provider 配置
```

**原因**：配置文件中缺少 `models.providers.ospreyai` 路径

**解决方案**：
- 检查 `openclaw.json` 文件是否存在
- 确认文件包含 `models.providers.ospreyai` 配置
- 检查文件路径是否正确

---

### 2. 没有需要更新的模型

**错误信息**：
```
ℹ️  没有需要更新的模型
```

**原因**：PRICE_MAP 中没有配置与配置文件匹配的模型 ID

**解决方案**：
- 检查 `update-prices.js` 中的 PRICE_MAP
- 确认 PRICE_MAP 中的模型 ID 与配置文件中的 id 字段一致
- 如果是新模型，需要先在 PRICE_MAP 中添加

---

### 3. 权限错误

**错误信息**：
```
❌ 更新失败: EACCES: permission denied
```

**原因**：没有写入配置文件的权限

**解决方案**：
- 检查文件权限设置
- 确保当前用户有写入权限
- 检查文件是否被其他进程锁定

---

### 4. JSON 解析错误

**错误信息**：
```
❌ 更新失败: Unexpected token
```

**原因**：配置文件格式不正确

**解决方案**：
- 检查 `openclaw.json` 是否为有效的 JSON 格式
- 检查是否有语法错误（如多余的逗号、引号不匹配等）

---

### 5. 价格未生效

**问题**：更新脚本执行成功，但价格未生效

**原因**：Gateway 未重启

**解决方案**：
- 执行 `gateway restart` 重启 Gateway
- 确认重启成功

## 调试步骤

1. **检查配置文件是否存在**：
   ```bash
   ls -la openclaw.json
   ```

2. **检查配置文件格式**：
   ```bash
   cat openclaw.json | jq .
   ```

3. **手动执行脚本并查看详细输出**：
   ```bash
   node -e "require('./skills/model-price-updater/update-prices.js')"
   ```

4. **检查 Gateway 状态**：
   ```bash
   gateway status
   ```
