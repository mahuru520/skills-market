# md-to-pdf

Convert Markdown documents to PDF using pandoc + wkhtmltopdf.

## Overview

This skill provides a self-contained Markdown-to-PDF conversion workflow with:
- Offline installable dependencies
- One-click conversion scripts
- Chinese font support
- Troubleshooting guides

## Quick Start

```bash
# Check environment
bash scripts/check_env.sh

# Install (offline)
bash scripts/install_offline.sh

# Convert
bash scripts/md2pdf.sh input.md output.pdf
```

## Directory Structure

```
md-to-pdf/
├── SKILL.md              # Main skill entry
├── README.md             # This file
├── scripts/
│   ├── check_env.sh      # Verify dependencies
│   ├── install_offline.sh # Install from local packages
│   └── md2pdf.sh         # Convert MD to PDF
├── packages/             # 离线 .deb（未纳入仓库，见 references/install.md）
│   ├── pandoc/           #   Pandoc offline package
│   └── wkhtmltopdf/      #   wkhtmltopdf + libssl
└── references/
    ├── install.md        # Detailed setup guide
    ├── conversion.md     # Conversion usage
    └── troubleshooting.md # FAQ and solutions
```

## Dependencies

| Package | Purpose | Included |
|---------|---------|----------|
| pandoc | MD → HTML | ✓ |
| wkhtmltopdf | HTML → PDF | ✓ |
| libssl1.1 | SSL compatibility | ✓ |
| fonts-wqy-zenhei | Chinese fonts | via apt |

## When to Use

- **md-to-pdf**: Simple, utility conversion for quick exports
- **minimax-pdf**: Design-heavy, high-quality PDF generation

## Verification

Run after conversion:
```bash
bash scripts/check_env.sh
```

Check output:
- PDF exists and is non-empty
- Chinese text displays correctly
- Images render (if present)
