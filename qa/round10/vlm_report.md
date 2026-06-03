# VLM Visual QA — Round 10 (HTML sub/sup reset, legend subscripts)

**Date:** 2026-05-31  
**HEAD:** e8066b1 (.reveal sub/sup override — deck-wide HTML subscript fix)  
**Trigger:** CSS reset for `<sub>`/`<sup>` inside `.reveal` so HTML subscripts
render lowered deck-wide (including slide 07 legend k₀/F_y/δ_y/γk₀).

**Build:** `python3 build.py` → 15 slide file(s), data inlined ✅  
**Method:** Playwright headless 1280×720 full renders + 3× DPR tight crop of the
legend `<div>` below the bilinear chart (DOM probe: CSS region 620,411 → 314×118 px)  
**Critical definition:** Content clipped/overlapping/illegible.

---

## REMAINING CRITICALS: 0

## Legend subscripts lowered: **YES**

**Evidence (`qa/round10/slide_07_legend_crop.png`, 3× DPR):**

DOM measurements confirm all `<sub>` elements are offset 7–8 CSS px below
their parent `<strong>` baseline. Rendered crop confirms visually:

| Legend text | Subscript | Lowered |
|-------------|-----------|---------|
| **k₀** initial (elastic) stiffness | "0" lowered below "k" | ✅ YES |
| **F_y** yield force | "y" lowered below "F" | ✅ YES |
| **δ_y** yield displacement | "y" lowered below "δ" | ✅ YES |
| **γk₀** post-yield stiffness | "0" lowered below "γk" | ✅ YES |

The legend no longer reads "k0/Fy/δy/γk0" inline — all four subscripts
are visibly lowered at reduced size. Fix confirmed deck-wide.

---

## Per-Slide Status (all 15 clean)

| # | Topic | Rendering | Note |
|---|---|---|---|
| 01 | Title | ✅ clean | Strong hierarchy |
| 02 | Problem | ✅ clean | Hero image + cost stats |
| 03 | Gap (native SVG) | ✅ clean | One-vs-many diagram clear |
| 04 | Key idea | ✅ clean | Architecture figure fits |
| 05 | Architecture | ✅ clean | Pipeline + wind-load input |
| 06 | Interpolation | ✅ clean | Bar chart clear |
| 07 | Setup *(legend subscripts fixed)* | ✅ clean | **Legend k₀/F_y/δ_y/γk₀ properly lowered** |
| 08 | Accuracy | ✅ clean | NRMSE 0.017 + overlay |
| 09 | Scale | ✅ clean | 0.98%/0.89% cards |
| 10 | Speedup | ✅ clean | ~7,000× dominant |
| 11 | Diagnostic | ✅ clean | Full-width overlay |
| 12 | Load-class | ✅ clean | Honest impulse limit |
| 13 | Future directions | ✅ clean | Forward-looking bullets |
| 14 | Takeaways | ✅ clean | Strong close |
| 15 | Thank-you | ✅ clean | Centered; contact info |

---

## Assets Updated

- `qa/round10/slide_01..15.png` — fresh 1280×720 renders
- `qa/round10/slide_07_legend_crop.png` — 3× DPR legend-region crop confirming subscripts
- `assets/thumbs/slide_01..15.png` — overview grid refreshed from round10
- `backup/EMI2026_hypernetwork.pdf` — refreshed via Playwright print-pdf
