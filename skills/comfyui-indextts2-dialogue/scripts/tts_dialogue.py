#!/usr/bin/env python3
"""
ComfyUI IndexTTS2 双人会话语音合成（公网网关版）
用法：
  python tts_dialogue.py --script "<S1/S2 对话脚本>" --ref1 <说话人1音频> --ref2 <说话人2音频> [选项]

  # 双人对话：S1 和 S2 交替说话
  python tts_dialogue.py \
    --script "[S1] 你好呀，今天过得怎么样？
[S2] 还不错，刚忙完手头的事。
[S1] 晚上一起吃饭吧。" \
    --ref1 big_niao.wav --ref2 prompt_audio_4.wav

环境变量：
  GW       — 网关地址，默认 https://ai.ospreyai.cn
  API_KEY  — 网关 new-api 的 sk-xxx

说明：
  - 用两段不同的参考音频分别克隆 S1、S2 的音色，按脚本交替合成对话
  - 脚本格式：每行一条，以 [S1] 或 [S2] 开头标注说话人
  - 可为 S1/S2 分别设情绪（8 种，-2~2）
  - 输出单个 mp3（含两段音色），保存到 ComfyUI output 根目录
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

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

EMOTIONS = ["happy", "angry", "sad", "fear", "hate", "low", "surprise", "neutral"]

# 工作流节点 ID
NODE_SCRIPT = "11"     # MultiLinePromptIndex 对话脚本
NODE_REF_S1 = "46"     # LoadAudio 说话人1参考
NODE_REF_S2 = "55"     # LoadAudio 说话人2参考
NODE_RUN = "58"        # IndexTTS2Run
NODE_EMO_S1 = "60"     # Emotional Control S1
NODE_EMO_S2 = "61"     # Emotional Control S2
NODE_SAVE = "57"       # SaveAudioMP3


def emo_inputs(emotion, intensity):
    d = {e: 0.0 for e in EMOTIONS}
    d[emotion] = float(intensity)
    return d


def build_prompt(script, ref1, ref2, emo1, int1, emo2, int2, output_prefix):
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        nodes = json.load(f)

    nodes[NODE_SCRIPT]["inputs"]["multi_line_prompt"] = script
    nodes[NODE_REF_S1]["inputs"]["audio"] = ref1
    nodes[NODE_REF_S2]["inputs"]["audio"] = ref2

    nodes[NODE_EMO_S1]["inputs"] = emo_inputs(emo1, int1)
    nodes[NODE_EMO_S2]["inputs"] = emo_inputs(emo2, int2)
    nodes[NODE_SAVE]["inputs"]["filename_prefix"] = output_prefix
    return nodes


def submit_prompt(prompt_data):
    payload = json.dumps({"prompt": prompt_data, "extra_data": {}}).encode("utf-8")
    req = urllib.request.Request(
        f"{GW}/api/v1/ai/image/generate",
        data=payload, headers=AUTH_HEADER, method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def poll_task(prompt_id, timeout=300, interval=4):
    for i in range(int(timeout / interval)):
        try:
            req = urllib.request.Request(
                f"{GW}/api/v1/ai/tasks/{prompt_id}",
                headers={"Authorization": f"Bearer {API_KEY}"},
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read())
            if prompt_id in data:
                task = data[prompt_id]
                status = task.get("status", {})
                if status.get("completed"):
                    return task
                if i % 4 == 0:
                    print(f"[{(i+1)*interval}s] {status.get('status_str','unknown')}")
        except Exception as e:
            print(f"  poll err: {e}")
        time.sleep(interval)
    return None


def find_audio_files(task):
    files = []
    for node_id, out in task.get("outputs", {}).items():
        for a in out.get("audio", []):
            files.append((a["filename"], a.get("subfolder", ""), a.get("type", "output")))
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
    parser = argparse.ArgumentParser(description="ComfyUI IndexTTS2 双人会话语音合成（公网网关版）")
    parser.add_argument("--script", required=True,
                        help="对话脚本，每行以 [S1] 或 [S2] 开头")
    parser.add_argument("--ref1", required=True, help="说话人1(S1)参考音频文件名（需先上传）")
    parser.add_argument("--ref2", required=True, help="说话人2(S2)参考音频文件名（需先上传）")
    parser.add_argument("--emo1", default="neutral", choices=EMOTIONS, help="S1 情绪（默认 neutral）")
    parser.add_argument("--int1", type=float, default=1.0, help="S1 情绪强度 -2~2")
    parser.add_argument("--emo2", default="neutral", choices=EMOTIONS, help="S2 情绪（默认 neutral）")
    parser.add_argument("--int2", type=float, default=1.0, help="S2 情绪强度 -2~2")
    parser.add_argument("--output_prefix", default="IN会话", help="输出文件名前缀（默认 IN会话）")
    parser.add_argument("--output", default=None, help="本地保存路径（默认当前目录）")
    parser.add_argument("--timeout", type=int, default=300, help="轮询超时秒数（默认 300）")
    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: 请设置环境变量 API_KEY"); return

    print("=== ComfyUI IndexTTS2 双人会话 ===")
    print(f"Gateway: {GW}")
    print(f"S1 ref:  {args.ref1} ({args.emo1} {args.int1})")
    print(f"S2 ref:  {args.ref2} ({args.emo2} {args.int2})")
    print(f"Script:\n{args.script}\n")

    nodes = build_prompt(args.script, args.ref1, args.ref2,
                         args.emo1, args.int1, args.emo2, args.int2, args.output_prefix)
    print(f"Submitting ({len(nodes)} nodes)...")

    try:
        result = submit_prompt(nodes)
        pid = result["prompt_id"]
        print(f"OK — prompt_id: {pid}  queue: {result.get('number','?')}")
        if result.get("node_errors"):
            print(f"WARNING node_errors: {result['node_errors']}")
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:1000]}"); return

    print("Polling...")
    task = poll_task(pid, timeout=args.timeout)
    if task is None:
        print("Timeout! 手动重查: "
              f"curl -H 'Authorization: Bearer $API_KEY' {GW}/api/v1/ai/tasks/{pid}")
        return

    files = find_audio_files(task)
    if not files:
        print("⚠️ 未找到音频输出。任务状态：")
        print(json.dumps(task, indent=2, ensure_ascii=False)[:2000]); return

    print("\nResult:")
    for filename, subfolder, ftype in files:
        url = f"{GW}/api/v1/ai/image/view/?filename={urllib.parse.quote(filename)}&type={ftype}&subfolder={urllib.parse.quote(subfolder)}"
        print(f"  {filename} (subfolder={subfolder!r})")
        print(f"  {url}")
        save_path = args.output or os.path.join(".", filename)
        try:
            download_file(filename, subfolder, ftype, save_path)
            print(f"  -> 已下载: {save_path}")
        except Exception as e:
            print(f"  -> 下载失败: {e}")
    print("\nDone.")


if __name__ == "__main__":
    main()
