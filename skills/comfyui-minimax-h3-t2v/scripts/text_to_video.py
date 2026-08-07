#!/usr/bin/env python3
"""
ComfyUI MiniMax H3 文生视频（公网网关版）
用法：
  # 最简：默认 5 秒 16:9 视频
  python text_to_video.py --prompt "A bird spreading its wings and flying away"

  # 自定义时长 / 比例 / 种子
  python text_to_video.py --prompt "..." --duration 10 --aspect-ratio "9:16 (Portrait Widescreen)" --seed 42

环境变量：
  GW       — 网关地址，默认 https://ai.ospreyai.cn
  API_KEY  — 网关 new-api 的 sk-xxx

说明：
  - MiniMax H3 fl2va 模型，音视频联合生成，输出带同步音频的 mp4
  - 时长以秒为单位（PrimitiveFloat 105:111），ComfyMathExpression 自动换算帧数并对齐到 mod 17 = 5
  - 每次运行随机 seed，避免命中 ComfyUI 缓存导致 outputs 为空
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

# 工作流中可参数化的节点 ID 与字段
NODE_PROMPT = "105:104"      # MiniMaxH3ImageToVideo 正向提示词（T2V 不接 first_frame 即纯文生）
NODE_ASPECT = "115"          # ResolutionSelector 宽高比
NODE_MEGA = "115"            # ResolutionSelector 分辨率档位（MP）
NODE_DURATION = "105:111"    # PrimitiveFloat 视频时长（秒）
NODE_SEED = "105:15"         # RandomNoise 种子
NODE_PREFIX = "92"           # SaveVideo 输出文件名前缀


def build_prompt(prompt_text, aspect_ratio, megapixels, duration, seed, output_prefix):
    """读取 workflow.json 并替换可参数化字段，返回 ComfyUI prompt dict。"""
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        nodes = json.load(f)

    nodes[NODE_PROMPT]["inputs"]["prompt"] = prompt_text
    nodes[NODE_ASPECT]["inputs"]["aspect_ratio"] = aspect_ratio
    nodes[NODE_MEGA]["inputs"]["megapixels"] = megapixels
    nodes[NODE_DURATION]["inputs"]["value"] = duration
    # 未指定种子时给一个随机值，避免相同工作流命中 ComfyUI 缓存导致 outputs 为空
    seed_val = seed if seed is not None else int(time.time() * 1000) % (2**62)
    nodes[NODE_SEED]["inputs"]["noise_seed"] = seed_val
    nodes[NODE_PREFIX]["inputs"]["filename_prefix"] = output_prefix
    return nodes


def submit_prompt(prompt_data):
    payload = json.dumps({"prompt": prompt_data, "extra_data": {}}).encode("utf-8")
    req = urllib.request.Request(
        f"{GW}/api/v1/ai/video/generate",
        data=payload,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
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
    """从 task outputs 中提取视频文件信息。返回 [(filename, subfolder, type), ...]

    ComfyUI SaveVideo 的输出落在 ``images`` 字段（mp4 文件名 + animated 标记）。
    """
    VIDEO_EXT = {".mp4", ".webm", ".mov", ".gif", ".mkv"}
    files = []
    for node_id, out in task.get("outputs", {}).items():
        for img in out.get("images", []):
            fname = img["filename"]
            if os.path.splitext(fname)[1].lower() in VIDEO_EXT:
                files.append((fname, img.get("subfolder", ""), img.get("type", "output")))
        # 兼容：部分版本把动图放 gifs 字段
        for img in out.get("gifs", []):
            files.append((img["filename"], img.get("subfolder", ""), img.get("type", "output")))
    return files


def download_file(filename, subfolder, file_type, save_path):
    params = urllib.parse.urlencode({"filename": filename, "type": file_type, "subfolder": subfolder})
    url = f"{GW}/api/v1/ai/image/view/?{params}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {API_KEY}"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read()
    with open(save_path, "wb") as f:
        f.write(data)
    return save_path


def main():
    global GW, API_KEY
    parser = argparse.ArgumentParser(description="ComfyUI MiniMax H3 文生视频（公网网关版）")
    parser.add_argument("--prompt", required=True, help="正向提示词（英文，描述镜头/动作/光影/音频）")
    parser.add_argument("--aspect-ratio", default="16:9 (Widescreen)",
                        help='宽高比（默认 "16:9 (Widescreen)"，竖屏用 "9:16 (Portrait Widescreen)"）')
    parser.add_argument("--megapixels", type=float, default=0.4, help="分辨率档位 MP（默认 0.4）")
    parser.add_argument("--duration", type=int, default=5, help="视频时长秒（默认 5）")
    parser.add_argument("--seed", type=int, default=None, help="随机种子（默认时间戳随机）")
    parser.add_argument("--output-prefix", default="video/MiniMax_H3",
                        help="输出文件名前缀（默认 video/MiniMax_H3，含子目录）")
    parser.add_argument("--output", default=None, help="本地保存路径（默认当前目录，文件名取服务端返回名）")
    parser.add_argument("--timeout", type=int, default=600, help="轮询超时秒数（默认 600）")
    parser.add_argument("--gw", default=GW, help="网关地址")
    parser.add_argument("--api-key", default=API_KEY, help="网关 API key (sk-xxx)")
    args = parser.parse_args()

    GW = args.gw
    API_KEY = args.api_key

    if not API_KEY:
        print("ERROR: 请设置环境变量 API_KEY（网关 new-api 的 sk-xxx）或用 --api-key 传入")
        return

    print("=== ComfyUI MiniMax H3 文生视频 ===")
    print(f"Gateway:    {GW}")
    print(f"Prompt:     {args.prompt}")
    print(f"Aspect/MP:  {args.aspect_ratio} / {args.megapixels}MP")
    print(f"Duration:   {args.duration}s")
    print()

    prompt_data = build_prompt(
        args.prompt, args.aspect_ratio, args.megapixels,
        args.duration, args.seed, args.output_prefix,
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
    for filename, subfolder, ftype in files:
        url = (f"{GW}/api/v1/ai/image/view/?filename={urllib.parse.quote(filename)}"
               f"&type={ftype}&subfolder={urllib.parse.quote(subfolder)}")
        print(f"  {filename} (subfolder={subfolder!r}, type={ftype})")
        print(f"  {url}")
        save_path = args.output or os.path.join(".", os.path.basename(filename))
        try:
            download_file(filename, subfolder, ftype, save_path)
            print(f"  -> 已下载: {save_path}")
        except Exception as e:
            print(f"  -> 下载失败: {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
