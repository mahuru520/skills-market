"""MiniMax H3 V2 first/last-frame image-to-video skill."""
import argparse
import os
import sys
from h3_client import DEFAULT_GW, download_video, media_url, poll_task, require_api_key, submit_generation, validate_common

# Windows 控制台默认 GBK，含 emoji/特殊字符的中文输出会 UnicodeEncodeError；强制 UTF-8
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def normalize_ratio(value):
    legacy = {
        "21:9 (Ultrawide)": "21:9",
        "16:9 (Widescreen)": "16:9",
        "4:3 (Standard)": "4:3",
        "1:1 (Square)": "1:1",
        "3:4 (Portrait)": "3:4",
        "9:16 (Portrait Widescreen)": "9:16",
    }
    return legacy.get(value, value)


def main():
    parser = argparse.ArgumentParser(description="MiniMax H3 首帧/尾帧/首尾帧图生视频")
    parser.add_argument("--image", default=None, help="首帧图片路径或公网 URL（与 --last-image 至少给一张）")
    parser.add_argument("--last-image", default=None, help="尾帧图片路径或公网 URL（可选；不填 --image 时为仅尾帧模式）")
    parser.add_argument("--prompt", required=True, help="视频动作和镜头描述提示词")
    parser.add_argument("--resolution", default="768P", choices=["768P", "2K"], help="分辨率（当前网关仅支持 768P，2K 暂不可用）")
    parser.add_argument("--ratio", "--aspect-ratio", dest="ratio", default="adaptive", help="图生视频通常使用 adaptive")
    parser.add_argument("--duration", type=int, default=5, help="视频时长（4-15 秒）")
    parser.add_argument("--output", default=None, help="输出 mp4 路径（默认当前目录/minimax_h3_i2v.mp4）")
    parser.add_argument("--timeout", type=int, default=600, help="轮询超时秒数")
    parser.add_argument("--gw", default=os.environ.get("GW", DEFAULT_GW), help="网关地址")
    parser.add_argument("--api-key", default=os.environ.get("API_KEY", ""), help="网关 API key (sk-xxx)")
    args = parser.parse_args()
    if not args.prompt.strip() or len(args.prompt) > 7000:
        sys.exit("ERROR: prompt 不能为空且不能超过 7000 个字符")
    if args.timeout <= 0:
        sys.exit("ERROR: timeout 必须大于 0")
    args.ratio = normalize_ratio(args.ratio)
    validate_common(args.resolution, args.duration, args.ratio, allow_adaptive=True)
    if not args.image and not args.last_image:
        sys.exit("ERROR: --image 和 --last-image 至少需要提供一张")
    api_key = require_api_key(args.api_key)
    content = [{"type": "text", "text": args.prompt}]
    if args.image:
        content.append({
            "type": "image_url",
            "image_url": {"url": media_url(args.image, "首帧图片")},
            "role": "first_frame",
        })
    if args.last_image:
        content.append({
            "type": "image_url",
            "image_url": {"url": media_url(args.last_image, "尾帧图片")},
            "role": "last_frame",
        })
    output = args.output or os.path.join(os.getcwd(), "minimax_h3_i2v.mp4")
    print("提交 MiniMax H3 图生视频任务...", flush=True)
    task_id, _ = submit_generation(args.gw, api_key, content, args.resolution, args.duration, args.ratio)
    print(f"  Task ID: {task_id}")
    print("等待生成...", flush=True)
    video_url, _ = poll_task(args.gw, api_key, task_id, args.timeout)
    print("下载视频...", flush=True)
    target = download_video(video_url, output)
    print(f"已保存: {target}")


if __name__ == "__main__":
    main()
