"""
gen_slide02_hero.py
Generates assets/slide02_hero.png

Path (a): OPENAI_API_KEY from environment (source .coco/.env first)
Model: gpt-image-2, size: 1536x1024 (landscape)
Falls back to a programmatic matplotlib cityscape if API call fails.

Run from project root:
  OPENAI_API_KEY=<key> python3 presentation_emi_2026/assets/scripts/gen_slide02_hero.py
"""

import os
import sys
import base64

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT_PATH = os.path.join(ASSETS_DIR, "slide02_hero.png")

PROMPT = (
    "Clean, professional, light-background editorial illustration: "
    "a dense skyline of diverse tall buildings under wind, conveying "
    "portfolio-scale structural response analysis; subtle blue (#0071e3) "
    "and warm orange (#ff9f0a) accents; minimal, scientific, Apple-keynote "
    "aesthetic; no text."
)


def try_openai(api_key):
    try:
        from openai import OpenAI
    except ImportError:
        print("[gen_slide02] openai package not installed.")
        return False
    print("[gen_slide02] Calling gpt-image-2 ...")
    try:
        client = OpenAI(api_key=api_key)
        response = client.images.generate(
            model="gpt-image-2",
            prompt=PROMPT,
            size="1536x1024",
            quality="high",
            output_format="png",
            n=1,
        )
        img = response.data[0]
        if hasattr(img, "b64_json") and img.b64_json:
            raw = base64.b64decode(img.b64_json)
            with open(OUT_PATH, "wb") as f:
                f.write(raw)
            print(f"[gen_slide02] Saved (b64): {OUT_PATH} ({len(raw):,} bytes)")
            return True
        elif hasattr(img, "url") and img.url:
            import urllib.request
            urllib.request.urlretrieve(img.url, OUT_PATH)
            print(f"[gen_slide02] Saved (url): {OUT_PATH} ({os.path.getsize(OUT_PATH):,} bytes)")
            return True
        else:
            print(f"[gen_slide02] Unexpected response: {img}")
            return False
    except Exception as exc:
        print(f"[gen_slide02] API error: {exc}")
        return False


def programmatic_fallback():
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    import numpy as np

    PRIMARY, ACCENT = "#0071e3", "#ff9f0a"
    INK, BG = "#1d1d1f", "#f5f5f7"
    LINE = "#d2d2d7"
    rng = np.random.default_rng(42)

    fig, ax = plt.subplots(figsize=(1536/150, 1024/150), facecolor=BG)
    ax.set_xlim(0, 1536); ax.set_ylim(0, 1024); ax.axis("off")
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)

    ax.fill_between([0, 1536], [0, 0], [60, 60], color=LINE, alpha=0.4)
    n = 38
    xs = np.sort(rng.uniform(30, 1506, n))
    ws = rng.uniform(28, 70, n)
    hs = rng.uniform(140, 820, n)
    for x, w, h in zip(xs, ws, hs):
        shade = 0.82 + rng.uniform(-0.08, 0.08)
        r = rng.random()
        if r < 0.12:
            face = (0x00/255*shade, 0x71/255*shade, 0xe3/255*shade)
        elif r < 0.19:
            face = (1.0, 0.624*shade, 0.039*shade)
        else:
            g = shade * 0.88
            face = (g, g+0.01, g+0.02)
        ax.add_patch(mpatches.Rectangle((x-w/2, 60), w, h,
                     facecolor=face, edgecolor="white", linewidth=0.4,
                     alpha=0.92, zorder=3))
        ww, wh = max(4, w*0.18), max(5, h*0.05)
        cols = max(2, int(w/(ww*2.2))); rows = max(3, int(h/(wh*3.0)))
        for ci in range(cols):
            for ri in range(rows):
                wx = x-w/2 + w/(cols+1)*(ci+1); wy = 60 + h/(rows+1)*(ri+1)
                lit = rng.random() < 0.65
                wc = PRIMARY if lit and rng.random()<0.3 else \
                     ACCENT  if lit and rng.random()<0.15 else "white"
                ax.add_patch(mpatches.Rectangle((wx-ww/2, wy-wh/2), ww, wh,
                             facecolor=wc, alpha=0.55 if lit else 0.1,
                             linewidth=0, zorder=4))
    for j in range(12):
        y0 = rng.uniform(200, 900)
        pts = np.linspace(-40, 1600, 80)
        wave = 18*np.sin(pts/220 + j)*np.exp(-pts/2400)
        ax.plot(pts, y0+wave, color=PRIMARY if j%3!=0 else ACCENT,
                lw=rng.uniform(0.8, 1.6), alpha=rng.uniform(0.04, 0.12), zorder=5)
    fig.savefig(OUT_PATH, format="png", dpi=150, bbox_inches="tight", facecolor=BG)
    print(f"[gen_slide02] Fallback saved: {OUT_PATH} ({os.path.getsize(OUT_PATH):,} bytes)")


if __name__ == "__main__":
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("[gen_slide02] No OPENAI_API_KEY — using fallback.")
        programmatic_fallback()
    elif not try_openai(api_key):
        print("[gen_slide02] API failed — using fallback.")
        programmatic_fallback()

    if os.path.exists(OUT_PATH) and os.path.getsize(OUT_PATH) > 1000:
        print(f"[gen_slide02] Verified: {OUT_PATH}")
    else:
        print("[gen_slide02] ERROR: output missing!")
        sys.exit(1)
