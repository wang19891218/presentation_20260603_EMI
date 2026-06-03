#!/usr/bin/env python3
"""Render slide 7 and save a tight crop of the bilinear SVG diagram,
using Playwright to get the exact bounding box of the chart div."""

import time
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT_CROP = "qa/round7/slide_07_labels_crop.png"
OUT_HIRES = "qa/round7/slide_07_hires.png"
BASE_URL  = "http://127.0.0.1:8770"
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

        page.goto(f"{BASE_URL}/#6", wait_until="networkidle")
        page.wait_for_function("() => window.Reveal && Reveal.isReady()", timeout=10000)
        page.evaluate("() => { if(window.Reveal) Reveal.slide(6, 0, 0); }")
        time.sleep(1.5)

        # Expand fragments
        page.evaluate("""() => {
            var frags = document.querySelectorAll('.reveal .slides section.present .fragment');
            frags.forEach(function(f) { f.classList.add('visible'); });
        }""")
        time.sleep(0.5)

        # Get bounding box of the bilinear chart container
        bbox = page.evaluate("""() => {
            var el = document.querySelector('[data-emi="diagram-bilinear"]');
            if (!el) return null;
            var r = el.getBoundingClientRect();
            return {x: r.x, y: r.y, w: r.width, h: r.height};
        }""")
        print(f"Bilinear chart bbox (CSS px): {bbox}")

        # Full hi-res screenshot (device_scale_factor=3 so image is 3840×2160)
        page.screenshot(path=OUT_HIRES,
                        clip={"x": 0, "y": 0, "width": W, "height": H})
        print(f"Hi-res full slide → {OUT_HIRES}")

        if bbox:
            pad = 10  # small padding around the element
            cx0 = max(0, bbox['x'] - pad)
            cy0 = max(0, bbox['y'] - pad)
            cw  = bbox['w'] + 2*pad
            ch  = bbox['h'] + 2*pad
            page.screenshot(
                path=OUT_CROP,
                clip={"x": cx0, "y": cy0, "width": cw, "height": ch}
            )
            print(f"Crop saved → {OUT_CROP}  (CSS region {cx0},{cy0} {cw}×{ch})")
        else:
            print("WARNING: could not find [data-emi=diagram-bilinear] — saving full slide as crop")
            page.screenshot(path=OUT_CROP,
                            clip={"x": 0, "y": 0, "width": W, "height": H})

        browser.close()

if __name__ == "__main__":
    main()
