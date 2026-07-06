# md-to-pdf 转换指南

## 手动转换

### 步骤 1：MD 转 HTML
```bash
pandoc input.md -t html -s -o input.html
```

### 步骤 2：HTML 转 PDF
```bash
wkhtmltopdf --enable-local-file-access input.html output.pdf
```

## 使用脚本转换

### 单文件转换
```bash
bash scripts/md2pdf.sh input.md output.pdf
```

### 简化用法（自动命名）
```bash
bash scripts/md2pdf.sh input.md
# 自动生成 input.pdf
```

## 批量转换

```bash
for f in *.md; do
    bash scripts/md2pdf.sh "$f"
done
```

## 输入输出说明

- 输入：`.md` 文件（UTF-8 编码）
- 输出：`.pdf` 文件
- 临时文件：转换过程中会创建临时 HTML 文件，转换完成后自动删除

## 注意事项

- 确保输入文件为 UTF-8 编码，否则中文可能乱码
- 本地图片需要使用相对路径或绝对路径
- 大型文档转换可能需要较长时间
