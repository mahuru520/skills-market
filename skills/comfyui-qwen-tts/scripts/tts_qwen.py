#!/usr/bin/env python3
"""
ComfyUI Qwen3-TTS 语音定制（公网网关版）
用法：
  # VoiceDesign：用文字描述生成自定义音色，朗读给定文本
  python tts_qwen.py --mode design --text "今晚，和一个危险又迷人的姐姐喝了一杯。" \
      --instruct "模拟成熟性感的御姐音色，声音略带磁性且慵懒。"

  # VoiceClone：用参考音频的音色，把目标文本念出来（无需 instruct）
  python tts_qwen.py --mode clone --text "紧张什么？你连坐姿都在发抖……" \
      --ref <参考音频文件名> --ref_text <参考音频对应的文字>

环境变量：
  GW       — 网关地址，默认 https://ai.ospreyai.cn
  API_KEY  — 网关 new-api 的 sk-xxx

说明：
  - 基于通义千问 Qwen3-TTS（1.7B）
  - VoiceDesign：纯文字描述音色即可生成新音色并朗读（无需参考音频）
  - VoiceClone：提供参考音频 + 参考文字，克隆该音色朗读新文本
  - 工作流原导出用 PreviewAudio 输出 flac 到 temp 目录，本脚本保留原格式（flac/temp）
  - 每次运行会改 seed 避免缓存命中
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

# 工作流节点 ID
NODE_VOICE_DESIGN = "1"   # FB_Qwen3TTSVoiceDesign
NODE_PREVIEW_VD = "2"     # PreviewAudio (VoiceDesign 输出)
NODE_VOICE_CLONE = "5"    # FB_Qwen3TTSVoiceClone
NODE_STRING = "6"         # StringConstantMultiline（VoiceDesign 文本 / VoiceClone ref_text）
NODE_PREVIEW_VC = "7"     # PreviewAudio (VoiceClone 输出)


def build_prompt_design(text, instruct, seed, language):
    """VoiceDesign 模式：只跑节点 1→2，文本进节点 6。"""
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        nodes = json.load(f)

    nodes[NODE_STRING]["inputs"]["string"] = text
    nodes[NODE_VOICE_DESIGN]["inputs"]["instruct"] = instruct
    nodes[NODE_VOICE_DESIGN]["inputs"]["language"] = language
    nodes[NODE_VOICE_DESIGN]["inputs"]["seed"] = seed

    # 仅保留 VoiceDesign 链路：1, 2, 6（去掉 VoiceClone 的 5, 7）
    keep = {NODE_VOICE_DESIGN, NODE_PREVIEW_VD, NODE_STRING}
    nodes = {k: v for k, v in nodes.items() if k in keep}
    return nodes


def build_prompt_clone(target_text, ref_audio, ref_text, seed, language):
    """VoiceClone 模式：跑节点 5→7，ref_text 进节点 6，目标文本进节点 5.target_text。

    注：原工作流 VoiceClone 的 ref_audio 连接的是节点 1（VoiceDesign）的输出。
    API 调用时没有界面交互，需改为加载已上传的参考音频文件。
    这里用 LoadAudio 节点（class_type=LoadAudio）替换该连接。
    """
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        nodes = json.load(f)

    nodes[NODE_STRING]["inputs"]["string"] = ref_text
    nodes[NODE_VOICE_CLONE]["inputs"]["target_text"] = target_text
    nodes[NODE_VOICE_CLONE]["inputs"]["language"] = language
    nodes[NODE_VOICE_CLONE]["inputs"]["seed"] = seed

    # 新增一个 LoadAudio 节点接参考音频，并让 VoiceClone 的 ref_audio 指向它
    load_node_id = "100"
    nodes[load_node_id] = {
        "class_type": "LoadAudio",
        "inputs": {"audio": ref_audio, "audioUI": ""},
        "_meta": {"title": "加载参考音频"},
    }
    nodes[NODE_VOICE_CLONE]["inputs"]["ref_audio"] = [load_node_id, 0]

    # 仅保留 VoiceClone 链路：5, 7, 6, 100（去掉 VoiceDesign 的 1, 2）
    keep = {NODE_VOICE_CLONE, NODE_PREVIEW_VC, NODE_STRING, load_node_id}
    nodes = {k: v for k, v in nodes.items() if k in keep}
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
    """音频在 outputs[].audio 字段，type 可为 temp（PreviewAudio）或 output（SaveAudioMP3）。"""
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


def run_one(nodes, label, save_path, timeout):
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
    task = poll_task(pid, timeout=timeout)
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
        print(f"  {filename} (subfolder={subfolder!r}, type={ftype})")
        print(f"  {url}")
        try:
            download_file(filename, subfolder, ftype, save_path)
            print(f"  -> 已下载: {save_path}")
        except Exception as e:
            print(f"  -> 下载失败: {e}")
    print("\nDone.")


def main():
    parser = argparse.ArgumentParser(description="ComfyUI Qwen3-TTS 语音定制（公网网关版）")
    parser.add_argument("--mode", required=True, choices=["design", "clone"],
                        help="design=文字描述生成音色；clone=用参考音频克隆音色")
    parser.add_argument("--text", required=True,
                        help="design: 要朗读的文本；clone: 要用克隆音色朗读的目标文本")
    parser.add_argument("--instruct", default=None,
                        help="[design] 音色描述，如：成熟性感的御姐音色，磁性且慵懒")
    parser.add_argument("--ref", default=None,
                        help="[clone] 参考音频文件名（需先上传）")
    parser.add_argument("--ref_text", default=None,
                        help="[clone] 参考音频对应的文字内容")
    parser.add_argument("--language", default="Auto", help="语言（默认 Auto）")
    parser.add_argument("--seed", type=int, default=None, help="随机种子（默认时间戳随机）")
    parser.add_argument("--output", default=None, help="本地保存路径（默认当前目录，扩展名取服务端）")
    parser.add_argument("--timeout", type=int, default=300, help="轮询超时秒数（默认 300）")
    args = parser.parse_args()

    if not API_KEY:
        print("ERROR: 请设置环境变量 API_KEY"); return

    seed = args.seed if args.seed is not None else int(time.time() * 1000) % (2**62)

    if args.mode == "design":
        if not args.instruct:
            print("ERROR: design 模式需提供 --instruct 音色描述"); return
        print("=== ComfyUI Qwen3-TTS VoiceDesign ===")
        print(f"Gateway: {GW}")
        print(f"Text:    {args.text}")
        print(f"Instruct:{args.instruct}\n")
        nodes = build_prompt_design(args.text, args.instruct, seed, args.language)
        ext = ".flac"  # PreviewAudio 输出 flac
    else:
        if not args.ref or not args.ref_text:
            print("ERROR: clone 模式需提供 --ref 和 --ref_text"); return
        print("=== ComfyUI Qwen3-TTS VoiceClone ===")
        print(f"Gateway:  {GW}")
        print(f"Ref:      {args.ref}")
        print(f"RefText:  {args.ref_text}")
        print(f"Target:   {args.text}\n")
        nodes = build_prompt_clone(args.text, args.ref, args.ref_text, seed, args.language)
        ext = ".flac"

    save_path = args.output or os.path.join(".", f"qwen_tts_{args.mode}{ext}")
    run_one(nodes, args.mode, save_path, args.timeout)


if __name__ == "__main__":
    main()
