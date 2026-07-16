#!/usr/bin/env python3
"""
上传图片到 ComfyUI input 目录（公网网关版）
用法：python upload.py <图片路径1> [图片路径2 ...]

环境变量：
  GW       — 网关地址，默认 https://ai.ospreyai.cn
  API_KEY  — 网关 new-api 的 sk-xxx
"""
import os
import subprocess
import sys


GW = os.getenv("GW", "https://ai.ospreyai.cn")
API_KEY = os.getenv("API_KEY", "")


def upload_image(filepath):
    abs_path = os.path.abspath(filepath)
    result = subprocess.run(
        ["curl", "-s", "-X", "POST",
         "-H", f"Authorization: Bearer {API_KEY}",
         f"{GW}/api/v1/upload",
         "-F", f"image=@{abs_path}",
         "-F", "type=input"],
        capture_output=True, text=True,
    )
    out = result.stdout.strip()
    if result.returncode == 0 and out:
        print(f"  {os.path.basename(filepath)} -> {out}")
    else:
        print(f"  {os.path.basename(filepath)} -> ERROR {result.stderr or out}")
    return out


def main():
    if len(sys.argv) < 2:
        print("用法: python upload.py <图片路径1> [图片路径2 ...]")
        sys.exit(1)

    if not API_KEY:
        print("ERROR: 请设置环境变量 API_KEY（网关 new-api 的 sk-xxx）")
        sys.exit(1)

    print(f"Uploading to {GW}")
    for path in sys.argv[1:]:
        upload_image(path)


if __name__ == "__main__":
    main()
