# 队列、历史与下载

## 查看队列状态

```bash
curl -s "http://192.168.1.236:8188/queue"
```

## 获取历史与输出文件名

```bash
curl -s "http://192.168.1.236:8188/history"
```

## 下载图片

```bash
curl -s "http://192.168.1.236:8188/view?filename=output_00001_.png" -o /data/file/output.png
```

## 下载约定

- 输出格式默认是 PNG
- 推荐下载到 `/data/file/`
- 下载前先通过 `/history` 确认文件名
