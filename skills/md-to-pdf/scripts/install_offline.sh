#!/bin/bash
# install_offline.sh — Install dependencies from local packages

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "=== md-to-pdf Offline Installation ==="
echo ""

# Install libssl1.1 first (required by wkhtmltopdf on Debian 12)
if [ -f "$SKILL_DIR/packages/wkhtmltopdf/libssl1.1_1.1.1f-1ubuntu2_amd64.deb" ]; then
    echo "Installing libssl1.1..."
    dpkg --force-all -i "$SKILL_DIR/packages/wkhtmltopdf/libssl1.1_1.1.1f-1ubuntu2_amd64.deb" || true
    apt-get install -f -y || true
else
    echo -e "${RED}libssl1.1 package not found${NC}"
    exit 1
fi

# Install wkhtmltopdf
if [ -f "$SKILL_DIR/packages/wkhtmltopdf/wkhtmltox_0.12.6.1-2.bullseye_amd64.deb" ]; then
    echo "Installing wkhtmltopdf..."
    dpkg --force-all -i "$SKILL_DIR/packages/wkhtmltopdf/wkhtmltox_0.12.6.1-2.bullseye_amd64.deb" || true
    apt-get install -f -y || true
else
    echo -e "${RED}wkhtmltopdf package not found${NC}"
    exit 1
fi

# Install pandoc
if [ -f "$SKILL_DIR/packages/pandoc/pandoc-3.9-1-amd64.deb" ]; then
    echo "Installing pandoc..."
    dpkg -i "$SKILL_DIR/packages/pandoc/pandoc-3.9-1-amd64.deb" || true
else
    echo -e "${RED}pandoc package not found${NC}"
    exit 1
fi

# Install Chinese fonts
echo "Installing Chinese fonts..."
apt-get install -y fonts-wqy-zenhei || true
fc-cache -f || true

echo ""
if command -v pandoc &> /dev/null && command -v wkhtmltopdf &> /dev/null; then
    echo -e "${GREEN}Installation complete!${NC}"
    exit 0
else
    echo -e "${RED}Installation incomplete. Please check errors above.${NC}"
    exit 1
fi
