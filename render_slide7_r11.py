#!/usr/bin/env python3
"""Round 11: crop both legend regions on slide 7 at 3x DPR."""
import time
from playwright.sync_api import sync_playwright

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

    # Find all flex:1 columns (col 2 = bilinear, col 3 = feature grid)
    cols = page.evaluate("""() => {
        var slide = document.querySelector('.reveal .slides section.present');
        // get the 3-col flex container children that are flex:1
        var flex = slide ? slide.querySelector('div[style*="display:flex"]') : null;
        if (!flex) return [];
        var children = flex.children;
        var result = [];
        for (var i = 0; i < children.length; i++) {
            var r = children[i].getBoundingClientRect();
            result.push({idx:i, x:r.x, y:r.y, w:r.width, h:r.height});
        }
        return result;
    }""")
    print("Columns:", cols)

    # Crop each of col2 (bilinear) and col3 (feature grid) at 3x DPR
    for i, col in enumerate(cols):
        pad = 6
        page.screenshot(
            path=f"qa/round11/slide_07_col{i+1}_crop.png",
            clip={"x": col["x"]-pad, "y": col["y"]-pad,
                  "width": col["w"]+2*pad, "height": col["h"]+2*pad}
        )
        print(f"Col {i+1} crop → qa/round11/slide_07_col{i+1}_crop.png")

    browser.close()
