# 完整示例

## 生成飞天小猪视频

```bash
curl -s -X POST "http://192.168.1.236:8188/upload/image" \
  -F "image=@/data/file/飞天小猪.png" \
  -F "type=input"

curl -s -X POST "http://192.168.1.236:8188/prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "93": {"inputs": {"text": "The flying pig with superhero cape flaps its wings happily, flying upward through the clouds, gentle movement, joyful atmosphere, wings flapping, clouds drifting, smooth animation", "clip": ["84", 0]}, "class_type": "CLIPTextEncode"},
      "97": {"inputs": {"image": "飞天小猪.png"}, "class_type": "LoadImage"},
      "98": {"inputs": {"width": 640, "height": 640, "length": 81, "batch_size": 1, "positive": ["93", 0], "negative": ["89", 0], "vae": ["90", 0], "start_image": ["97", 0]}, "class_type": "WanImageToVideo"},
      "94": {"inputs": {"fps": 16, "images": ["87", 0]}, "class_type": "CreateVideo"},
      "108": {"inputs": {"filename_prefix": "video/飞天小猪", "format": "auto", "codec": "auto", "video-preview": "", "video": ["94", 0]}, "class_type": "SaveVideo"}
    }
  }'

sleep 90

python3 << 'EOF'
import urllib.request
import urllib.parse

params = urllib.parse.urlencode({
    "filename": "飞天小猪_00001_.mp4",
    "subfolder": "video",
    "type": "output"
})

url = f"http://192.168.1.236:8188/view?{params}"
data = urllib.request.urlopen(url).read()

with open("/data/file/飞天小猪.mp4", "wb") as f:
    f.write(data)
EOF
```
