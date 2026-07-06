# 价格数据来源

## 数据来源

价格数据来源于 ospreyai.cn 的定价页面：https://open.ospreyai.cn/pricing

## 数据维护

由于当前脚本不支持自动抓取网页价格，价格数据需要手动维护在 `update-prices.js` 的 `PRICE_MAP` 中。

## 更新流程

1. 访问 https://open.ospreyai.cn/pricing 查看最新价格
2. 更新 `update-prices.js` 中的 `PRICE_MAP`
3. 执行 `node update-prices.js` 更新配置文件
4. 重启 Gateway 使配置生效

## 价格单位

所有价格单位为 **$/M**，即每百万 tokens 的美元价格。

## 价格字段说明

| 字段 | 说明 |
|------|------|
| input | 输入价格（每百万 tokens） |
| output | 输出价格（每百万 tokens） |
| cacheRead | Cache 读取价格（每百万 tokens） |
| cacheWrite | Cache 写入价格（每百万 tokens） |
