#!/usr/bin/env python3
"""Round 10: crop the legend text region below the bilinear diagram on slide 7."""
import time
from playwright.sync_api import sync_playwright

OUT_LEGEND = "qa/round10/slide_07_legend_crop.png"
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

    # Get bounding boxes: the bilinear chart div and the legend paragraph below it
    info = page.evaluate("""() => {
        var chart = document.querySelector('[data-emi="diagram-bilinear"]');
        // Look for the legend: a <p> that follows the chart div (sibling or nearby)
        // It may be in the same figure or column; try to find it by its content
        var col = chart ? chart.closest('div[style*="flex:1"]') : null;
        // Find all paragraphs in the column that are NOT the eyebrow
        var legendEl = null;
        if (col) {
            var paras = col.querySelectorAll('p.caption, p[class*="legend"], p');
            for (var i = 0; i < paras.length; i++) {
                var txt = paras[i].textContent;
                if (txt.indexOf('restoring') >= 0 || txt.indexOf('stiffness') >= 0
                    || txt.indexOf('yield') >= 0) {
                    legendEl = paras[i];
                    break;
                }
            }
        }
        var cr = chart ? chart.getBoundingClientRect() : null;
        var lr = legendEl ? legendEl.getBoundingClientRect() : null;
        return {
            chart: cr ? {x:cr.x, y:cr.y, w:cr.width, h:cr.height} : null,
            legend: lr ? {x:lr.x, y:lr.y, w:lr.width, h:lr.height} : null
        };
    }""")
    print(f"Chart:  {info['chart']}")
    print(f"Legend: {info['legend']}")

    pad = 8
    if info['legend']:
        r = info['legend']
        page.screenshot(path=OUT_LEGEND, clip={
            "x": r["x"] - pad, "y": r["y"] - pad,
            "width": r["w"] + 2*pad, "height": r["h"] + 2*pad
        })
        print(f"Legend crop → {OUT_LEGEND}")
    elif info['chart']:
        # Fall back: crop the bottom portion of the chart column (where legend lives)
        r = info['chart']
        bottom_y = r["y"] + r["h"]
        page.screenshot(path=OUT_LEGEND, clip={
            "x": r["x"] - pad, "y": bottom_y,
            "width": r["w"] + 2*pad, "height": 100
        })
        print(f"Legend fallback crop → {OUT_LEGEND}")
    else:
        page.screenshot(path=OUT_LEGEND,
                        clip={"x": 0, "y": 0, "width": W, "height": H})
        print("Full slide fallback")

    browser.close()
