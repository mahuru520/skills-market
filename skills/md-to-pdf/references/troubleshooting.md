# md-to-pdf 故障排查

## 常见问题

### wkhtmltopdf 显示 "libjpeg.so.8 not found"

**原因**：系统 libjpeg 版本不匹配

**解决方案**：使用 Debian 11 (bullseye) 版本的 wkhtmltopdf
```bash
dpkg -i packages/wkhtmltopdf/wkhtmltox_0.12.6.1-2.bullseye_amd64.deb
```

### PDF 中文字体显示不正常

**解决方案**：
```bash
apt-get install -y fonts-wqy-zenhei
fc-cache -f
```

### 中文 PDF 乱码

**检查项**：
1. HTML 文件编码是否为 UTF-8
2. 中文字体是否已安装
3. 尝试重新生成 PDF

### "libssl1.1: cannot open shared object file"

Debian 12 缺少 libssl1.1，需要先安装兼容包：
```bash
dpkg -i packages/wkhtmltopdf/libssl1.1_1.1.1f-1ubuntu2_amd64.deb
apt-get install -f -y
```

### 本地图片无法显示

确保使用 `--enable-local-file-access` 参数：
```bash
wkhtmltopdf --enable-local-file-access input.html output.pdf
```

### 转换失败无错误信息

检查输入文件是否存在，路径是否正确。
