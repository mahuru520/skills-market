---
name: dify-contract-review
description: Use when performing contract risk analysis or reviewing contract documents by calling the internal Dify workflow API. Triggered when user provides a contract file (PDF, Word, etc.) and requests risk assessment, clause analysis, or contract review reports.
---

# Dify Contract Review Skill

## Overview

Calls the internal Dify workflow `合同审核报告all_in_one` to perform automated contract risk analysis. The workflow accepts a contract file and returns a structured risk assessment report.

**Service:** `http://192.168.1.236/v1`
**Workflow:** 合同审核报告all_in_one
**Auth:** `Authorization: Bearer app-CMEOoWabwlsqPUWtYwFXlsO8`
**Timeout:** 1800 seconds (30 minutes) — MUST be set on every workflow run call
**Output dir:** `/data/file/contract_review_results/` — all result files saved here

## Two-Step Process

```
Step 1: Upload file  →  POST /v1/files/upload  →  get upload_file_id
Step 2: Run workflow →  POST /v1/workflows/run  →  get review report → save to output dir
```

## Step 1 — Upload Contract File

```python
import requests

BASE_URL        = "http://192.168.1.236/v1"
API_KEY         = "app-CMEOoWabwlsqPUWtYwFXlsO8"
HEADERS         = {"Authorization": f"Bearer {API_KEY}"}
WORKFLOW_TIMEOUT = 1800  # 30 minutes — contract review can be slow, never use default timeout

def upload_file(file_path: str) -> str:
    """Upload contract file, returns upload_file_id."""
    with open(file_path, "rb") as f:
        resp = requests.post(
            f"{BASE_URL}/files/upload",
            headers=HEADERS,
            files={"file": (file_path, f, "application/octet-stream")},
            data={"user": "contract-reviewer"}
        )
    resp.raise_for_status()
    return resp.json()["id"]  # upload_file_id
```

Supported file types: PDF, DOC, DOCX, TXT

## Step 2 — Run Workflow

```python
def run_contract_review(upload_file_id: str) -> dict:
    """Run contract review workflow, returns output dict."""
    payload = {
        "inputs": {
            "ContractFile": {
                "transfer_method": "local_file",
                "upload_file_id": upload_file_id,
                "type": "document"
            }
        },
        "response_mode": "blocking",
        "user": "contract-reviewer"
    }
    resp = requests.post(
        f"{BASE_URL}/workflows/run",
        headers={**HEADERS, "Content-Type": "application/json"},
        json=payload,
        timeout=WORKFLOW_TIMEOUT  # REQUIRED: 30 min, contract review LLM chains take long
    )
    resp.raise_for_status()
    return resp.json()
```

## Complete Example

```python
import requests
import json
import os
from pathlib import Path
from datetime import datetime

BASE_URL         = "http://192.168.1.236/v1"
API_KEY          = "app-CMEOoWabwlsqPUWtYwFXlsO8"
HEADERS          = {"Authorization": f"Bearer {API_KEY}"}
WORKFLOW_TIMEOUT = 1800  # 30 minutes
OUTPUT_DIR       = Path("/data/file/contract_review_results")

def review_contract(file_path: str) -> Path:
    """Review a contract file and save the report. Returns the saved report path."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Upload file
    with open(file_path, "rb") as f:
        upload_resp = requests.post(
            f"{BASE_URL}/files/upload",
            headers=HEADERS,
            files={"file": (file_path, f, "application/octet-stream")},
            data={"user": "contract-reviewer"}
        )
    upload_resp.raise_for_status()
    file_id = upload_resp.json()["id"]
    print(f"File uploaded: {file_id}")

    # 2. Run workflow (timeout=1800 is REQUIRED — review can take 10-20 min)
    run_resp = requests.post(
        f"{BASE_URL}/workflows/run",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={
            "inputs": {
                "ContractFile": {
                    "transfer_method": "local_file",
                    "upload_file_id": file_id,
                    "type": "document"
                }
            },
            "response_mode": "blocking",
            "user": "contract-reviewer"
        },
        timeout=WORKFLOW_TIMEOUT  # MUST set — default timeout will cause failure
    )
    run_resp.raise_for_status()
    result = run_resp.json()
    outputs = result["data"]["outputs"]

    # 3. Save result to output directory
    stem = Path(file_path).stem
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = OUTPUT_DIR / f"{stem}_审核报告_{timestamp}.json"
    out_path.write_text(json.dumps(outputs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Report saved: {out_path}")
    return out_path

# Usage
review_contract("contract.pdf")
```

## Response Structure

```json
{
  "workflow_run_id": "xxxxxxxx-...",
  "task_id": "xxxxxxxx-...",
  "data": {
    "id": "xxxxxxxx-...",
    "status": "succeeded",
    "outputs": {
      "text": "合同审核报告内容..."
    },
    "elapsed_time": 12.5,
    "total_tokens": 3200,
    "total_steps": 5
  }
}
```

Key field: `result["data"]["outputs"]` — contains the actual review report.

## Streaming Mode (for long contracts)

For large contracts where blocking may time out, use streaming:

```python
def review_contract_streaming(file_path: str) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    file_id = upload_file(file_path)  # same upload step

    resp = requests.post(
        f"{BASE_URL}/workflows/run",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={
            "inputs": {
                "ContractFile": {
                    "transfer_method": "local_file",
                    "upload_file_id": file_id,
                    "type": "document"
                }
            },
            "response_mode": "streaming",
            "user": "contract-reviewer"
        },
        stream=True,
        timeout=WORKFLOW_TIMEOUT  # REQUIRED even in streaming mode
    )
    for line in resp.iter_lines():
        if line and line.startswith(b"data:"):
            event = json.loads(line[5:])
            if event.get("event") == "workflow_finished":
                outputs = event["data"]["outputs"]
                stem = Path(file_path).stem
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                out_path = OUTPUT_DIR / f"{stem}_审核报告_{timestamp}.json"
                out_path.write_text(json.dumps(outputs, ensure_ascii=False, indent=2), encoding="utf-8")
                return out_path
```

## Quick Reference

| Parameter | Value |
|-----------|-------|
| Base URL | `http://192.168.1.236/v1` |
| Upload endpoint | `POST /files/upload` |
| Run endpoint | `POST /workflows/run` |
| File variable name | `ContractFile` |
| Transfer method | `local_file` |
| File type | `document` |
| Response mode | `blocking` (default) or `streaming` |
| **Timeout** | **`1800` seconds (30 min) — REQUIRED on every call** |
| **Output directory** | **`/data/file/contract_review_results/`** |
| Auth header | `Bearer app-CMEOoWabwlsqPUWtYwFXlsO8` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping upload step, passing file path directly | Always upload first to get `upload_file_id` |
| Wrong variable name (`file` instead of `ContractFile`) | Use exact name `ContractFile` |
| Missing `type: "document"` in file object | Include `"type": "document"` in the file dict |
| Using `Content-Type` header on upload request | Do NOT set `Content-Type` for multipart upload — let requests set it |
| **No timeout or short timeout set** | **Always pass `timeout=1800` — default will fail on long contracts** |
| **Not saving output to the designated directory** | **Always write results to `/data/file/contract_review_results/`** |
| Output directory not existing | Call `OUTPUT_DIR.mkdir(parents=True, exist_ok=True)` before saving |
