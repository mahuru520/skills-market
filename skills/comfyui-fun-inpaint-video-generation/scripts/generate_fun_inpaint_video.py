#!/usr/bin/env python3
"""ComfyUI Wan 2.2 Fun Inpaint 首尾帧视频生成.

用首帧 + 尾帧两张图片,通过公网网关生成一段过渡视频(MP4)。
核心节点 WanFunInpaintToVideo,LightX2V 4 步加速,shift=8。

用法:
  python generate_fun_inpaint_video.py \
      --start start.png --end end.png \
      --prompt "A cat waking up and stretching" \
      --out fun_inpaint.mp4

API_KEY / GW 可用环境变量传入,也可用命令行参数覆盖。
输出目录优先级: --out 指定的父目录 > 环境变量 OUT > get-output-dir.sh > 当前目录。
"""
import argparse
import json
import os
import pathlib
import subprocess
import sys
import time

import requests

DEFAULT_GW = "https://ai.ospreyai.cn"
NEG_PROMPT = ("色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，"
              "整体发灰，最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，"
              "画得不好的手部，画得不好的脸部，畸形的，毁容的，形态畸变的肢体，手指融合，"
              "静止不动的画面，杂乱的背景，三条腿，背景人很多，倒着走")


def resolve_out_dir(out_arg):
    """确定输出目录: --out 父目录 > 环境变量 OUT > get-output-dir.sh > 当前目录."""
    if out_arg:
        return str(pathlib.Path(out_arg).resolve().parent)
    out = os.environ.get("OUT", "").strip()
    if out:
        return out
    here = pathlib.Path(__file__).resolve().parent
    helper = here.parent.parent / "user-initialization" / "scripts" / "get-output-dir.sh"
    try:
        res = subprocess.run(["bash", str(helper)], capture_output=True, text=True, timeout=5)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except Exception:
        pass
    return str(pathlib.Path.cwd())


