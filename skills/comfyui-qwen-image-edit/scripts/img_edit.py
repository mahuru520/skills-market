"""
Qwen-Image-Edit-2511 图片编辑 - 公网网关版
用法: python img_edit.py "<英文提示词>" <输入图片路径> [输出文件名]

示例:
  python img_edit.py "Remove the jacket, keep the T-shirt underneath" test_input.png
  python img_edit.py "Add a red scarf" test_input.png output.png
  python img_edit.py "Change background to a sunny beach" test_input.png

环境变量:
  GW       — 网关地址，默认 https://ai.ospreyai.cn
  API_KEY  — 网关 new-api 的 sk-xxx
"""
import json
import sys
import os
import time
import requests

GW = os.getenv("GW", "https://ai.ospreyai.cn")
API_KEY = os.getenv("API_KEY", "")
OUTPUT_DIR = "E:/Dev/xiaoyi_u_claw/OspreyClaw/data/.openclaw/workspace/generated"

AUTH_HEADERS = {"Authorization": f"Bearer {API_KEY}"}


def upload_image(path, name=None):
    filename = name or os.path.basename(path)
    with open(path, 'rb') as f:
        resp = requests.post(
            f"{GW}/api/v1/upload",
            files={'image': (filename, f.read(), 'image/png')},
            data={'overwrite': 'true', 'type': 'input'},
            headers=AUTH_HEADERS,
        )
    resp.raise_for_status()
    return filename


def get_task(prompt_id, timeout=120):
    for _ in range(timeout):
        time.sleep(2)
        resp = requests.get(
            f"{GW}/api/v1/ai/tasks/{prompt_id}",
            headers=AUTH_HEADERS,
        )
        resp.raise_for_status()
        data = resp.json()
        if prompt_id in data:
            return data[prompt_id]
    raise TimeoutError("Generation timeout")


def download_view(filename, subfolder=""):
    resp = requests.get(
        f"{GW}/api/v1/ai/image/view/",
        params={"filename": filename, "type": "output", "subfolder": subfolder},
        headers=AUTH_HEADERS,
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content


def build_workflow(prompt_text, input_filename, ref_filename=None, turbo=True):
    """
    v3 格式：[node_id, slot_index] 连接，primitive 值直接放
    """
    # ref 默认为 input 本身（自我编辑模式）
    ref_f = ref_filename or input_filename

    # 生成唯一子图内节点前缀（避免和主图冲突）
    P = "170"

    if turbo:
        steps = 4
        cfg = 1.0
        lora_switch = False  # False = 不启用 4steps LoRA，用原生长则
        steps_native = 40
        cfg_native = 4.0
    else:
        steps = 40
        cfg = 4.0
        lora_switch = False
        steps_native = 40
        cfg_native = 4.0

    nodes = {
        # === 顶层节点 ===
        "41": {
            "inputs": {"image": input_filename},
            "class_type": "LoadImage"
        },
        "83": {
            "inputs": {"image": ref_f},
            "class_type": "LoadImage"
        },

        # === 子图节点 ===
        # FluxKontextImageScale - 缩放到 VAE 尺寸
        f"{P}:160": {
            "inputs": {"image": ["41", 0]},
            "class_type": "FluxKontextImageScale"
        },
        # UNETLoader
        f"{P}:161": {
            "inputs": {"unet_name": "qwen_image_edit_2511_bf16.safetensors", "weight_dtype": "default"},
            "class_type": "UNETLoader"
        },
        # CLIPLoader
        f"{P}:162": {
            "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"},
            "class_type": "CLIPLoader"
        },
        # VAELoader
        f"{P}:146": {
            "inputs": {"vae_name": "qwen_image_vae.safetensors"},
            "class_type": "VAELoader"
        },
        # ModelSamplingAuraFlow
        f"{P}:145": {
            "inputs": {"shift": 3.1, "model": [f"{P}:161", 0]},
            "class_type": "ModelSamplingAuraFlow"
        },
        # CFGNorm
        f"{P}:152": {
            "inputs": {"strength": 1.0, "model": [f"{P}:145", 0]},
            "class_type": "CFGNorm"
        },
        # VAEEncode - 编码参考图
        f"{P}:156": {
            "inputs": {"pixels": [f"{P}:160", 0], "vae": [f"{P}:146", 0]},
            "class_type": "VAEEncode"
        },

        # === Primitive 节点（参数） ===
        # Enable 4steps LoRA? (默认 False)
        f"{P}:168": {
            "inputs": {"value": lora_switch},
            "class_type": "PrimitiveBoolean"
        },
        # Steps (for Lightning LoRA path)
        f"{P}:165": {
            "inputs": {"value": steps},
            "class_type": "PrimitiveInt"
        },
        # Steps (for native path)
        f"{P}:166": {
            "inputs": {"value": steps_native},
            "class_type": "PrimitiveInt"
        },
        # CFG (Lightning LoRA path)
        f"{P}:154": {
            "inputs": {"value": cfg},
            "class_type": "PrimitiveFloat"
        },
        # CFG (native path)
        f"{P}:155": {
            "inputs": {"value": cfg_native},
            "class_type": "PrimitiveFloat"
        },

        # === TextEncodeQwenImageEditPlus (Negative/空提示 = 保持原图) ===
        f"{P}:149": {
            "inputs": {
                "prompt": "",
                "clip": [f"{P}:162", 0],
                "vae": [f"{P}:146", 0],
                "image1": [f"{P}:160", 0],
                "image2": ["83", 0],
            },
            "class_type": "TextEncodeQwenImageEditPlus"
        },
        # FluxKontextMultiReferenceLatentMethod (negative)
        f"{P}:147": {
            "inputs": {"reference_latents_method": "index_timestep_zero", "conditioning": [f"{P}:149", 0]},
            "class_type": "FluxKontextMultiReferenceLatentMethod"
        },
        # TextEncodeQwenImageEditPlus (Positive/编辑提示词)
        f"{P}:151": {
            "inputs": {
                "prompt": prompt_text,
                "clip": [f"{P}:162", 0],
                "vae": [f"{P}:146", 0],
                "image1": [f"{P}:160", 0],
                "image2": ["83", 0],
            },
            "class_type": "TextEncodeQwenImageEditPlus"
        },
        # FluxKontextMultiReferenceLatentMethod (positive)
        f"{P}:148": {
            "inputs": {"reference_latents_method": "index_timestep_zero", "conditioning": [f"{P}:151", 0]},
            "class_type": "FluxKontextMultiReferenceLatentMethod"
        },

        # === LoRA (Lightning 4steps) ===
        f"{P}:153": {
            "inputs": {
                "lora_name": "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors",
                "strength_model": 1.0,
                "model": [f"{P}:152", 0]
            },
            "class_type": "LoraLoaderModelOnly"
        },

        # === Switch 节点 ===
        # Model switch
        f"{P}:163": {
            "inputs": {
                "switch": [f"{P}:168", 0],
                "on_false": [f"{P}:152", 0],
                "on_true": [f"{P}:153", 0]
            },
            "class_type": "ComfySwitchNode"
        },
        # CFG switch
        f"{P}:164": {
            "inputs": {
                "switch": [f"{P}:168", 0],
                "on_false": [f"{P}:154", 0],
                "on_true": [f"{P}:155", 0]
            },
            "class_type": "ComfySwitchNode"
        },
        # Steps switch
        f"{P}:167": {
            "inputs": {
                "switch": [f"{P}:168", 0],
                "on_false": [f"{P}:166", 0],
                "on_true": [f"{P}:165", 0]
            },
            "class_type": "ComfySwitchNode"
        },

        # === KSampler ===
        f"{P}:169": {
            "inputs": {
                "seed": int(time.time() * 1000) % (2**62),
                "steps": [f"{P}:167", 0],
                "cfg": [f"{P}:164", 0],
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": [f"{P}:163", 0],
                "positive": [f"{P}:148", 0],
                "negative": [f"{P}:147", 0],
                "latent_image": [f"{P}:156", 0]
            },
            "class_type": "KSampler"
        },
        # VAEDecode
        f"{P}:158": {
            "inputs": {"samples": [f"{P}:169", 0], "vae": [f"{P}:146", 0]},
            "class_type": "VAEDecode"
        },

        # === SaveImage ===
        "9": {
            "inputs": {"filename_prefix": "Qwen_Edit_2511", "images": [f"{P}:158", 0]},
            "class_type": "SaveImage"
        }
    }

    return nodes


