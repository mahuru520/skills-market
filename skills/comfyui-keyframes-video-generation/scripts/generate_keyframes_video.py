#!/usr/bin/env python3
"""ComfyUI 6 关键帧首尾帧视频生成 - Wan 2.2 FLF2V.

将 6 张关键帧图片拆为 5 个首尾帧过渡段,每段生成 25 帧,
最终合并为一段连贯视频(默认 720×720, 24fps, ~5 秒)。

用法:
  python generate_keyframes_video.py \
      --images kf01.png kf02.png kf03.png kf04.png kf05.png kf06.png \
      --prompts "seg0 motion" "seg1 motion" "seg2 motion" "seg3 motion" "seg4 motion" \
      --out keyframes.mp4

API_KEY / GW 可用环境变量传入,也可用命令行参数覆盖。
输出目录优先级: --out 指定的父目录 > 环境变量 OUT > get-output-dir.sh > 当前目录。
"""
import argparse
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


def build_workflow(image_names, prompts, width, height, length, fps, seed, shift, prefix):
    """构建 5 段首尾帧工作流 JSON.

    每段: CLIPLoader + CLIPTextEncode(×2) + UNETLoader(×2) + LoraLoader(×2)
          + ModelSamplingSD3(×2) + WanFirstLastFrameToVideo + KSamplerAdvanced(×2)
          + VAEDecode + VAELoader
    合并: ImageBatch(×4),输出: CreateVideo + SaveVideo
    """
    if len(image_names) != 6:
        raise ValueError(f"需要 6 张关键帧图片,收到 {len(image_names)} 张")
    if len(prompts) != 5:
        raise ValueError(f"需要 5 段正向提示词,收到 {len(prompts)} 段")

    prompt = {}

    # LoadImage 节点 (1-6)
    for i in range(6):
        prompt[str(i + 1)] = {"inputs": {"image": image_names[i]}, "class_type": "LoadImage"}

    # 5 段首尾帧过渡
    for i in range(5):
        base = i * 100
        prompt.update({
            f"{base+100}": {"inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default"}, "class_type": "CLIPLoader"},
            f"{base+101}": {"inputs": {"text": prompts[i], "clip": [f"{base+100}", 0]}, "class_type": "CLIPTextEncode"},
            f"{base+102}": {"inputs": {"text": NEG_PROMPT, "clip": [f"{base+100}", 0]}, "class_type": "CLIPTextEncode"},
            f"{base+103}": {"inputs": {"unet_name": "wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
            f"{base+104}": {"inputs": {"lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_high_noise.safetensors", "strength_model": 1.0, "model": [f"{base+103}", 0]}, "class_type": "LoraLoaderModelOnly"},
            f"{base+105}": {"inputs": {"unet_name": "wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors", "weight_dtype": "default"}, "class_type": "UNETLoader"},
            f"{base+106}": {"inputs": {"lora_name": "wan2.2_i2v_lightx2v_4steps_lora_v1_low_noise.safetensors", "strength_model": 1.0, "model": [f"{base+105}", 0]}, "class_type": "LoraLoaderModelOnly"},
            f"{base+107}": {"inputs": {"shift": float(shift), "model": [f"{base+104}", 0]}, "class_type": "ModelSamplingSD3"},
            f"{base+108}": {"inputs": {"shift": float(shift), "model": [f"{base+106}", 0]}, "class_type": "ModelSamplingSD3"},
            f"{base+109}": {"inputs": {"width": width, "height": height, "length": length, "batch_size": 1,
                             "positive": [f"{base+101}", 0], "negative": [f"{base+102}", 0],
                             "vae": [f"{base+114}", 0], "start_image": [f"{i+1}", 0], "end_image": [f"{i+2}", 0]},
                      "class_type": "WanFirstLastFrameToVideo"},
            f"{base+110}": {"inputs": {"add_noise": "enable", "noise_seed": seed, "steps": 4, "cfg": 1,
                              "sampler_name": "euler", "scheduler": "simple",
                              "start_at_step": 0, "end_at_step": 2, "return_with_leftover_noise": "enable",
                              "model": [f"{base+107}", 0], "positive": [f"{base+109}", 0],
                              "negative": [f"{base+109}", 1], "latent_image": [f"{base+109}", 2]},
                      "class_type": "KSamplerAdvanced"},
            f"{base+111}": {"inputs": {"add_noise": "disable", "noise_seed": 0, "steps": 4, "cfg": 1,
                              "sampler_name": "euler", "scheduler": "simple",
                              "start_at_step": 2, "end_at_step": 10000, "return_with_leftover_noise": "disable",
                              "model": [f"{base+108}", 0], "positive": [f"{base+109}", 0],
                              "negative": [f"{base+109}", 1], "latent_image": [f"{base+110}", 0]},
                      "class_type": "KSamplerAdvanced"},
            f"{base+112}": {"inputs": {"samples": [f"{base+111}", 0], "vae": [f"{base+114}", 0]}, "class_type": "VAEDecode"},
            f"{base+114}": {"inputs": {"vae_name": "wan_2.1_vae.safetensors"}, "class_type": "VAELoader"},
        })

    # 合并 5 段 VAEDecode 输出 (112/212/312/412/512)
    prompt.update({
        "601": {"inputs": {"image1": ["112", 0], "image2": ["212", 0]}, "class_type": "ImageBatch"},
        "602": {"inputs": {"image1": ["601", 0], "image2": ["312", 0]}, "class_type": "ImageBatch"},
        "603": {"inputs": {"image1": ["602", 0], "image2": ["412", 0]}, "class_type": "ImageBatch"},
        "604": {"inputs": {"image1": ["603", 0], "image2": ["512", 0]}, "class_type": "ImageBatch"},
    })

    # 输出
    prompt.update({
        "700": {"inputs": {"fps": fps, "images": ["604", 0]}, "class_type": "CreateVideo"},
        "701": {"inputs": {"filename_prefix": prefix, "format": "auto", "codec": "auto",
                          "video-preview": "", "video": ["700", 0]}, "class_type": "SaveVideo"},
    })

    return {"prompt": prompt}


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
    print("提交 FLF2V 视频生成任务...")
    resp = requests.post(f"{gw}/api/v1/ai/video/generate", headers=headers, json=workflow, timeout=30)
    resp.raise_for_status()
    result = resp.json()
    if result.get("node_errors"):
        raise RuntimeError(f"工作流校验失败: {result['node_errors']}")
    prompt_id = result.get("prompt_id", "")
    print(f"  Task ID: {prompt_id}")
    return prompt_id


def poll_task(gw, headers, prompt_id):
    print("生成中(约 3–8 分钟)...", flush=True)
    start = time.time()
    while True:
        task = requests.get(f"{gw}/api/v1/ai/tasks/{prompt_id}", headers=headers, timeout=30).json().get(prompt_id, {})
        status = task.get("status", {})
        elapsed = time.time() - start
        if status.get("completed"):
            print(f"  完成!耗时 {elapsed:.0f}s")
            return task
        print(f"  [{elapsed:.0f}s] {status.get('status_str', 'running')}...", flush=True)
        time.sleep(15)


def download_video(gw, headers, task, out_path):
    outputs = task.get("outputs", {})
    vid_node = outputs.get("701", {})
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
    p = argparse.ArgumentParser(description="ComfyUI 6 关键帧首尾帧视频生成 (Wan 2.2 FLF2V)")
    p.add_argument("--images", nargs=6, required=True, metavar="IMG", help="6 张关键帧图片路径(按时间顺序)")
    p.add_argument("--prompts", nargs=5, default=["" for _ in range(5)],
                   metavar="PROMPT", help="5 段正向提示词(英文动作描述)")
    p.add_argument("--out", default=None, help="输出 mp4 路径(默认 <输出目录>/keyframes.mp4)")
    p.add_argument("--width", type=int, default=720)
    p.add_argument("--height", type=int, default=720)
    p.add_argument("--length", type=int, default=25, help="每段帧数(25帧/段, 总125帧@24fps≈5.2s)")
    p.add_argument("--fps", type=int, default=24)
    p.add_argument("--seed", type=int, default=42)
    p.add_argument("--shift", type=float, default=5.0, help="采样偏移(FLF2V 默认 5)")
    p.add_argument("--prefix", default="video/keyframes", help="SaveVideo filename_prefix")
    p.add_argument("--gw", default=os.environ.get("GW", DEFAULT_GW), help="网关地址")
    p.add_argument("--api-key", default=os.environ.get("API_KEY", ""), help="网关 API key (sk-xxx)")
    p.add_argument("--export-workflow", metavar="PATH", default=None,
                   help="仅导出工作流 JSON 到指定路径,不提交任务")
    args = p.parse_args()

    if not args.api_key and not args.export_workflow:
        sys.exit("ERROR: 缺少 API_KEY。请用 --api-key 传入或设置环境变量 API_KEY。")

    # 校验图片存在
    for img in args.images:
        if not pathlib.Path(img).is_file():
            sys.exit(f"ERROR: 图片不存在: {img}")

    out_dir = resolve_out_dir(args.out)
    out_path = args.out if args.out else os.path.join(out_dir, "keyframes.mp4")

    # 仅导出工作流
    if args.export_workflow:
        image_names = [pathlib.Path(img).name for img in args.images]
        workflow = build_workflow(image_names, args.prompts, args.width, args.height,
                                  args.length, args.fps, args.seed, args.shift, args.prefix)
        pathlib.Path(args.export_workflow).parent.mkdir(parents=True, exist_ok=True)
        with open(args.export_workflow, "w", encoding="utf-8") as f:
            import json
            json.dump(workflow, f, ensure_ascii=False, indent=2)
        print(f"工作流已导出: {args.export_workflow}")
        return

    headers = {"Authorization": f"Bearer {args.api_key}"}

    # Step 1: 上传 6 张图
    print("\n=== Step 1: 上传关键帧 ===")
    image_names = [upload_image(args.gw, headers, img) for img in args.images]
    print(f"  图片列表: {image_names}")

    # Step 2: 构建并提交工作流
    print("\n=== Step 2: 提交 FLF2V 工作流 ===")
    workflow = build_workflow(image_names, args.prompts, args.width, args.height,
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
