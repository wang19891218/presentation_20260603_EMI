#!/usr/bin/env python3
"""Round 9: crop the full center column of slide 7 (bilinear diagram + legend)."""
import time
from playwright.sync_api import sync_playwright

OUT = "qa/round9/slide_07_labels_crop.png"
BASE_URL = "http://127.0.0.1:8770"
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
                .forEach(f => f.classList.add('visible'));
    }""")
    time.sleep(0.5)

    # Get bounding box of the bilinear chart div
    info = page.evaluate("""() => {
        var chart = document.querySelector('[data-emi="diagram-bilinear"]');
        var col   = chart ? chart.closest('div[style*="flex:1"]') : null;
        var cr = chart ? chart.getBoundingClientRect() : null;
        var pr = col   ? col.getBoundingClientRect()   : null;
        return { chart: cr ? {x:cr.x,y:cr.y,w:cr.width,h:cr.height} : null,
                 col:   pr ? {x:pr.x,y:pr.y,w:pr.width,h:pr.height} : null };
    }""")
    print(f"Chart: {info['chart']}")
    print(f"Column: {info['col']}")

    # Crop the full center column (chart + legend below it), with padding
    if info['col']:
        r = info['col']
        pad = 8
        page.screenshot(path=OUT, clip={
            "x": r["x"] - pad, "y": r["y"] - pad,
            "width": r["w"] + 2*pad, "height": r["h"] + 2*pad
        })
    elif info['chart']:
        r = info['chart']
        page.screenshot(path=OUT, clip={"x": r["x"]-8, "y": r["y"]-8,
                                        "width": r["w"]+16, "height": r["h"]+80})
    else:
        page.screenshot(path=OUT, clip={"x": 0, "y": 0, "width": W, "height": H})
    print(f"Crop → {OUT}")
    browser.close()
