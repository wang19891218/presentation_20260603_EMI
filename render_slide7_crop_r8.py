#!/usr/bin/env python3
"""Render slide 7 at 3x DPR and crop the bilinear label region for round8."""
import time
from playwright.sync_api import sync_playwright

OUT_CROP = "qa/round8/slide_07_labels_crop.png"
BASE_URL  = "http://127.0.0.1:8770"
SCALE = 3
W, H = 1280, 720

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--no-sandbox", "--disable-gpu"])
    ctx = browser.new_context(viewport={"width": W, "height": H}, device_scale_factor=SCALE)
    page = ctx.new_page()
    page.goto(f"{BASE_URL}/#6", wait_until="networkidle")
    page.wait_for_function("() => window.Reveal && Reveal.isReady()", timeout=10000)
    page.evaluate("() => { if(window.Reveal) Reveal.slide(6,0,0); }")
    time.sleep(1.5)
    page.evaluate("""() => {
        document.querySelectorAll('.reveal .slides section.present .fragment')
                .forEach(f => { f.classList.add('visible'); });
    }""")
    time.sleep(0.5)
    bbox = page.evaluate("""() => {
        var el = document.querySelector('[data-emi="diagram-bilinear"]');
        if (!el) return null;
        var r = el.getBoundingClientRect();
        return {x: r.x, y: r.y, w: r.width, h: r.height};
    }""")
    print(f"Bilinear bbox: {bbox}")
    pad = 10
    page.screenshot(path=OUT_CROP, clip={
        "x": bbox["x"] - pad, "y": bbox["y"] - pad,
        "width": bbox["w"] + 2*pad, "height": bbox["h"] + 2*pad
    })
    print(f"Crop → {OUT_CROP}")
    browser.close()
