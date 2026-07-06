#!/bin/bash
# check_env.sh — Verify md-to-pdf dependencies are installed

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== md-to-pdf Environment Check ==="
echo ""

missing=0

# Check pandoc
if command -v pandoc &> /dev/null; then
    version=$(pandoc --version | head -n1)
    echo -e "${GREEN}✓${NC} pandoc: $version"
else
    echo -e "${RED}✗${NC} pandoc: not found"
    missing=1
fi

# Check wkhtmltopdf
if command -v wkhtmltopdf &> /dev/null; then
    version=$(wkhtmltopdf --version | head -n1)
    echo -e "${GREEN}✓${NC} wkhtmltopdf: $version"
else
    echo -e "${RED}✗${NC} wkhtmltopdf: not found"
    missing=1
fi

# Check Chinese fonts
if fc-list :lang=zh | grep -q .; then
    echo -e "${GREEN}✓${NC} Chinese fonts installed"
else
    echo -e "${YELLOW}⚠${NC} Chinese fonts: not found (optional, for Chinese rendering)"
fi

echo ""
if [ $missing -eq 0 ]; then
    echo -e "${GREEN}Environment ready!${NC}"
    exit 0
else
    echo -e "${RED}Missing dependencies. Run install_offline.sh or install online.${NC}"
    exit 1
fi
