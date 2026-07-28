#!/usr/bin/env python3
"""
ComfyUI IndexTTS2 语音合成 + 情绪控制（公网网关版）
用法：
  python tts_emotion.py --prompt "<要合成的文本>" --ref <参考音频文件名> [选项]

  # 用已上传的参考音频 big_niao.wav 合成"开心"情绪的语音
  python tts_emotion.py --prompt "今天天气真好，我们去爬山吧！" --ref big_niao.wav --emotion happy --intensity 1.5

环境变量：
  GW       — 网关地址，默认 https://ai.ospreyai.cn
  API_KEY  — 网关 new-api 的 sk-xxx

说明：
  - IndexTTS2 是音色克隆型 TTS：用一段参考音频确定音色，把文本念出来
  - 情绪控制可选 8 种情绪（happy/angry/sad/fear/hate/low/surprise/neutral），强度 -2~2
  - 参考音频需先通过 /api/v1/upload 上传（type=input），此处传文件名而非本地路径
  - 输出 mp3，保存到 ComfyUI output 根目录（subfolder 为空）
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

# 情绪名 → IndexTTS2 Emotional Control 节点字段
EMOTIONS = ["happy", "angry", "sad", "fear", "hate", "low", "surprise", "neutral"]

# 工作流节点 ID
NODE_RUN = "11"            # IndexTTS2Run
NODE_TEXT = "13"           # MultiLinePromptIndex 文本
NODE_REF_AUDIO = "14"      # LoadAudio 参考音频
NODE_EMO = "16"            # Emotional Control 情绪向量
NODE_SAVE = "20"           # SaveAudioMP3


def build_prompt(text, ref_audio, emotion, intensity, output_prefix):
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        nodes = json.load(f)

    nodes[NODE_TEXT]["inputs"]["multi_line_prompt"] = text
    nodes[NODE_REF_AUDIO]["inputs"]["audio"] = ref_audio

    # 情绪向量：只设选中的情绪，其余置 0
    emo_inputs = {e: 0.0 for e in EMOTIONS}
    emo_inputs[emotion] = float(intensity)
    nodes[NODE_EMO]["inputs"] = emo_inputs

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
    """outputs 里音频文件在 'audio' 字段，返回 [(filename, subfolder, type)]"""
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
    parser = argparse.ArgumentParser(description="ComfyUI IndexTTS2 情绪控制语音合成（公网网关版）")
    parser.add_argument("--prompt", required=True, help="要合成的文本（中文/英文均可）")
    parser.add_argument("--ref", required=True, help="参考音频文件名（需先上传，如 big_niao.wav）")
    parser.add_argument("--emotion", default="neutral",
                        choices=EMOTIONS, help="情绪（默认 neutral）")
    parser.add_argument("--intensity", type=float, default=1.0,
                        help="情绪强度 -2~2（默认 1.0，负值=反向）")
    parser.add_argument("--output_prefix", default="IN会话", help="输出文件名前缀（默认 IN会话）")
    parser.add_argument("--output", default=None, help="本地保存路径（默认当前目录）")
    parser.add_argument("--timeout", type=int, default=300, help="轮询超时秒数（默认 300）")
    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: 请设置环境变量 API_KEY"); return

    print("=== ComfyUI IndexTTS2 情绪控制 ===")
    print(f"Gateway:  {GW}")
    print(f"Ref:      {args.ref}")
    print(f"Emotion:  {args.emotion} ({args.intensity})")
    print(f"Prompt:   {args.prompt}")
    print()

    nodes = build_prompt(args.prompt, args.ref, args.emotion, args.intensity,
                         args.output_prefix)
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
