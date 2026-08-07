#!/usr/bin/env python3
"""
ComfyUI MiniMax H3 参考生视频（公网网关版）
用法：
  # 最简：上传 2 张参考图，默认 5 秒 16:9 视频
  python reference_to_video.py --ref0 ref0.png --ref1 ref1.png \
      --prompt "Use <Picture 1> and <Picture 2> as reference. CUT 1: ..."

  # 自定义时长 / 比例 / 种子
  python reference_to_video.py --ref0 ref0.png --ref1 ref1.png --prompt "..." \
      --duration 10 --aspect-ratio "9:16 (Portrait Widescreen)" --seed 42

环境变量：
  GW       — 网关地址，默认 https://ai.ospreyai.cn
  API_KEY  — 网关 new-api 的 sk-xxx

说明：
  - MiniMax H3 ref2va 模型，上传 2 张参考图 + 提示词生成带音频的全新视频
  - 参考图是视觉参考（角色/风格/场景），不是首帧；提示词用 <Picture 1>/<Picture 2> 引用
  - ref_image_0（节点 137）= <Picture 1>，ref_image_1（节点 139）= <Picture 2>
  - 每次运行随机 seed，避免命中 ComfyUI 缓存导致 outputs 为空
"""
import argparse
import json
import os
import pathlib
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
NODE_REF0 = "137"          # LoadImage 参考图 1 = <Picture 1>
NODE_REF1 = "139"          # LoadImage 参考图 2 = <Picture 2>
NODE_PROMPT = "138"        # PrimitiveStringMultiline 正向提示词
NODE_ASPECT = "115"        # ResolutionSelector 宽高比
NODE_MEGA = "115"          # ResolutionSelector 分辨率档位（MP）
NODE_DURATION = "132"      # PrimitiveFloat 视频时长（秒）
NODE_SEED = "129"          # RandomNoise 种子
NODE_PREFIX = "92"         # SaveVideo 输出文件名前缀


def upload_image(gw, api_key, image_path):
    """上传图片到网关，返回 ComfyUI input 目录里的文件名。"""
    name = pathlib.Path(image_path).name
    print(f"  上传 {name}...")
    with open(image_path, "rb") as f:
        # multipart 手写，避免依赖 requests
        boundary = "----minimax-h3-r2v-" + str(int(time.time() * 1000))
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="image"; filename="{name}"\r\n'
            f"Content-Type: image/png\r\n\r\n"
        ).encode("utf-8") + f.read() + (
            f"\r\n--{boundary}\r\n"
            f'Content-Disposition: form-data; name="overwrite"\r\n\r\n'
            f"true\r\n"
            f"--{boundary}--\r\n"
        ).encode("utf-8")
        req = urllib.request.Request(
            f"{gw}/api/v1/upload",
            data=body,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": f"multipart/form-data; boundary={boundary}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())
    uploaded = result.get("name", name)
    print(f"  → {uploaded} ({result.get('type', '')})")
    return uploaded


def build_prompt(ref0_name, ref1_name, prompt_text, aspect_ratio, megapixels, duration, seed, output_prefix):
    """读取 workflow.json 并替换可参数化字段，返回 ComfyUI prompt dict。"""
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        nodes = json.load(f)

    nodes[NODE_REF0]["inputs"]["image"] = ref0_name
    nodes[NODE_REF1]["inputs"]["image"] = ref1_name
    nodes[NODE_PROMPT]["inputs"]["value"] = prompt_text
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
    parser = argparse.ArgumentParser(description="ComfyUI MiniMax H3 参考生视频（公网网关版）")
    parser.add_argument("--ref0", required=True, help="参考图 1 路径（= 提示词中的 <Picture 1>）")
    parser.add_argument("--ref1", required=True, help="参考图 2 路径（= 提示词中的 <Picture 2>）")
    parser.add_argument("--prompt", required=True,
                        help='正向提示词（英文，用 <Picture 1>/<Picture 2> 引用参考图，描述分镜/动作/音频）')
    parser.add_argument("--aspect-ratio", default="16:9 (Widescreen)",
                        help='宽高比（默认 "16:9 (Widescreen)"）')
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

    for p in (args.ref0, args.ref1):
        if not pathlib.Path(p).is_file():
            print(f"ERROR: 图片不存在: {p}")
            return

    print("=== ComfyUI MiniMax H3 参考生视频 ===")
    print(f"Gateway:    {GW}")
    print(f"Ref0 (P1):  {args.ref0}")
    print(f"Ref1 (P2):  {args.ref1}")
    print(f"Prompt:     {args.prompt}")
    print(f"Aspect/MP:  {args.aspect_ratio} / {args.megapixels}MP")
    print(f"Duration:   {args.duration}s")
    print()

    # Step 1: 上传 2 张参考图
    print("Step 1: 上传参考图片")
    ref0_name = upload_image(GW, API_KEY, args.ref0)
    ref1_name = upload_image(GW, API_KEY, args.ref1)

    # Step 2: 构建并提交工作流
    print("\nStep 2: 提交工作流")
    prompt_data = build_prompt(
        ref0_name, ref1_name, args.prompt, args.aspect_ratio, args.megapixels,
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

    # Step 3: 轮询
    print("\nStep 3: 生成中（视频生成较慢，请耐心等待）")
    task = poll_task(prompt_id, timeout=args.timeout)
    if task is None:
        print("Timeout! 可用 prompt_id 手动重查: "
              f"curl -H 'Authorization: Bearer $API_KEY' {GW}/api/v1/ai/tasks/{prompt_id}")
        return

    # Step 4: 下载
    print("\nStep 4: 下载视频")
    files = find_output_files(task)
    if not files:
        print("⚠️ 未在 outputs 中找到视频文件。任务状态：")
        print(json.dumps(task, indent=2, ensure_ascii=False)[:2000])
        return

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
