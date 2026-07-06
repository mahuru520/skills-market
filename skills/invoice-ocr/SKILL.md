---
name: dify-invoice-ocr
description: 使用 Dify 工作流进行发票 OCR 识别。支持上传 PDF/图片文件，调用 Dify API 进行发票识别，并输出 CSV/JSON 格式结果。用于：(1) 批量识别发票文件 (2) 提取发票信息 (3) 将发票数据导出为 CSV
---

# Dify 发票 OCR 识别

使用 Dify 工作流批量识别发票（PDF/图片），提取发票信息并导出为 CSV。

## 配置

运行前修改 `scripts/dify_invoice.py` 中的配置：

```python
DIFY_BASE_URL = "http://192.168.1.236/v1"  # Dify 服务器地址
AUTH_TOKEN = "your-api-key"                 # API Key
USER = "invoice-bot"                        # 用户标识
```

## 使用方法

```bash
# 命令行运行
python dify_invoice.py "发票目录路径"
```

或修改代码中的 `invoice_dir` 变量指定发票目录。

## 输出

- `result/md/*.md` - 各个发票的识别结果
- `result/json/*.json` - JSON 格式结果
- `result/invoices.csv` - 合并的 CSV 文件

## CSV 字段

- filename, invoice_title, invoice_number, issue_date
- buyer_name, buyer_tax_id, seller_name, seller_tax_id
- item_name, item_quantity, item_unit_price, item_amount
- item_tax_rate, item_tax_amount
- total_exclusive_tax, total_tax, total_inclusive_tax
- total_in_words, remarks, issuer
