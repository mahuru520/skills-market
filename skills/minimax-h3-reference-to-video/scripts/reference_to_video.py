"""MiniMax H3 V2 multimodal reference-to-video skill."""
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


def main():
    parser = argparse.ArgumentParser(description="MiniMax H3 多模态参考生视频")
    parser.add_argument("--ref0", required=True, help="参考图片 1 路径或公网 URL")
    parser.add_argument("--ref1", required=True, help="参考图片 2 路径或公网 URL")
    parser.add_argument("--ref-image", action="append", default=[], help="额外参考图片，可重复传入")
    parser.add_argument("--ref-video-url", action="append", default=[], help="参考视频公网 URL，可重复传入")
    parser.add_argument("--ref-audio-url", action="append", default=[], help="参考音频公网 URL，可重复传入")
    parser.add_argument("--prompt", required=True, help="视频描述及参考素材使用方式")
    parser.add_argument("--resolution", default="768P", choices=["768P", "2K"], help="分辨率")
    parser.add_argument("--ratio", "--aspect-ratio", dest="ratio", default="adaptive", help="画面比例")
    parser.add_argument("--duration", type=int, default=5, help="视频时长（4-15 秒）")
    parser.add_argument("--output", default=None, help="输出 mp4 路径（默认当前目录/minimax_h3_r2v.mp4）")
    parser.add_argument("--timeout", type=int, default=600, help="轮询超时秒数")
    parser.add_argument("--gw", default=os.environ.get("GW", DEFAULT_GW), help="网关地址")
    parser.add_argument("--api-key", default=os.environ.get("API_KEY", ""), help="网关 API key (sk-xxx)")
    args = parser.parse_args()
    if not args.prompt.strip() or len(args.prompt) > 7000:
        sys.exit("ERROR: prompt 不能为空且不能超过 7000 个字符")
    if args.timeout <= 0:
        sys.exit("ERROR: timeout 必须大于 0")
    validate_common(args.resolution, args.duration, args.ratio, allow_adaptive=True)
    if 2 + len(args.ref_image) + len(args.ref_video_url) + len(args.ref_audio_url) > 12:
        sys.exit("ERROR: 参考素材总数不能超过 12 个")
    api_key = require_api_key(args.api_key)
    content = [{"type": "text", "text": args.prompt}]
    for index, value in enumerate([args.ref0, args.ref1] + args.ref_image, start=1):
        content.append({
            "type": "image_url",
            "image_url": {"url": media_url(value, f"参考图片 {index}")},
            "role": "reference_image",
        })
    for value in args.ref_video_url:
        if not value.startswith(("http://", "https://", "mm_file://", "data:")):
            sys.exit(f"ERROR: 参考视频必须是公网 URL、mm_file URI 或 data URI: {value}")
        content.append({"type": "video_url", "video_url": {"url": value}, "role": "reference_video"})
    for value in args.ref_audio_url:
        if not value.startswith(("http://", "https://", "mm_file://", "data:")):
            sys.exit(f"ERROR: 参考音频必须是公网 URL、mm_file URI 或 data URI: {value}")
        content.append({"type": "audio_url", "audio_url": {"url": value}, "role": "reference_audio"})
    output = args.output or os.path.join(os.getcwd(), "minimax_h3_r2v.mp4")
    print("提交 MiniMax H3 参考生视频任务...", flush=True)
    task_id, _ = submit_generation(args.gw, api_key, content, args.resolution, args.duration, args.ratio)
    print(f"  Task ID: {task_id}")
    print("等待生成...", flush=True)
    poll_task(args.gw, api_key, task_id, args.timeout)
    print("下载视频...", flush=True)
    target = download_video(args.gw, api_key, task_id, output)
    print(f"已保存: {target}")


if __name__ == "__main__":
    main()
