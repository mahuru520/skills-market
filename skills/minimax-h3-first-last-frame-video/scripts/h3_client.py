"""MiniMax H3 V2 gateway client used by this skill package."""
import base64
import json
import mimetypes
import os
import pathlib
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_GW = "https://open.ospreyai.cn"
MODEL = "MiniMax-H3"
POLL_INTERVAL = 10


def _response_json(url, api_key, method="GET", payload=None, timeout=60):
    data = None
    headers = {"Authorization": f"Bearer {api_key}"}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            text = response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"网关请求失败 HTTP {exc.code}: {detail[:1000]}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"网关网络请求失败: {exc.reason}") from exc
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"网关返回的不是 JSON: {text[:500]}") from exc


def submit_generation(gw, api_key, content, resolution, duration, ratio):
    payload = {
        "model": MODEL,
        "content": content,
        "resolution": resolution,
        "duration": duration,
        "ratio": ratio,
    }
    response = _response_json(
        f"{gw.rstrip('/')}/v2/video_generation",
        api_key,
        method="POST",
        payload=payload,
        timeout=60,
    )
    task_id = response.get("task_id")
    if not task_id:
        raise RuntimeError(f"创建任务成功但未返回 task_id: {response}")
    return str(task_id), response


def query_task(gw, api_key, task_id):
    response = _response_json(
        f"{gw.rstrip('/')}/v2/query/video_generation/{urllib.parse.quote(task_id, safe='')}",
        api_key,
        timeout=60,
    )
    task = response.get("task")
    if not isinstance(task, dict):
        raise RuntimeError(f"查询任务返回缺少 task: {response}")
    return task


def poll_task(gw, api_key, task_id, timeout):
    """轮询任务直到终态，返回 task 对象（不再返回 content.url）。"""
    started = time.monotonic()
    while True:
        task = query_task(gw, api_key, task_id)
        status = task.get("status", "unknown")
        elapsed = int(time.monotonic() - started)
        print(f"  [{elapsed}s] status={status}", flush=True)
        if status == "succeeded":
            return task
        if status in {"failed", "cancelled"}:
            raise RuntimeError(f"任务{status}: {task.get('error') or task}")
        if time.monotonic() - started >= timeout:
            raise TimeoutError(f"轮询超过 {timeout} 秒，task_id={task_id}")
        time.sleep(POLL_INTERVAL)


def download_video(gw, api_key, task_id, output):
    """通过带鉴权的下载接口取视频：GET /v1/videos/{task_id}/content"""
    target = pathlib.Path(output).expanduser().resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    url = f"{gw.rstrip('/')}/v1/videos/{urllib.parse.quote(task_id, safe='')}/content"
    request = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
    temp_name = None
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            with tempfile.NamedTemporaryFile(delete=False, dir=str(target.parent), suffix=".part") as temp:
                temp_name = pathlib.Path(temp.name)
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    temp.write(chunk)
        temp_name.replace(target)
    except Exception:
        if temp_name and temp_name.exists():
            temp_name.unlink()
        raise
    return target


def require_api_key(cli_value):
    api_key = cli_value or os.getenv("API_KEY", "")
    if not api_key:
        raise SystemExit("ERROR: 缺少 API_KEY。请用 --api-key 传入或设置环境变量 API_KEY。")
    return api_key


def validate_common(resolution, duration, ratio, allow_adaptive=False):
    if resolution not in {"768P", "2K"}:
        raise SystemExit("ERROR: resolution 必须是 768P 或 2K")
    if not 4 <= duration <= 15:
        raise SystemExit("ERROR: duration 必须是 4-15 秒的整数")
    allowed = {"21:9", "16:9", "4:3", "1:1", "3:4", "9:16"}
    if allow_adaptive:
        allowed.add("adaptive")
    if ratio not in allowed:
        raise SystemExit(f"ERROR: ratio 必须是 {', '.join(sorted(allowed))}")


def media_url(value, label):
    """Return a public URL, mm_file URI, data URI, or local file as data URI."""
    if value.startswith(("http://", "https://", "mm_file://", "data:")):
        return value
    path = pathlib.Path(value).expanduser()
    if not path.is_file():
        raise SystemExit(f"ERROR: {label} 不存在，或不是可访问的 URL: {value}")
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"

