# 完整示例

## 生成小狗图片

```bash
RESPONSE=$(curl -s -X POST "http://192.168.1.236:8188/prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": {
      "62": {"inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}, "class_type": "CLIPLoader"},
      "63": {"inputs": {"vae_name": "ae.safetensors"}, "class_type": "VAELoader"},
      "66": {"inputs": {"unet_name": "z_image_bf16.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
      "67": {"inputs": {"text": "A cute fluffy golden retriever puppy, big shiny eyes, sitting on grass, sunny day, photorealistic", "clip": ["62", 0]}, "class_type": "CLIPTextEncode"},
      "68": {"inputs": {"width": 1024, "height": 1024, "batch_size": 1}, "class_type": "EmptySD3LatentImage"},
      "69": {"inputs": {"seed": 12345, "steps": 30, "cfg": 4.5, "sampler_name": "res_multistep", "scheduler": "simple", "denoise": 1, "model": ["70", 0], "positive": ["67", 0], "negative": ["71", 0], "latent_image": ["68", 0]}, "class_type": "KSampler"},
      "70": {"inputs": {"shift": 3, "model": ["66", 0]}, "class_type": "ModelSamplingAuraFlow"},
      "71": {"inputs": {"text": "blurry, low quality, distorted", "clip": ["62", 0]}, "class_type": "CLIPTextEncode"},
      "65": {"inputs": {"samples": ["69", 0], "vae": ["63", 0]}, "class_type": "VAEDecode"},
      "9": {"inputs": {"filename_prefix": "puppy", "images": ["65", 0]}, "class_type": "SaveImage"}
    }
  }')

echo "$RESPONSE"
sleep 30
curl -s "http://192.168.1.236:8188/view?filename=puppy_00001_.png" -o /data/file/小狗.png
```
