# VLM Visual QA — Round 3 (Definitive Render)

**Date:** 2026-05-31  
**HEAD:** 4e38e93 (round-4 polish slides 12+13)  
**Method:** Playwright headless 1280×720, all fragments expanded → `codex exec -i` (gpt-5.5)  
**Scope:** Per-slide (a) rendering defects + (b) design/content, plus holistic 14-slide verdict.

---

## REMAINING CRITICALS: 3

| Slide | Element | Status |
|---|---|---|
| **03** | Bottom body sentence clipped by footer area | 🔴 Still present |
| **12** | Red caption sentence overflows off right edge of 16:9 frame | 🔴 NEW — introduced by round-4 polish |
| **14** | "Next:" bullet clipped at bottom / footer collision | 🔴 Still present |

**Holistic verdict: NOT ready for final PDF. Slides 03 and 14 confirmed by holistic pass. Slide 12 right-edge overflow confirmed per-slide only.**

---

## Round-2 Criticals — Resolution Status

| Issue | Status |
|---|---|
| Slide 04: "trained." body text clipped at footer | ✅ **RESOLVED** — clean, punchline + framed figure |
| Slide 10: OpenSees "~80 s" bar label clipped right edge | ✅ **RESOLVED** — no clip, chart fits frame |
| Slide 11: third bullet clipped at bottom | ✅ **RESOLVED** — clean |
| Slide 08: "16 unseen" vs "160-building" label ambiguity | ✅ **RESOLVED** — reads "16 held-out test buildings" unambiguously |
| Slide 07: right figures too small / illegible | ✅ **RESOLVED** — three-column layout, clean |
| Slide 03: diagram too small | 🟡 Improved but still needs attention |
| Slide 09: RMSE vs NRMSE confusion | ✅ **RESOLVED** — duration card clarified |

---

## Per-Slide Results

### Slide 01 — Title ✅ CLEAN
**(a)** clean  
**(b)** 3-sec message clear. "One model / any building / no retraining" not visible on the title slide — a short subtitle/tagline would surface the core novelty immediately.

---

### Slide 02 — Problem ✅ CLEAN
**(a)** clean  
**(b)** 3-sec message obvious. `9,000` could be labeled "buildings in portfolio" to avoid a brief pause. Caption under right image is small/low-contrast but acceptable.

---

### Slide 03 — Gap 🔴
**(a)** **Bottom body sentence clipped** by footer/progress bar area. Slide number pill overlaps footer/progress zone. Nav arrows intrude at bottom-right. Body paragraph oversized for available vertical space.  
**(b)** Message clear. Diagram communicates contrast well but labels inside panels too small to read at talk distance. Bottom takeaway needs to be shortened or moved higher to land above the footer safe zone.

---

### Slide 04 — Key Idea ✅ CLEAN *(R2 critical resolved)*
**(a)** clean  
**(b)** 3-sec message obvious: building features generate response-network weights, one trained model for any building. Central figure slightly small but framed appropriately. Punchline lands well.

---

### Slide 05 — Architecture ✅ CLEAN
**(a)** clean  
**(b)** 3-sec message clear. Step 4 ("Generated weights") correctly emphasized. Step 5 label "Conditional LSTM" may confuse non-ML audience — "Generated response model" would be clearer. Wind-load arrow slightly secondary visually.

---

### Slide 06 — Interpolation
**(a)** Footer/progress area crowded — cosmetic. Nav arrows intrude — cosmetic. No clipping.  
**(b)** 3-sec message obvious. Red "Zero-padding" callout conflicts with final-results-only intent. "Interpolate" label is low-salience — make the transformation label more prominent.

---

### Slide 07 — Setup ✅ CLEAN *(R2 critical resolved)*
**(a)** clean  
**(b)** 3-sec message clear. Three-column layout is legible. "Scaled to 9,000" slightly ambiguous — "expanded to a 9,000-building feature grid" is crisper. Feature-grid panel visually dense; a small "7-factor synthetic portfolio" label would help.

---

### Slide 08 — Accuracy *(R2 content issue resolved)*
**(a)** Footer/progress cosmetic. Nav arrows cosmetic. Chart caption near right edge but inside frame. No clipping.  
**(b)** 3-sec message clear: NRMSE 0.017 on 16 held-out test buildings reads unambiguously. "5× improvement" claim not visible on slide — add compact comparison cue. Legend inconsistency: chart says "Neural network," footer says "HyperNetwork" — harmonize to one term.

---

### Slide 09 — Scale ✅ CLEAN *(R2 content issue resolved)*
**(a)** clean  
**(b)** 3-sec message obvious. Strong final-results-only slide. Slightly number-heavy; `0.98%`/`0.89%` should be visually dominant over `9,000` training context.

---

### Slide 10 — Speedup ✅ *(R2 bar-label clip resolved)*
**(a)** Footer/progress cosmetic. Nav arrows near lower-right card — cosmetic. No clipping or overflow.  
**(b)** 3-sec message obvious: ~7,000× faster. Right card "≈20 h → seconds" is less concrete than "~11 ms/building" — consider tightening. Bottom cards slightly redundant with central stat.

---

### Slide 11 — Diagnostic ✅ CLEAN *(R2 bullet clip resolved)*
**(a)** clean  
**(b)** 3-sec message clear. "Wind/Constant/Sine/Impulse" tabs need a brief "load cases:" label for room clarity. Add one stronger on-slide takeaway: "overlay matches live FEM across load classes."

---

### Slide 12 — Load-Class NRMSE 🔴 *(NEW defect)*
**(a)** **Red caption sentence overflows off the right edge of the 16:9 frame.** "Current limit 54.2%" label sits very close to top of plot. Footer/progress cosmetic. Nav arrows cosmetic.  
**(b)** 3-sec message mostly obvious. Shorten red caption to fit: "Impulse remains the limit: 54.2% NRMSE." "Click to reveal each load class" inappropriate for a final-results slide.

---

### Slide 13 — Future Directions ✅ CLEAN
**(a)** clean  
**(b)** 3-sec message clear. Text-heavy for a closing slide — shorten each bullet to one line. Consider labeling: "Near term / Training / Representation" for sharper hierarchy.

---

### Slide 14 — Takeaways 🔴
**(a)** **"Next:" bullet clipped** at bottom — "3D / and BIM-driven building features" runs below the 16:9 frame. Footer text collides with final bullet. Progress bar collides with clipped area. Nav arrow intrudes at bottom-right.  
**(b)** 3-sec message mostly clear. Remove or drastically shorten the "Next:" bullet — future work belongs on slide 13. Contact card slightly heavy for a closing slide.

---

## Holistic Assessment

**(A) Hard failures confirmed by holistic pass:** Slides 03 and 14 (body and bullet clipped). Slide 12 right-edge overflow per-slide only (holistic did not flag; per-slide is more precise here).

**(B) Top remaining issues deck-wide:**
1. Bottom safe zone still violated on slides 03 and 14.
2. Some technical figures small for room projection (slides 03, 04, 12) — not a blocking defect, informational only.
3. Slide 14 overloaded for a closing slide — "Next:" bullet competes with the main takeaway and causes the clip.

**(C) PDF-ready verdict:** **No** — slides 03, 12, and 14 have real clipping that would appear in the PDF export.

---

## What To Fix (terse)

| Slide | Fix |
|---|---|
| **03** | Shorten body text OR reduce font size to clear footer by 60 px |
| **12** | Shorten red caption under chart to fit within frame (≤ available width) |
| **14** | Remove or shrink "Next:" bullet so all content clears footer safe zone |
