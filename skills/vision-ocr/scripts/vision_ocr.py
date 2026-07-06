#!/usr/bin/env python3
"""
Vision OCR - 使用视觉大模型对图片进行 OCR 文字提取、内容分析、表格识别

用法:
    python vision_ocr.py <图片路径> [API_KEY|auto] [模型] [提示词]

参数:
    图片路径  - 图片文件路径 (必填)
    API_KEY   - API 密钥 (可选，默认 auto 自动获取)
    模型      - 视觉模型名称，默认 qwen3-vl-30b (可选)
    提示词    - 识别提示词 (可选)

示例:
    python vision_ocr.py ./screenshot.png
    python vision_ocr.py ./chart.png auto qwen3-vl-235b
    python vision_ocr.py ./table.png auto qwen3-vl-30b "请将图片中的表格以Markdown表格形式提取"
"""

import base64
import io
import json
import os
import sys
from urllib import request, error as urllib_error

# ─── 压缩配置 ───────────────────────────────────────────────
MAX_SIZE_KB = 500       # 压缩目标大小（KB），500KB 平衡质量与速度
MAX_DIMENSION = 2048    # 最大边长（px）
QUALITY_MIN = 50        # 最低 JPEG 质量（保证可读性）
QUALITY_START = 90      # 初始 JPEG 质量

# ─── API 配置 ───────────────────────────────────────────────
DEFAULT_MODEL = "qwen3-vl-30b"
DEFAULT_PROMPT = "请详细识别并提取这张图片中的所有文本内容，保持原始格式和层级关系。如果是表格，请以表格形式呈现。"
MAX_TOKENS = 4096
TIMEOUT = 120

# ─── OpenClaw 配置路径（自动检测）───────────────────────────
OPENCLAW_CONFIG_PATHS = [
    os.path.join(os.environ.get("OPENCLAW_HOME", ""), ".openclaw", "openclaw.json"),
    os.path.join(os.path.expanduser("~"), ".openclaw", "openclaw.json"),
]
# 按优先级尝试的 provider 名称列表
OPENCLAW_PROVIDERS = ["ospreyai", "ospreyai_tokens", "openai"]


def resolve_api_config(key_arg: str) -> tuple:
    """解析 API 配置，返回 (api_url, api_key)。按优先级：参数 > 环境变量 > OpenClaw 配置文件"""
    api_url = None
    api_key = None

    # 1. 直接传入的 Key（非 "auto"）
    if key_arg and key_arg.lower() != "auto":
        api_key = key_arg

    # 2. 环境变量
    if not api_key:
        for env_var in ("OSPREY_VISION_API_KEY", "OSPREY_API_KEY", "NEWAPI_API_KEY", "OPENAI_API_KEY"):
            val = os.environ.get(env_var, "").strip()
            if val:
                print(f"[API] 使用环境变量 {env_var}", file=sys.stderr)
                api_key = val
                break

    # 3. 从 OpenClaw 配置文件读取 provider 的 baseUrl + apiKey
    if not api_key:
        for config_path in OPENCLAW_CONFIG_PATHS:
            if not config_path or not os.path.isfile(config_path):
                continue
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                providers = cfg.get("models", {}).get("providers", {})
                for provider_name in OPENCLAW_PROVIDERS:
                    provider = providers.get(provider_name, {})
                    key = provider.get("apiKey", "")
                    base = provider.get("baseUrl", "")
                    # 跳过模板变量（如 ${XXX}）
                    if key and not key.startswith("${"):
                        api_key = key
                        if base and not base.startswith("${"):
                            # baseUrl 可能是完整端点，也可能是根路径
                            base = base.rstrip("/")
                            if base.endswith("/chat/completions"):
                                api_url = base
                            else:
                                api_url = base + "/chat/completions"
                        print(f"[API] 从 OpenClaw 配置读取 provider={provider_name}", file=sys.stderr)
                        break
                if api_key:
                    break
            except Exception as e:
                print(f"[API] 读取配置失败 {config_path}: {e}", file=sys.stderr)

    if not api_key:
        print("错误: 无法获取 API Key。", file=sys.stderr)
        print("请设置环境变量 OSPREY_VISION_API_KEY / OSPREY_API_KEY / OPENAI_API_KEY", file=sys.stderr)
        print("或在 OpenClaw 配置 models.providers 中添加 provider (ospreyai / ospreyai_tokens)", file=sys.stderr)
        sys.exit(1)

    # 兜底：未从配置拿到 url 时尝试环境变量中的 base url
    if not api_url:
        for env_base in ("OSPREY_VISION_BASE_URL", "NEWAPI_BASE_URL", "OPENAI_BASE_URL"):
            base = os.environ.get(env_base, "").strip().rstrip("/")
            if base and not base.startswith("${"):
                if base.endswith("/chat/completions"):
                    api_url = base
                else:
                    api_url = base + "/chat/completions"
                print(f"[API] 使用环境变量 {env_base} 构建端点", file=sys.stderr)
                break

    if not api_url:
        api_url = "https://open.ospreyai.cn/v1/chat/completions"
        print(f"[API] 使用默认端点: {api_url}", file=sys.stderr)
    else:
        print(f"[API] 端点: {api_url}", file=sys.stderr)

    return api_url, api_key


