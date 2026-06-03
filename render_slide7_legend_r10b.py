#!/usr/bin/env python3
"""Round 10: crop legend lines BELOW the bilinear chart (after chart bottom-edge)."""
import time
from playwright.sync_api import sync_playwright

OUT = "qa/round10/slide_07_legend_crop.png"
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

    # Dump all elements in the bilinear column to find the legend
    info = page.evaluate("""() => {
        var chart = document.querySelector('[data-emi="diagram-bilinear"]');
        var col   = chart ? chart.closest('div[style*="flex:1 1 0"]') : null;
        if (!col) col = chart ? chart.closest('div[style*="flex:1"]') : null;
        var cr = chart ? chart.getBoundingClientRect() : null;
        // collect ALL elements in col that start below the chart bottom
        var results = [];
        if (col && cr) {
            var all = col.querySelectorAll('*');
            for (var i = 0; i < all.length; i++) {
                var r = all[i].getBoundingClientRect();
                if (r.y > cr.y + cr.height - 5 && r.height > 2) {
                    results.push({
                        tag: all[i].tagName,
                        cls: all[i].className,
                        y: r.y, h: r.height, w: r.width, x: r.x,
                        txt: all[i].textContent.slice(0, 80)
                    });
                }
            }
        }
        return {chart: cr ? {x:cr.x,y:cr.y,w:cr.width,h:cr.height} : null, elems: results};
    }""")
    print(f"Chart bottom: y={info['chart']['y']+info['chart']['h'] if info['chart'] else '?'}")
    for e in info['elems'][:15]:
        print(f"  {e['tag']} y={e['y']:.0f} h={e['h']:.0f}  '{e['txt'][:60]}'")

    # Find the bounding box that covers all legend elements
    elems = [e for e in info['elems'] if e['h'] > 4]  # skip hairlines
    if elems and info['chart']:
        min_x = min(e['x'] for e in elems)
        min_y = min(e['y'] for e in elems)
        max_x = max(e['x'] + e['w'] for e in elems)
        max_y = max(e['y'] + e['h'] for e in elems)
        pad = 10
        page.screenshot(path=OUT, clip={
            "x": min_x - pad, "y": min_y - pad,
            "width": (max_x - min_x) + 2*pad,
            "height": (max_y - min_y) + 2*pad
        })
        print(f"Legend crop ({min_x:.0f},{min_y:.0f}) → {OUT}")
    elif info['chart']:
        # fallback: crop 120px below chart bottom
        r = info['chart']
        page.screenshot(path=OUT, clip={
            "x": r["x"]-8, "y": r["y"]+r["h"]-4,
            "width": r["w"]+16, "height": 130
        })
        print(f"Fallback crop below chart → {OUT}")
    browser.close()
