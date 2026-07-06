#!/bin/bash
# md2pdf.sh — Convert Markdown to PDF

set -e

INPUT_FILE=""
OUTPUT_FILE=""

show_usage() {
    echo "Usage: $0 <input.md> [output.pdf]"
    echo "  Convert Markdown file to PDF"
    exit 1
}

if [ -z "$1" ]; then
    show_usage
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-${INPUT_FILE%.md}.pdf}"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file not found: $INPUT_FILE"
    exit 1
fi

TEMP_HTML="/tmp/$(basename "$INPUT_FILE" .md).html"

echo "Converting: $INPUT_FILE -> $OUTPUT_FILE"

pandoc "$INPUT_FILE" -t html -s -o "$TEMP_HTML"

wkhtmltopdf --enable-local-file-access "$TEMP_HTML" "$OUTPUT_FILE"

rm -f "$TEMP_HTML"

if [ -f "$OUTPUT_FILE" ]; then
    echo "Success: $OUTPUT_FILE"
    exit 0
else
    echo "Error: PDF generation failed"
    exit 1
fi