def compress_image(img_path: str) -> tuple:
    """如果图片超过 MAX_SIZE_KB，压缩到目标大小以内。返回 (图片字节数据, MIME类型)。"""
    file_size_kb = os.path.getsize(img_path) / 1024

    # 无需压缩
    if file_size_kb <= MAX_SIZE_KB:
        ext = os.path.splitext(img_path)[1].lower()
        mime_map = {
            ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
            ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp",
        }
        with open(img_path, "rb") as f:
            return f.read(), mime_map.get(ext, "image/png")

    print(f"[压缩] 原始大小: {file_size_kb:.1f}KB，开始压缩...", file=sys.stderr)

    try:
        from PIL import Image
    except ImportError:
        print("错误: Pillow 未安装，无法压缩大图。请运行: pip install Pillow", file=sys.stderr)
        print("或使用小于 500KB 的图片以跳过压缩。", file=sys.stderr)
        sys.exit(1)

    img = Image.open(img_path)

    # 透明通道 → 白底 RGB
    if img.mode in ("RGBA", "LA", "P"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # 缩小尺寸
    w, h = img.size
    if max(w, h) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(w, h)
        new_w, new_h = int(w * ratio), int(h * ratio)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        print(f"[压缩] 尺寸缩放: {w}x{h} -> {new_w}x{new_h}", file=sys.stderr)

    # 逐步降低 JPEG 质量
    for quality in range(QUALITY_START, QUALITY_MIN - 1, -5):
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        size_kb = buf.tell() / 1024
        if size_kb <= MAX_SIZE_KB:
            print(f"[压缩] 压缩完成: quality={quality}, 大小={size_kb:.1f}KB", file=sys.stderr)
            return buf.getvalue(), "image/jpeg"

    # 最低质量仍过大 → 进一步缩小
    scale = 0.75
    while True:
        w2, h2 = int(img.size[0] * scale), int(img.size[1] * scale)
        img_small = img.resize((w2, h2), Image.LANCZOS)
        buf = io.BytesIO()
        img_small.save(buf, format="JPEG", quality=QUALITY_MIN, optimize=True)
        size_kb = buf.tell() / 1024
        if size_kb <= MAX_SIZE_KB:
            print(f"[压缩] 缩放+压缩完成: {w2}x{h2}, quality={QUALITY_MIN}, 大小={size_kb:.1f}KB", file=sys.stderr)
            return buf.getvalue(), "image/jpeg"
        scale *= 0.75
        if scale < 0.1:
            print(f"[压缩] 警告: 无法压缩到 {MAX_SIZE_KB}KB 以内，使用当前最小版本", file=sys.stderr)
            return buf.getvalue(), "image/jpeg"


def call_vision_api(image_path: str, api_key: str, model: str = DEFAULT_MODEL, prompt: str = DEFAULT_PROMPT, api_url: str = None) -> str:
    """调用视觉 API 识别图片内容，返回识别文本。"""
    if not api_url:
        api_url = "https://open.ospreyai.cn/v1/chat/completions"
    img_bytes, mime_type = compress_image(image_path)
    b64 = base64.b64encode(img_bytes).decode()

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{b64}"},
                    },
                ],
            }
        ],
        "max_tokens": MAX_TOKENS,
    }

    req = request.Request(
        api_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=TIMEOUT) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            elif "error" in result:
                err = result["error"]
                msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
                print(f"[API] 错误: {msg}", file=sys.stderr)
                return ""
            else:
                return json.dumps(result, ensure_ascii=False, indent=2)
    except urllib_error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode()
        except Exception:
            pass
        print(f"[API] HTTP {e.code}: {body}", file=sys.stderr)
        return ""
    except urllib_error.URLError as e:
        print(f"[API] 连接失败: {e.reason}", file=sys.stderr)
        return ""
    except Exception as e:
        print(f"[API] 请求异常: {e}", file=sys.stderr)
        return ""


def main():
    if len(sys.argv) < 2:
        print("用法: python vision_ocr.py <图片路径> [API_KEY|auto] [模型] [提示词]", file=sys.stderr)
        print("可用模型: qwen3-vl-30b (默认), qwen3-vl-235b, GLM-4.7", file=sys.stderr)
        print("API_KEY 传入 auto 可自动从环境变量或 OpenClaw 配置获取", file=sys.stderr)
        sys.exit(1)

    image_path = sys.argv[1]
    key_arg = sys.argv[2] if len(sys.argv) > 2 else "auto"
    model = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_MODEL
    prompt = sys.argv[4] if len(sys.argv) > 4 else DEFAULT_PROMPT

    if not os.path.isfile(image_path):
        print(f"错误: 图片文件不存在: {image_path}", file=sys.stderr)
        sys.exit(1)

    api_url, api_key = resolve_api_config(key_arg)
    result = call_vision_api(image_path, api_key, model, prompt, api_url)
    if result:
        print(result)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
