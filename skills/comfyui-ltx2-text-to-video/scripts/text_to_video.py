#!/usr/bin/env python3
"""
ComfyUI LTX-2 文生视频（公网网关版）
用法：
  python text_to_video.py --prompt "<英文提示词>" [选项]

  # 最简：5 秒 1280×720 视频
  python text_to_video.py --prompt "A cheerful girl puppet singing in the rain"

  # 自定义时长 / 帧率 / 种子 / 输出名
  python text_to_video.py --prompt "..." --length 97 --fps 24 --seed 42 --output_prefix video/my_clip

环境变量：
  GW       — 网关地址，默认 https://ai.ospreyai.cn
  API_KEY  — 网关 new-api 的 sk-xxx

说明：
  - 工作流两阶段：640×360 / 20 步低清采样 → 空间放大 2× 到 1280×720 / 4 步精修
  - 输出带空音轨的 mp4（静音视频），保存到 ComfyUI output 的 video/ 子目录
  - 默认 121 帧 @ 24fps ≈ 5 秒；改 --length 时同步影响时长（秒 ≈ length/fps）
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

# Windows 控制台默认 GBK，含 emoji/特殊字符的中文输出会 UnicodeEncodeError；强制 UTF-8
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


GW = os.getenv("GW", "https://ai.ospreyai.cn")
API_KEY = os.getenv("API_KEY", "")
HERE = os.path.dirname(os.path.abspath(__file__))
WORKFLOW_PATH = os.path.join(HERE, "workflow.json")

AUTH_HEADER = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

# 工作流中可参数化的节点 ID 与字段
NODE_PROMPT_POS = "121"          # CLIPTextEncode 正向提示词
NODE_PROMPT_NEG = "110"          # CLIPTextEncode 负向提示词
NODE_LENGTH = "112"              # PrimitiveInt 帧数
NODE_FPS_FLOAT = "129"           # PrimitiveFloat 帧率
NODE_FPS_INT = "130"             # PrimitiveInt 帧率（两处必须同步）
NODE_EMPTY_IMAGE = "111"         # EmptyImage 内部分辨率（×0.5 后送入低清阶段，×2 放大后即输出尺寸）
NODE_NOISE_SEED = "115"          # RandomNoise 种子（低清阶段）
NODE_SAVE_VIDEO = "75"           # SaveVideo 输出前缀


def build_prompt(prompt_text, negative_text, length, fps, width, height, seed, output_prefix):
    """读取 workflow.json 并替换可参数化字段，返回 ComfyUI prompt dict。"""
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        nodes = json.load(f)

    nodes[NODE_PROMPT_POS]["inputs"]["text"] = prompt_text
    if negative_text is not None:
        nodes[NODE_PROMPT_NEG]["inputs"]["text"] = negative_text
    nodes[NODE_LENGTH]["inputs"]["value"] = length
    nodes[NODE_FPS_FLOAT]["inputs"]["value"] = float(fps)
    nodes[NODE_FPS_INT]["inputs"]["value"] = int(fps)
    nodes[NODE_EMPTY_IMAGE]["inputs"]["width"] = width
    nodes[NODE_EMPTY_IMAGE]["inputs"]["height"] = height
    seed_val = int(time.time() * 1000) % (2**62)
    if seed is not None:
        nodes[NODE_NOISE_SEED]["inputs"]["noise_seed"] = seed
    else:
        # 未指定种子时给一个随机值，避免相同工作流命中 ComfyUI 缓存导致 outputs 为空
        nodes[NODE_NOISE_SEED]["inputs"]["noise_seed"] = seed_val
    nodes[NODE_SAVE_VIDEO]["inputs"]["filename_prefix"] = output_prefix
    return nodes


def submit_prompt(prompt_data):
    payload = json.dumps({"prompt": prompt_data, "extra_data": {}}).encode("utf-8")
    req = urllib.request.Request(
        f"{GW}/api/v1/ai/video/generate",
        data=payload,
        headers=AUTH_HEADER,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def poll_task(prompt_id, timeout=600, interval=5):
    """轮询任务状态，返回 completed 的 task dict 或 None（超时）。"""
    for i in range(int(timeout / interval)):
        req = urllib.request.Request(
            f"{GW}/api/v1/ai/tasks/{prompt_id}",
            headers={"Authorization": f"Bearer {API_KEY}"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
        if prompt_id in data:
            task = data[prompt_id]
            status = task.get("status", {})
            status_str = status.get("status_str", "unknown")
            elapsed = (i + 1) * interval
            print(f"[{elapsed}s] {status_str} completed={status.get('completed', False)}")
            if status.get("completed"):
                return task
        time.sleep(interval)
    return None


def find_output_files(task):
    """从 task outputs 中提取视频/预览图文件信息。返回 [(filename, subfolder, type, kind), ...]

    ComfyUI SaveVideo 的输出实际落在 ``images`` 字段（而非 gifs），mp4 文件名，
    同节点 outputs 里有同序号的 ``animated`` 布尔列表标记是否为动图/视频。
    这里按文件扩展名判定 kind，mp4/webm/mov/gif 视为视频。
    """
    VIDEO_EXT = {".mp4", ".webm", ".mov", ".gif", ".mkv"}
    files = []
    for node_id, out in task.get("outputs", {}).items():
        # SaveVideo 输出在 images 字段（mp4 文件名 + animated 标记）
        for img in out.get("images", []):
            fname = img["filename"]
            kind = "video" if os.path.splitext(fname)[1].lower() in VIDEO_EXT else "image"
            files.append((fname, img.get("subfolder", ""), img.get("type", "output"), kind))
        # 兼容：部分版本把动图放 gifs 字段
        for img in out.get("gifs", []):
            files.append((img["filename"], img.get("subfolder", ""), img.get("type", "output"), "video"))
    return files


def download_file(filename, subfolder, file_type, save_path):
    url = f"{GW}/api/v1/ai/image/view/"
    params = f"?filename={urllib.parse.quote(filename)}&type={file_type}&subfolder={urllib.parse.quote(subfolder)}"
    req = urllib.request.Request(url + params, headers={"Authorization": f"Bearer {API_KEY}"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read()
    with open(save_path, "wb") as f:
        f.write(data)
    return save_path


def main():
    parser = argparse.ArgumentParser(description="ComfyUI LTX-2 文生视频（公网网关版）")
    parser.add_argument("--prompt", required=True, help="英文正向提示词")
    parser.add_argument("--negative", default=None,
                        help="负向提示词（默认用工作流内置：模糊/低质/静态/水印等）")
    parser.add_argument("--length", type=int, default=121, help="帧数（默认 121，24fps 下约 5 秒）")
    parser.add_argument("--fps", type=int, default=24, help="帧率（默认 24，需与 length 配合决定时长）")
    parser.add_argument("--width", type=int, default=1280, help="输出宽度（默认 1280，需能被 32 整除）")
    parser.add_argument("--height", type=int, default=720, help="输出高度（默认 720，需能被 32 整除）")
    parser.add_argument("--seed", type=int, default=None, help="随机种子（默认用工作流内置）")
    parser.add_argument("--output_prefix", default="video/LTX-2", help="输出文件名前缀（默认 video/LTX-2，含子目录）")
    parser.add_argument("--output", default=None, help="本地保存路径（默认当前目录，文件名取服务端返回名）")
    parser.add_argument("--timeout", type=int, default=600, help="轮询超时秒数（默认 600，视频生成较慢）")
    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: 请设置环境变量 API_KEY（网关 new-api 的 sk-xxx）")
        return

    print("=== ComfyUI LTX-2 文生视频 ===")
    print(f"Gateway:       {GW}")
    print(f"Prompt:        {args.prompt}")
    print(f"Size:          {args.width}x{args.height}")
    print(f"Length/FPS:    {args.length} frames @ {args.fps}fps (~{args.length / args.fps:.1f}s)")
    print(f"Output prefix: {args.output_prefix}")
    print()

    prompt_data = build_prompt(
        args.prompt, args.negative, args.length, args.fps,
        args.width, args.height, args.seed, args.output_prefix,
    )
    print(f"Submitting ({len(prompt_data)} nodes)...")

    try:
        result = submit_prompt(prompt_data)
        prompt_id = result["prompt_id"]
        print(f"OK — prompt_id: {prompt_id}  queue: {result.get('number', '?')}")
        if result.get("node_errors"):
            print(f"WARNING node_errors: {result['node_errors']}")
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:1000]}")
        return

    print("Polling (视频生成较慢，请耐心等待)...")
    task = poll_task(prompt_id, timeout=args.timeout)
    if task is None:
        print("Timeout! 可用 prompt_id 手动重查: "
              f"curl -H 'Authorization: Bearer $API_KEY' {GW}/api/v1/ai/tasks/{prompt_id}")
        return

    files = find_output_files(task)
    if not files:
        print("⚠️ 未在 outputs 中找到视频文件。任务状态：")
        print(json.dumps(task, indent=2, ensure_ascii=False)[:2000])
        return

    print("\nResult:")
    for filename, subfolder, ftype, kind in files:
        url = (f"{GW}/api/v1/ai/image/view/?filename={filename}&type={ftype}&subfolder={subfolder}")
        print(f"  [{kind}] {filename} (subfolder={subfolder!r})")
        print(f"  {url}")

        if kind == "video":
            if args.output:
                save_path = args.output
            else:
                save_path = os.path.join(".", os.path.basename(filename))
            try:
                download_file(filename, subfolder, ftype, save_path)
                print(f"  -> 已下载: {save_path}")
            except Exception as e:
                print(f"  -> 下载失败: {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
