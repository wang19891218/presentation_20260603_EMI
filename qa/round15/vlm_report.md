# VLM Visual QA — Round 15 (Slides 07 & 08 reframe + figure_006 fix)

**Date:** 2026-06-01  
**HEAD:** 044a44d (slides 07 & 08 reframed for accuracy; figure_006 = 85-building map)  
**Trigger:** Slide 07 reframed (new headline, 85-building map, 3 updated chips);
slide 08 reframed (eyebrow + headline updated to "16 held-out test cases").

**Build:** `python3 build.py` → **16 slide file(s)**, mimo.json inlined ✅  
**Method:** Playwright headless 1280×720 full renders, all 16 slides  
**Critical definition:** Content clipped/overlapping/illegible.

---

## REMAINING CRITICALS: 0

## PDF pages: 29

*(Reveal.js ?print-pdf, fragment steps each become a PDF page; all 16 slides present)*

---

## Slide-07 Reframe Check

| Element | Expected | Status |
|---------|----------|--------|
| Headline | "Times Square-calibrated benchmark — scaled to 9,000." | ✅ present, 2 lines, no clip |
| Map | 85-building map, teal/blue colorbar matching map height | ✅ colorbar top/bottom aligned |
| Caption | "85 real buildings near Times Square (OpenStreetMap, 50–123 m)…" | ✅ readable |
| Chip 1 | "160 synthetic cases · 128/16/16 split" | ✅ readable |
| Chip 2 | "80 configs × 2 wind realizations" | ✅ readable |
| Chip 3 | "60 s wind records" | ✅ readable |
| Center legend | F/x/k₀/F_y/δ_y/γ/γk₀ all with subscripts | ✅ readable |
| Right legend | H/W/D/ζ/ρ/N_s/f all with subscripts | ✅ readable |
| 3-column layout | All columns fit 16:9 frame | ✅ no clip |
| Slide counter | "7 / 16" | ✅ correct |

## Slide-08 Reframe Check

| Element | Expected | Status |
|---------|----------|--------|
| Eyebrow | "160-CASE TIMES SQUARE BENCHMARK" | ✅ present |
| Headline | "NRMSE 0.017 on 16 held-out test cases." | ✅ clean, no clip |
| Card sub-text | "16 held-out test cases" / "160 synthetic cases…" | ✅ readable |
| Detail text | "80 configs × 2 wind realizations. No test-case simulation in training." | ✅ readable |
| Overlay chart | FEM (blue) vs Neural network (orange) traces | ✅ clear |
| Slide counter | "8 / 16" | ✅ correct |

---

## Per-Slide Status (all 16 clean)

| # | Topic | Rendering | Note |
|---|---|---|---|
| 01 | Title | ✅ clean | "1 / 16" ✅ |
| 02 | Problem | ✅ clean | Hero image + cost stats |
| 03 | Gap (native SVG) | ✅ clean | One-vs-many diagram |
| 04 | Key idea | ✅ clean | Architecture figure |
| 05 | Architecture | ✅ clean | Pipeline clear |
| 06 | Interpolation | ✅ clean | Bar chart clear |
| 07 | Setup *(reframed)* | ✅ clean | **New headline; 85-building map; 3 chips; both legends; fits** |
| 08 | Accuracy *(reframed)* | ✅ clean | **"16 held-out test cases" reads cleanly** |
| 09 | Scale | ✅ clean | 0.98%/0.89% cards; 9,000 count |
| 10 | Speedup | ✅ clean | ~7,000× dominant |
| 11 | Diagnostic | ✅ clean | Full-width overlay |
| 12 | MIMO | ✅ clean | Full-width panels; "12 / 16" ✅ |
| 13 | Load-class | ✅ clean | Honest impulse limit |
| 14 | Future directions | ✅ clean | Forward-looking bullets |
| 15 | Takeaways | ✅ clean | Strong close |
| 16 | Thank-you | ✅ clean | "16 / 16" ✅ |

---

## Assets Updated

- `qa/round15/slide_01..16.png` — 16 fresh renders
- `assets/thumbs/slide_01..16.png` — refreshed from round15
- `backup/EMI2026_hypernetwork.pdf` — 3.9 MB, 29 print pages
