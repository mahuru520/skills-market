"""MiniMax H3 V2 text-to-video skill."""
import argparse
import os
import sys
from h3_client import DEFAULT_GW, download_video, poll_task, require_api_key, submit_generation, validate_common

# Windows 控制台默认 GBK，含 emoji/特殊字符的中文输出会 UnicodeEncodeError；强制 UTF-8
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description="MiniMax H3 文生视频")
    parser.add_argument("--prompt", required=True, help="视频描述提示词")
    parser.add_argument("--resolution", default="768P", choices=["768P", "2K"], help="分辨率")
    parser.add_argument("--ratio", default="16:9", choices=["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"], help="画面比例")
    parser.add_argument("--duration", type=int, default=5, help="视频时长（4-15 秒）")
    parser.add_argument("--output", default=None, help="输出 mp4 路径（默认当前目录/minimax_h3_t2v.mp4）")
    parser.add_argument("--timeout", type=int, default=600, help="轮询超时秒数")
    parser.add_argument("--gw", default=os.environ.get("GW", DEFAULT_GW), help="网关地址")
    parser.add_argument("--api-key", default=os.environ.get("API_KEY", ""), help="网关 API key (sk-xxx)")
    args = parser.parse_args()
    if not args.prompt.strip() or len(args.prompt) > 7000:
        sys.exit("ERROR: prompt 不能为空且不能超过 7000 个字符")
    if args.timeout <= 0:
        sys.exit("ERROR: timeout 必须大于 0")
    validate_common(args.resolution, args.duration, args.ratio)
    api_key = require_api_key(args.api_key)
    output = args.output or os.path.join(os.getcwd(), "minimax_h3_t2v.mp4")
    content = [{"type": "text", "text": args.prompt}]
    print("提交 MiniMax H3 文生视频任务...", flush=True)
    task_id, _ = submit_generation(args.gw, api_key, content, args.resolution, args.duration, args.ratio)
    print(f"  Task ID: {task_id}")
    print("等待生成...", flush=True)
    poll_task(args.gw, api_key, task_id, args.timeout)
    print("下载视频...", flush=True)
    target = download_video(args.gw, api_key, task_id, output)
    print(f"已保存: {target}")


if __name__ == "__main__":
    main()
