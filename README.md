# EMI 2026 — Transformer-HyperNetwork Surrogate

Self-contained, static slide deck for Haifeng Wang's EMI 2026 talk on
generating structural response surrogates from building features with a
Transformer-HyperNetwork architecture — one model for any building in a
portfolio, no per-building retraining.

---

## How to Present

1. **Open `index.html`** in any modern browser (Chrome / Firefox / Safari).
   No server needed — the deck works fully offline via `file://`.
2. **Navigate** with arrow keys or Space (forward) / Shift+Space (back).
3. **Speaker notes** — press `S` to open the notes window in a second tab.
4. **Slide overview** — press `O` (or click the grid button, bottom-left
   corner) to open a thumbnail grid of all 15 slides; click any thumbnail
   to jump straight to that slide, or press `Esc` to close.
5. **Fragments / animations** — each interactive slide stages its reveals
   automatically when navigated forward.

---

## Rebuild from Source

Whenever you edit a slide file in `slides/`, regenerate `index.html`:

```bash
cd presentation_emi_2026
python3 build.py
```

`build.py` reads `slides/01_title.html` through `slides/15_thankyou.html`
in sorted order, inlines `data/overlays.json` and `data/results.json` as
`window.EMI_DATA`, and writes the assembled `index.html`.

---

## Regenerate the Slide-Overview Thumbnails

The overview grid (press `O`) shows a PNG thumbnail of each slide from
`assets/thumbs/slide_01.png` … `slide_15.png`. These are copies of the
integrator's QA render. **When slides change, refresh the thumbnails**
after the integrator re-renders the deck (the QA pass writes one PNG per
slide to `qa/round<N>/`):

```bash
cd presentation_emi_2026
cp qa/round<N>/slide_*.png assets/thumbs/   # use the latest round dir
```

The grid auto-discovers the slides and their titles from the live deck at
runtime, so only the images need refreshing — no code change required.

---

## Regenerate the Backup PDF

**Requires Node.js and Playwright** (installed on the build machine).

```bash
# From presentation_emi_2026/ — server must be running on port 8770
NODE_PATH=/home/coco/.npm/_npx/e41f203b7505f1fb/node_modules \
  node .coco/gen_pdf.js
```

This loads the deck at `http://127.0.0.1:8770/?print-pdf` (reveal's print
layout), waits for all slides to lay out, then writes
`backup/EMI2026_hypernetwork.pdf`.

Start a local static server if needed:

```bash
cd presentation_emi_2026
python3 -m http.server 8770 &
```

The PDF renders one page per fragment state (28 pages for this 15-slide deck).
For a one-slide-per-page export, use decktape if available:

```bash
decktape reveal http://127.0.0.1:8770/ backup/EMI2026_hypernetwork.pdf
```

---

## Embed on haifeng.wang

The deck is fully static — no server-side code, no CDN, no backend.

1. Copy the entire `presentation_emi_2026/` folder to your web root or
   hosting provider (e.g., via `scp`, `rsync`, or your provider's file
   manager).
2. Link directly to `index.html` from your site:
   ```html
   <a href="/emi2026/index.html">View Presentation</a>
   ```
   or embed in an `<iframe>`:
   ```html
   <iframe src="/emi2026/index.html" width="1280" height="720"
           style="border:none;"></iframe>
   ```
3. Works offline and behind any static host.

---

## Directory Structure

```
presentation_emi_2026/
  index.html                  # Built artifact — open this to present
  build.py                    # Regenerates index.html from slides/
  css/
    theme.css                 # Design system + CSS variables
    reveal-overrides.css      # Reveal.js look tuned to theme
  js/
    deck.js                   # Reveal init + conference chrome
    components.js             # Shared interactive components (EMI.*)
  lib/reveal/                 # Vendored reveal.js (offline, no CDN)
  data/
    overlays.json             # FEM / NN time-series for overlay charts
    results.json              # NRMSE tables, speedup, headline numbers
  assets/                     # Figures exported from paper (PNG/SVG)
    thumbs/                   # Per-slide PNG thumbnails for overview grid
  slides/
    01_title.html             # 1  · Title
    02_problem.html           # 2  · Problem (portfolio-scale OpenSees cost)
    03_gap.html               # 3  · Gap (single-building surrogates don't transfer)
    04_keyidea.html           # 4  · Key idea (one trained model, any building)
    05_architecture.html      # 5  · Architecture (Transformer-HyperNetwork pipeline)
    06_interpolation.html     # 6  · Height-normalized 20-point interpolation
    07_setup.html             # 7  · Setup (160 NYC buildings → 9,000-building grid)
    08_accuracy.html          # 8  · Accuracy (NRMSE 0.017 on 16 held-out buildings)
    09_scale.html             # 9  · Scale + generalization (<1% on 900 held-out)
    10_speedup.html           # 10 · Speedup ~7,000×
    11_diagnostic.html        # 11 · Diagnostic tool (FEM vs surrogate overlay)
    12_curriculum.html        # 12 · Load-class NRMSE (honest impulse limitation)
    13_limitations.html       # 13 · Future directions
    14_takeaways.html         # 14 · Takeaways + contact
    15_thankyou.html          # 15 · Thank you
  backup/
    EMI2026_hypernetwork.pdf  # Backup PDF (3.76 MB, 28 pages)
  README.md                   # This file
```

---

## Interactive Components

| Component | Slides | Description |
|-----------|--------|-------------|
| `EMI.overlay` | 8, 11 | FEM (blue) vs surrogate (orange) time-series; load-class buttons |
| `EMI.bars` | 12 | Animated bar chart of NRMSE by load class (log scale) |
| `EMI.architecture` | 5 | SVG data-flow animation staged by fragments |
| `EMI.speedup` | 10 | Proportional ~7,000× speedup visualisation |
| `EMI.counter` | 2, 9 | Count-up number animation on slide-in |
| `EMI.slideGrid` | all | Grid (slide-sorter) overview overlay — `O` / button opens; click a thumbnail to jump |
