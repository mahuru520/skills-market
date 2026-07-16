#!/usr/bin/env python3
"""
ComfyUI FLUX.2-klein Reference Conditioning 图片编辑（公网网关版）
用法：
  python submit_and_poll.py --img1 <图1> --img2 <图2> --prompt "<提示词>" --output_prefix <输出前缀>
  python submit_and_poll.py --img1 <单图> --prompt "<提示词>" --output_prefix <输出前缀>  # 单图模式

环境变量：
  GW       — 网关地址，默认 https://ai.ospreyai.cn
  API_KEY  — 网关 new-api 的 sk-xxx
"""
import argparse
import json
import os
import time
import urllib.error
import urllib.request


GW = os.getenv("GW", "https://ai.ospreyai.cn")
API_KEY = os.getenv("API_KEY", "")

AUTH_HEADER = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}


def submit_prompt(prompt_data):
    payload = json.dumps({"prompt": prompt_data}).encode("utf-8")
    req = urllib.request.Request(
        f"{GW}/api/v1/ai/image/generate",
        data=payload,
        headers=AUTH_HEADER,
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def poll_task(prompt_id, timeout=300, interval=5):
    for i in range(int(timeout / interval)):
        req = urllib.request.Request(
            f"{GW}/api/v1/ai/tasks/{prompt_id}",
            headers=AUTH_HEADER,
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        if prompt_id in data:
            status = data[prompt_id]["status"]["status_str"]
            elapsed = (i + 1) * interval
            print(f"[{elapsed}s] {status}")
            if status == "success":
                return data[prompt_id]
        time.sleep(interval)
    return None


def build_prompt(img1, img2, prompt_text, output_prefix, seed=None):
    img2_effective = img2 if img2 else img1
    seed_val = seed if seed is not None else 720512742793301

    return {
        "122": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "126": {"class_type": "UNETLoader", "inputs": {"unet_name": "flux-2-klein-9b-kv-fp8.safetensors", "weight_dtype": "default"}},
        "133": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_8b_fp8mixed.safetensors", "type": "flux2", "device": "default"}},
        "138": {"class_type": "CFGGuider", "inputs": {"model": ["139", 0], "positive": ["132_121", 0], "negative": ["132_119", 0], "cfg": 1.0}},
        "127": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "135": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["133", 0], "text": prompt_text}},
        "139": {"class_type": "FluxKVCache", "inputs": {"model": ["126", 0]}},
        "123": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["125", 0], "guider": ["138", 0], "sampler": ["122", 0], "sigmas": ["137", 0], "latent_image": ["129", 0]}},
        "125": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed_val}},
        "124": {"class_type": "VAEDecode", "inputs": {"samples": ["123", 0], "vae": ["127", 0]}},
        "94":  {"class_type": "SaveImage", "inputs": {"images": ["124", 0], "filename_prefix": output_prefix}},
        "685": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["135", 0]}},
        "137": {"class_type": "Flux2Scheduler", "inputs": {"width": ["128", 0], "height": ["128", 1], "steps": 4}},
        "129": {"class_type": "EmptyFlux2LatentImage", "inputs": {"width": ["128", 0], "height": ["128", 1], "batch_size": 1}},
        "128": {"class_type": "GetImageSize", "inputs": {"image": ["130", 0]}},
        "130": {"class_type": "ImageScaleToTotalPixels", "inputs": {"image": ["76", 0], "upscale_method": "lanczos", "megapixels": 1.0, "resolution_steps": 1}},
        "131": {"class_type": "ImageScaleToTotalPixels", "inputs": {"image": ["81", 0], "upscale_method": "lanczos", "megapixels": 1.0, "resolution_steps": 1}},
        # 图1 → 主体参考 / 图2 → 服装参考（可同图实现局部编辑）
        "76": {"class_type": "LoadImage", "inputs": {"image": img1}},
        "81": {"class_type": "LoadImage", "inputs": {"image": img2_effective}},
        # Subgraph 134
        "134_116": {"class_type": "ReferenceLatent", "inputs": {"conditioning": ["685", 0], "latent": ["134_117", 0]}},
        "134_117": {"class_type": "VAEEncode", "inputs": {"pixels": ["130", 0], "vae": ["127", 0]}},
        "134_118": {"class_type": "ReferenceLatent", "inputs": {"conditioning": ["135", 0], "latent": ["134_117", 0]}},
        # Subgraph 132
        "132_119": {"class_type": "ReferenceLatent", "inputs": {"conditioning": ["134_116", 0], "latent": ["132_120", 0]}},
        "132_120": {"class_type": "VAEEncode", "inputs": {"pixels": ["131", 0], "vae": ["127", 0]}},
        "132_121": {"class_type": "ReferenceLatent", "inputs": {"conditioning": ["134_118", 0], "latent": ["132_120", 0]}},
    }


def main():
    parser = argparse.ArgumentParser(description="FLUX.2-klein 图生图编辑（公网网关版）")
    parser.add_argument("--img1", required=True, help="图1文件名（主体，已通过 upload 接口上传）")
    parser.add_argument("--img2", default=None, help="图2文件名（服装参考，可省略，等同图1）")
    parser.add_argument("--prompt", required=True, help="英文提示词")
    parser.add_argument("--output_prefix", required=True, help="输出文件名前缀")
    parser.add_argument("--seed", type=int, default=None, help="随机种子（可选）")
    parser.add_argument("--timeout", type=int, default=300, help="超时秒数（默认 300）")
    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: 请设置环境变量 API_KEY（网关 new-api 的 sk-xxx）")
        return

    print(f"=== FLUX.2-klein Image Edit ===")
    print(f"Gateway:           {GW}")
    print(f"Image 1 (subject): {args.img1}")
    print(f"Image 2 (outfit):  {args.img2 or args.img1}")
    print(f"Prompt:            {args.prompt}")
    print(f"Output prefix:     {args.output_prefix}")
    print()

    prompt_data = build_prompt(args.img1, args.img2, args.prompt, args.output_prefix, args.seed)
    print(f"Submitting ({len(prompt_data)} nodes)...")

    try:
        result = submit_prompt(prompt_data)
        prompt_id = result["prompt_id"]
        print(f"OK — prompt_id: {prompt_id}  queue: {result.get('number','?')}")
        if result.get("node_errors"):
            print(f"WARNING node_errors: {result['node_errors']}")
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:1000]}")
        return

    print("Polling...")
    hist = poll_task(prompt_id, timeout=args.timeout)
    if hist is None:
        print("Timeout!")
        return

    outputs = hist.get("outputs", {})
    print("\nResult:")
    for node_id, data in outputs.items():
        for img in data.get("images", []):
            fname = img["filename"]
            subfolder = img.get("subfolder", "")
            url = f"{GW}/api/v1/ai/image/view/?filename={fname}&type=output&subfolder={subfolder}"
            print(f"  {fname}")
            print(f"  {url}")

    print(f"\nDone.")


if __name__ == "__main__":
    main()
