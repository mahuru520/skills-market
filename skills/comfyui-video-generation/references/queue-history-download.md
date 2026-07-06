# 队列、历史与下载

## 查看队列状态

```bash
curl -s "http://192.168.1.236:8188/queue"
```

视频生成通常需要 1–2 分钟。

## 查看历史

```bash
curl -s "http://192.168.1.236:8188/history"
```

## 下载视频

### 直接下载（英文文件名）

```bash
curl -s "http://192.168.1.236:8188/view?filename=video/output.mp4&subfolder=video&type=output" -o /data/file/output.mp4
```

### 中文文件名下载

中文文件名需要使用 Python 方式处理 URL 编码：

```bash
python3 << 'EOF'
import urllib.request
import urllib.parse

params = urllib.parse.urlencode({
    "filename": "你的视频名_00001_.mp4",
    "subfolder": "video",
    "type": "output"
})

url = f"http://192.168.1.236:8188/view?{params}"
data = urllib.request.urlopen(url).read()

with open("/data/file/你的视频.mp4", "wb") as f:
    f.write(data)
print(f"下载完成，大小: {len(data)} bytes")
EOF
```

## 下载约定

- 输出格式默认是 MP4
- 视频通常位于 ComfyUI 的 `video` 子目录，需带 `subfolder=video&type=output` 参数
- 推荐下载到 `/data/file/`
- 下载前先通过 `/history` 确认实际输出文件名
