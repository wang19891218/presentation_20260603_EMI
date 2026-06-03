#!/usr/bin/env python3
"""Render all 15 Reveal.js slides to PNG using Playwright.

Usage:
    python3 render_slides.py <output_dir>

Each slide is rendered at 1280x720 (16:9) with all fragments expanded.
Uses the live server at http://127.0.0.1:8770.
"""

import sys, time, os
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("qa/round6")
OUT_DIR.mkdir(parents=True, exist_ok=True)

N_SLIDES = 16
BASE_URL = "http://127.0.0.1:8770"
W, H = 1280, 720

def render_all():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox", "--disable-gpu"])
        context = browser.new_context(viewport={"width": W, "height": H})
        page = context.new_page()

        for i in range(1, N_SLIDES + 1):
            # Navigate to slide i (Reveal.js uses 0-based indexing for ?slide=)
            # Use hash-based navigation: /#/0, /#/1, etc.
            idx = i - 1
            url = f"{BASE_URL}/#{idx}"
            page.goto(url, wait_until="networkidle")

            # Wait for reveal to initialize and render
            page.wait_for_function("() => window.Reveal && Reveal.isReady()", timeout=10000)

            # Expand all fragments on this slide
            page.evaluate("""() => {
                if (window.Reveal) {
                    // Go to correct slide first (ensure we're on the right one)
                    var indices = Reveal.getIndices();
                }
            }""")

            # Navigate explicitly via Reveal API
            page.evaluate(f"() => {{ if(window.Reveal) Reveal.slide({idx}, 0, 0); }}")
            time.sleep(0.5)

            # Expand all fragments on current slide
            page.evaluate("""() => {
                if (window.Reveal) {
                    // Show all fragments
                    var frags = document.querySelectorAll('.reveal .slides section.present .fragment');
                    frags.forEach(function(f) {
                        f.classList.add('visible');
                        f.classList.remove('current-fragment');
                    });
                }
            }""")
            time.sleep(0.3)

            out_path = OUT_DIR / f"slide_{i:02d}.png"
            page.screenshot(path=str(out_path), clip={"x": 0, "y": 0, "width": W, "height": H})
            print(f"  rendered slide {i:02d} → {out_path}")

        browser.close()

if __name__ == "__main__":
    print(f"Rendering {N_SLIDES} slides to {OUT_DIR} at {W}×{H}...")
    render_all()
    print("Done.")
