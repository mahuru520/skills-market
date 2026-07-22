#!/usr/bin/env python3
"""HappyHorse 1.0 文生视频 (Text-to-Video).

通过 Open.OspreyAI 网关将文字提示词生成高清视频(720P/1080P, 1-10 秒)。
异步任务模式: 提交任务 → 轮询状态 → 下载视频。

用法:
  python generate.py \
      --prompt "一只猫咪在阳光下慵懒地打哈欠" \
      --resolution 1080P --ratio 16:9 --duration 5 \
      --out happyhorse.mp4

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

DEFAULT_GW = "https://open.ospreyai.cn"
DEFAULT_MODEL = "happyhorse-1.0-t2v"


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


def submit_task(gw, api_key, model, prompt, resolution, ratio, duration):
    print("提交 HappyHorse 文生视频任务...")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
    }
    payload = {"model": model, "prompt": prompt}
    if resolution:
        payload["resolution"] = resolution
    if ratio:
        payload["ratio"] = ratio
    if duration:
        payload["duration"] = duration

    resp = requests.post(f"{gw}/v1/video/generations", headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    task = resp.json()
    task_id = task.get("task_id", "")
    if not task_id:
        raise RuntimeError(f"未返回 task_id: {task}")
    print(f"  Task ID: {task_id}")
    print(f"  Status: {task.get('status', 'unknown')}")
    return task_id


def poll_task(gw, api_key, task_id):
    print("等待生成(约 1-3 分钟)...", flush=True)
    headers = {"Authorization": f"Bearer {api_key}"}
    start = time.time()
    while True:
        time.sleep(10)
        resp = requests.get(f"{gw}/v1/video/generations/{task_id}", headers=headers, timeout=30)
        data = resp.json().get("data", {})
        status = data.get("status", "")
        progress = data.get("progress", "")
        elapsed = time.time() - start
        print(f"  [{elapsed:.0f}s] {status} ({progress})")

        if status == "SUCCESS":
            video_url = (data.get("result_url")
                         or data.get("data", {}).get("output", {}).get("video_url"))
            if not video_url:
                raise RuntimeError(f"任务成功但未找到视频 URL: {data}")
            print(f"\n视频就绪: {video_url}")
            return video_url, elapsed
        elif status == "FAILED":
            sys.exit(f"生成失败: {data.get('fail_reason')}")


def download_video(video_url, out_path, elapsed):
    print("下载视频...")
    out = pathlib.Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    resp = requests.get(video_url, timeout=120)
    resp.raise_for_status()
    out.write_bytes(resp.content)
    print(f"已保存: {out} ({len(resp.content) // 1024 // 1024} MB, {elapsed:.0f}s 总耗时)")


def main():
    p = argparse.ArgumentParser(description="HappyHorse 1.0 文生视频 (Text-to-Video)")
    p.add_argument("--prompt", required=True, help="视频描述(中英文均可)")
    p.add_argument("--resolution", default="1080P", choices=["720P", "1080P"], help="分辨率")
    p.add_argument("--ratio", default="16:9", choices=["16:9", "9:16", "1:1"], help="画面比例")
    p.add_argument("--duration", type=int, default=5, help="视频时长(秒, 1-10)")
    p.add_argument("--model", default=DEFAULT_MODEL, help=f"模型名(默认 {DEFAULT_MODEL})")
    p.add_argument("--out", default=None, help="输出 mp4 路径(默认 <输出目录>/happyhorse.mp4)")
    p.add_argument("--gw", default=os.environ.get("GW", DEFAULT_GW), help="网关地址")
    p.add_argument("--api-key", default=os.environ.get("API_KEY", ""), help="网关 API key (sk-xxx)")
    args = p.parse_args()

    if not args.api_key:
        sys.exit("ERROR: 缺少 API_KEY。请用 --api-key 传入或设置环境变量 API_KEY。")

    if not (1 <= args.duration <= 10):
        sys.exit(f"ERROR: duration 必须在 1-10 秒之间,当前 {args.duration}")

    out_dir = resolve_out_dir(args.out)
    out_path = args.out if args.out else os.path.join(out_dir, "happyhorse.mp4")

    task_id = submit_task(args.gw, args.api_key, args.model, args.prompt,
                          args.resolution, args.ratio, args.duration)
    video_url, elapsed = poll_task(args.gw, args.api_key, task_id)
    download_video(video_url, out_path, elapsed)


if __name__ == "__main__":
    main()