def submit_workflow(nodes):
    """提交到网关，返回 prompt_id"""
    resp = requests.post(
        f"{GW}/api/v1/ai/image/generate",
        json={"prompt": nodes, "extra_data": {}},
        headers={**AUTH_HEADERS, "Content-Type": "application/json"},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    prompt_id = data.get("prompt_id") or data.get("number")
    return prompt_id, data


def run_edit(prompt_text, input_path, output_name=None, turbo=True, ref_path=None):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"[1/5] Uploading images...")
    input_fname = upload_image(input_path)
    print(f"       Input: {input_fname}")

    ref_fname = None
    if ref_path and ref_path != input_path:
        ref_fname = upload_image(ref_path)
        print(f"       Ref:   {ref_fname}")

    print(f"[2/5] Building workflow (turbo={turbo})")
    print(f"       Prompt: {prompt_text}")
    nodes = build_workflow(prompt_text, input_fname, ref_fname, turbo)

    print(f"[3/5] Submitting to gateway ({GW})...")
    prompt_id, resp_data = submit_workflow(nodes)
    print(f"       Prompt ID: {prompt_id}")

    print(f"[4/5] Waiting for completion...")
    task = get_task(prompt_id, timeout=120)

    print(f"[5/5] Downloading output...")
    outputs = task.get("outputs", {})
    saved = []
    for node_id, output in outputs.items():
        if "images" in output:
            for img in output["images"]:
                fname = img["filename"]
                subfolder = img.get("subfolder", "")
                img_bytes = download_view(fname, subfolder)
                out_path = os.path.join(OUTPUT_DIR, output_name or fname)
                with open(out_path, 'wb') as f:
                    f.write(img_bytes)
                print(f"       Saved: {out_path}")
                saved.append(out_path)

    if not saved:
        print("⚠️  No images in output. Status:")
        status_str = task.get("status", {}).get("status_str", "unknown")
        print(f"    Status: {status_str}")
        print(f"    Full output: {json.dumps(task, indent=2, ensure_ascii=False)[:2000]}")
        return None
    return saved[0]


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    if not API_KEY:
        print("ERROR: 请设置环境变量 API_KEY（网关 new-api 的 sk-xxx）")
        sys.exit(1)

    prompt = sys.argv[1]
    input_path = sys.argv[2]
    output_name = sys.argv[3] if len(sys.argv) > 3 else None

    try:
        result = run_edit(prompt, input_path, output_name)
        if result:
            print(f"\n✅ Done: {result}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
