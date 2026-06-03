#!/usr/bin/env python3
"""Render backup PDF via Playwright using Reveal.js ?print-pdf mode.

Usage:
    python3 render_pdf.py <output_path>
"""

import sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_PATH = sys.argv[1] if len(sys.argv) > 1 else "backup/EMI2026_hypernetwork.pdf"
BASE_URL = "http://127.0.0.1:8770"

def render_pdf():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox", "--disable-gpu"])
        context = browser.new_context(
            viewport={"width": 1280, "height": 720},
        )
        page = context.new_page()

        # Load in print-pdf mode so all slides appear as pages
        url = f"{BASE_URL}/?print-pdf"
        print(f"Loading {url} ...")
        page.goto(url, wait_until="networkidle", timeout=30000)

        # Wait for all slides to be rendered
        page.wait_for_function(
            "() => document.querySelectorAll('.reveal .slides section').length >= 15",
            timeout=15000
        )
        time.sleep(3)  # let charts animate/render

        print("Printing to PDF ...")
        page.pdf(
            path=OUT_PATH,
            width="1280px",
            height="720px",
            print_background=True,
        )

        browser.close()
        print(f"PDF written → {OUT_PATH}")

if __name__ == "__main__":
    render_pdf()