def build_workflow(start_name, end_name, prompt, width, height, length, fps, seed, shift, prefix):
    """构建 Fun Inpaint 首尾帧工作流 JSON(17 节点)."""
    return {"prompt": {
        "90": {"inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default"}, "class_type": "CLIPLoader"},
        "91": {"inputs": {"text": NEG_PROMPT, "clip": ["90", 0]}, "class_type": "CLIPTextEncode"},
        "92": {"inputs": {"vae_name": "wan_2.1_vae.safetensors"}, "class_type": "VAELoader"},
        "93": {"inputs": {"shift": shift, "model": ["116", 0]}, "class_type": "ModelSamplingSD3"},
        "94": {"inputs": {"shift": shift, "model": ["117", 0]}, "class_type": "ModelSamplingSD3"},
        "95": {"inputs": {"add_noise": "disable", "noise_seed": 0, "steps": 4, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "start_at_step": 2, "end_at_step": 4, "return_with_leftover_noise": "disable", "model": ["94", 0], "positive": ["111", 0], "negative": ["111", 1], "latent_image": ["96", 0]}, "class_type": "KSamplerAdvanced"},
        "96": {"inputs": {"add_noise": "enable", "noise_seed": seed, "steps": 4, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "start_at_step": 0, "end_at_step": 2, "return_with_leftover_noise": "enable", "model": ["93", 0], "positive": ["111", 0], "negative": ["111", 1], "latent_image": ["111", 2]}, "class_type": "KSamplerAdvanced"},
        "97": {"inputs": {"samples": ["95", 0], "vae": ["92", 0]}, "class_type": "VAEDecode"},
        "99": {"inputs": {"text": prompt, "clip": ["90", 0]}, "class_type": "CLIPTextEncode"},
        "100": {"inputs": {"fps": fps, "images": ["97", 0]}, "class_type": "CreateVideo"},
        "101": {"inputs": {"unet_name": "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
        "102": {"inputs": {"unet_name": "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
        "110": {"inputs": {"image": start_name}, "class_type": "LoadImage"},
        "111": {"inputs": {"width": width, "height": height, "length": length, "batch_size": 1, "positive": ["99", 0], "negative": ["91", 0], "vae": ["92", 0], "start_image": ["110", 0], "end_image": ["112", 0]}, "class_type": "WanFunInpaintToVideo"},
        "112": {"inputs": {"image": end_name}, "class_type": "LoadImage"},
        "116": {"inputs": {"lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors", "strength_model": 1, "model": ["101", 0]}, "class_type": "LoraLoaderModelOnly"},
        "117": {"inputs": {"lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors", "strength_model": 1, "model": ["102", 0]}, "class_type": "LoraLoaderModelOnly"},
        "158": {"inputs": {"filename_prefix": prefix, "format": "auto", "codec": "auto", "video": ["100", 0]}, "class_type": "SaveVideo"},
    }}


def upload_image(gw, headers, image_path):
    name = pathlib.Path(image_path).name
    print(f"  上传 {name}...")
    with open(image_path, "rb") as f:
        resp = requests.post(f"{gw}/api/v1/upload", headers=headers,
                             files={"image": (name, f, "image/png")},
                             data={"overwrite": "true"}, timeout=60)
    resp.raise_for_status()
    result = resp.json()
    print(f"  → {result.get('name', name)} ({result.get('type', '')})")
    return result.get("name", name)


def submit_task(gw, headers, workflow):
    print("提交 Fun Inpaint 视频生成任务...")
    resp = requests.post(f"{gw}/api/v1/ai/video/generate", headers=headers, json=workflow, timeout=30)
    resp.raise_for_status()
    result = resp.json()
    if result.get("node_errors"):
        raise RuntimeError(f"工作流校验失败: {result['node_errors']}")
    prompt_id = result.get("prompt_id", "")
    print(f"  Task ID: {prompt_id}")
    return prompt_id


def poll_task(gw, headers, prompt_id):
    print("生成中(约 30s–2min)...", flush=True)
    start = time.time()
    while True:
        task = requests.get(f"{gw}/api/v1/ai/tasks/{prompt_id}", headers=headers, timeout=30).json().get(prompt_id, {})
        status = task.get("status", {})
        elapsed = time.time() - start
        if status.get("completed"):
            print(f"  完成!耗时 {elapsed:.0f}s")
            return task
        print(f"  [{elapsed:.0f}s] {status.get('status_str', 'running')}...", flush=True)
        time.sleep(5)


def download_video(gw, headers, task, out_path):
    outputs = task.get("outputs", {})
    vid_node = outputs.get("158", {})
    images = vid_node.get("images", [])
    if not images:
        for v in outputs.values():
            if v.get("images"):
                images = v["images"]
                break
    if not images:
        print(f"  outputs keys: {list(outputs.keys())}")
        raise ValueError("无法找到视频文件")

    img = images[0]
    fn = img.get("filename", "")
    sub = img.get("subfolder", "video")
    vtype = img.get("type", "output")

    print(f"下载 {fn}...")
    resp = requests.get(f"{gw}/api/v1/ai/image/view/", headers=headers,
                        params={"filename": fn, "subfolder": sub, "type": vtype}, timeout=120)
    resp.raise_for_status()
    out = pathlib.Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "wb") as f:
        f.write(resp.content)
    print(f"已保存: {out} ({len(resp.content):,} bytes)")


def main():
    p = argparse.ArgumentParser(description="ComfyUI Wan 2.2 Fun Inpaint 首尾帧视频生成")
    p.add_argument("--start", required=True, help="首帧图片路径")
    p.add_argument("--end", required=True, help="尾帧图片路径")
    p.add_argument("--prompt", default="A cat waking up and stretching",
                   help="正向提示词(英文动作描述)")
    p.add_argument("--out", default=None, help="输出 mp4 路径(默认 <输出目录>/fun_inpaint.mp4)")
    p.add_argument("--width", type=int, default=640)
    p.add_argument("--height", type=int, default=640)
    p.add_argument("--length", type=int, default=81, help="视频帧数(81≈5s@16fps)")
    p.add_argument("--fps", type=int, default=16)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--shift", type=int, default=8, help="采样偏移(Fun Inpaint 默认 8)")
    p.add_argument("--prefix", default="video/fun_inpaint", help="SaveVideo filename_prefix")
    p.add_argument("--gw", default=os.environ.get("GW", DEFAULT_GW), help="网关地址")
    p.add_argument("--api-key", default=os.environ.get("API_KEY", ""), help="网关 API key (sk-xxx)")
    args = p.parse_args()

    if not args.api_key:
        sys.exit("ERROR: 缺少 API_KEY。请用 --api-key 传入或设置环境变量 API_KEY。")

    headers = {"Authorization": f"Bearer {args.api_key}"}

    out_dir = resolve_out_dir(args.out)
    out_path = args.out if args.out else os.path.join(out_dir, "fun_inpaint.mp4")

    for img in (args.start, args.end):
        if not pathlib.Path(img).is_file():
            sys.exit(f"ERROR: 图片不存在: {img}")

    # Step 1: 上传首帧和尾帧
    print("\n=== Step 1: 上传首帧/尾帧 ===")
    start_name = upload_image(args.gw, headers, args.start)
    end_name = upload_image(args.gw, headers, args.end)
    print(f"  首帧: {start_name}  尾帧: {end_name}")

    # Step 2: 构建并提交工作流
    print("\n=== Step 2: 提交 Fun Inpaint 工作流 ===")
    workflow = build_workflow(start_name, end_name, args.prompt, args.width, args.height,
                              args.length, args.fps, args.seed, args.shift, args.prefix)
    prompt_id = submit_task(args.gw, headers, workflow)

    # Step 3: 轮询等待
    print("\n=== Step 3: 生成中 ===")
    task = poll_task(args.gw, headers, prompt_id)

    # Step 4: 下载
    print("\n=== Step 4: 下载视频 ===")
    download_video(args.gw, headers, task, out_path)


if __name__ == "__main__":
    main()
