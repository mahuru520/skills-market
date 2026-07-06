---
name: md-to-pdf
description: Convert Markdown documents to PDF. Use when: (1) User requests MD to PDF conversion (2) Need to install wkhtmltopdf/pandoc dependencies (3) Need batch or scripted conversion
metadata:
  version: "1.0"
  category: document-processing
triggers:
  - md转pdf
  - markdown转pdf
  - md to pdf
  - markdown to pdf
---

# md-to-pdf

Convert Markdown documents to PDF using pandoc + wkhtmltopdf.

## Quick Start

```bash
# Check environment
bash scripts/check_env.sh

# Install dependencies (offline)
bash scripts/install_offline.sh

# Convert single file
bash scripts/md2pdf.sh input.md output.pdf
```

## Task Routing

| Scenario | Action |
|----------|--------|
| Need to install dependencies | → Route A: Setup |
| Convert one file | → Route B: Convert |
| Convert multiple files | → Route C: Batch |
| Conversion failed | → Route D: Troubleshoot |

## Route A: Setup

### Online Install
```bash
apt-get update
apt-get install -y pandoc wkhtmltopdf fonts-wqy-zenhei
fc-cache -f
```

### Offline Install (Recommended)
```bash
bash scripts/install_offline.sh
```

See `references/install.md` for details.

## Route B: Convert Single File

### Manual
```bash
pandoc input.md -t html -s -o temp.html
wkhtmltopdf --enable-local-file-access temp.html output.pdf
rm temp.html
```

### Using Script
```bash
bash scripts/md2pdf.sh input.md output.pdf
```

## Route C: Batch Convert

```bash
for f in *.md; do
    bash scripts/md2pdf.sh "$f"
done
```

See `references/conversion.md` for details.

## Route D: Troubleshoot

Common issues:
- "libjpeg.so.8 not found" → Use Debian 11 wkhtmltopdf
- "libssl1.1 not found" → Install libssl1.1 compatibility package
- Chinese not显示 → Install fonts-wqy-zenhei
- Local images not显示 → Use `--enable-local-file-access`

See `references/troubleshooting.md` for full guide.

## Verification

- [ ] PDF file generated
- [ ] Chinese text renders correctly
- [ ] No dependency errors
- [ ] Local images display (if present)

## References

- `references/install.md` — Setup guide
- `references/conversion.md` — Conversion usage
- `references/troubleshooting.md` — FAQ and solutions
