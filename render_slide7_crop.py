#!/usr/bin/env python3
"""Render slide 7 at high DPR and save a tight crop of the bilinear label region.

Saves:
  qa/round7/slide_07_labels_crop.png  — the cropped label region
"""

import time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_FULL = "qa/round7/slide_07_hires.png"
OUT_CROP = "qa/round7/slide_07_labels_crop.png"
BASE_URL  = "http://127.0.0.1:8770"

# At scale 3, a 1280×720 slide becomes 3840×2160 pixels
SCALE = 3
W, H = 1280, 720

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--no-sandbox", "--disable-gpu"])
        context = browser.new_context(
            viewport={"width": W, "height": H},
            device_scale_factor=SCALE,
        )
        page = context.new_page()

        # Navigate to slide 7 (index 6)
        page.goto(f"{BASE_URL}/#6", wait_until="networkidle")
        page.wait_for_function("() => window.Reveal && Reveal.isReady()", timeout=10000)
        page.evaluate("() => { if(window.Reveal) Reveal.slide(6, 0, 0); }")
        time.sleep(1.0)

        # Expand fragments
        page.evaluate("""() => {
            var frags = document.querySelectorAll('.reveal .slides section.present .fragment');
            frags.forEach(function(f) {
                f.classList.add('visible');
                f.classList.remove('current-fragment');
            });
        }""")
        time.sleep(0.5)

        # Full hi-res screenshot
        page.screenshot(path=OUT_FULL, clip={"x": 0, "y": 0, "width": W, "height": H})
        print(f"Hi-res full slide → {OUT_FULL}")

        # Crop: bilinear diagram is in the center column of the 3-panel layout.
        # In 1280×720 coords: center panel ≈ x:300-650, y:55-250 (label region ~x:305-645, y:60-230)
        # At SCALE=3 those multiply by 3
        # We want to crop tightly around the bilinear SVG + its axis labels
        cx0, cy0 = 295, 58   # top-left in CSS pixels
        cx1, cy1 = 655, 245  # bottom-right in CSS pixels

        page.screenshot(
            path=OUT_CROP,
            clip={
                "x": cx0,
                "y": cy0,
                "width":  cx1 - cx0,
                "height": cy1 - cy0,
            }
        )
        print(f"Label crop → {OUT_CROP}")

        browser.close()

if __name__ == "__main__":
    main()
