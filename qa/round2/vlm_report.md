# VLM Visual QA — Round 2 (Final)

**Date:** 2026-05-31  
**HEAD:** 532a60b (wire slides 02/03/04 to new generated visuals)  
**Method:** Playwright headless 1280×720, all fragments expanded → `codex exec -i` (gpt-5.5)  
**Scope:** Per-slide rendering defects + design/content suggestions, plus one holistic 14-slide pass.

---

## Round-1 → Round-2 Delta

| Issue (Round 1) | Round 1 | Round 2 |
|---|---|---|
| Content overflow / bottom-clip | 🔴 8 slides | 🟡 2 remain (10 bar label, 11 bullet) |
| Footer ↔ progress-bar collision | 🔴 all slides | 🟡 cosmetic only — no content lost |
| Nav chevrons overlapping content | 🟠 4 slides | 🟡 cosmetic intrusion, no content blocked |
| Oversized title pushing content off-frame | 🔴 3 slides | 🟢 resolved |
| Low-contrast secondary text | 🟡 all | 🟡 persists (cosmetic) |
| **Slides with no rendering defects** | 2/14 | 6/14 (02, 07, 09 clean; 01, 13, 14 near-clean) |

**Overall: major structural overflows resolved. Two critical clips remain (slides 10, 11).**

---

## Per-Slide Results

### Slide 01 — Title
**(a) Rendering defects:**
- Title very large, dominates slide, leaves blank lower half — fits frame, not clipped.
- Footer text: low contrast, small — cosmetic.
- Progress pill slightly misaligned with footer baseline — cosmetic.
- Nav arrow close to frame edge — cosmetic.

**(b) Design/content:**
- Add a short subtitle/tagline under author line: "without per-building retraining" is the core claim but invisible on the title slide.
- Lower half is empty — add one visual cue: portfolio of buildings → HyperNetwork → response histories.
- Title could be tighter: "Transformer-HyperNetwork Surrogates for Regional Wind-Induced Structural Response."

---

### Slide 02 — Problem ✅ CLEAN
**(a) Rendering defects:** clean

**(b) Design/content:**
- "9,000 buildings in a regional portfolio" vs "simulate 900 test buildings" — label the 900 explicitly as "sampled from 9,000."
- Right-side image is attractive but generic; a stronger cue would be: portfolio grid → OpenSees runs → wall-clock bottleneck.
- Body text can tighten: "One nonlinear time-history analysis per building per hazard makes direct simulation impractical at portfolio scale."

---

### Slide 03 — Gap
**(a) Rendering defects:**
- Footer ↔ progress bar: visual collision at bottom — cosmetic, no content lost.
- Footer cramped near frame edge — cosmetic.
- Nav arrows: large, high-contrast, pull attention — cosmetic intrusion.
- **Central diagram too small:** labels barely legible at presentation distance.
- Large vertical whitespace imbalance: title/body left-heavy, graphic floats small in middle.
- Body text line length long and low on slide, near footer zone.

**(b) Design/content:**
- Diagram must be enlarged 1.5–2×; without it, the "transfer gap" argument relies only on text.
- Replace "Conventional surrogates" with "Single-building surrogates" for sharper technical meaning.
- Tighten body: "Different height, stiffness, damping, and mass break transfer. A portfolio needs one model that adapts."
- Map the four parameters visually as tags between buildings in the diagram.

---

### Slide 04 — Key Idea
**(a) Rendering defects:**
- **Bottom body text clipped:** "trained." partially hidden behind footer/progress bar at bottom-left. 🔴
- Footer overlaps visually with clipped body text — insufficient clearance.
- Nav arrows intrude into slide safe area at bottom-right.
- Diagram labels very small — near readability limit.
- Headline close to right edge (fits, but feels heavy for available width).

**(b) Design/content:**
- Body copy too long and wraps awkwardly — reduce to one crisp sentence: "One forward pass creates a building-specific predictor: no retraining, no new simulation."
- Diagram needs stronger hierarchy: highlight feature vector and generated weights, mute secondary boxes.
- Sharpen the headline: "Turn building parameters into a custom wind-response predictor."
- Holistic note: slide 04 overlaps conceptually with slide 05 — differentiate by making 04 purely the conceptual punchline.

---

### Slide 05 — Architecture
**(a) Rendering defects:**
- Footer/progress area cramped: progress bar + slide number pill very close together — cosmetic.
- Nav arrows intrude into footer zone — cosmetic.
- Step 6 near right edge — not clipped.
- Caption text under wind-load icon: small and low contrast.
- Orange "Weights generated, not stored" pill: close to footer, lower-left feels crowded.

**(b) Design/content:**
- Step 4 is the key novelty — label it explicitly: "HyperNetwork generates LSTM weights."
- "Conditional LSTM" ambiguous to structural engineers — rename "Building-specific LSTM" or "Generated LSTM response model."
- Wind-load input is conceptually important but visually secondary — label it "Input 2" or align it more directly with step 5.

---

### Slide 06 — Interpolation
**(a) Rendering defects:**
- Footer text very small, low contrast — cosmetic.
- Slide counter `6/14` low contrast, close to bottom chrome — cosmetic.
- Nav arrows intrude into slide frame area — cosmetic.
- Progress bar touches frame edge — cosmetic.
- Caption line under badges: too small / low contrast for conference room.
- Main diagram sits slightly low; badges/caption near footer zone.

**(b) Design/content:**
- "all 20 outputs active" is the punchline — make it visually dominant, not just a green badge.
- "interpolate" label above arrow is too subtle — relabel as "height-normalize + interpolate."
- Red zero-padding badge introduces a comparison feel in a "final-results-only" deck — reframe as "No inactive output slots."

---

### Slide 07 — Setup ✅ (near-clean)
**(a) Rendering defects:**
- Footer progress bar flush at bottom edge — cosmetic.
- Footer text very small / low contrast — cosmetic.
- Nav arrows intrude — cosmetic.
- **Map panel has excessive empty whitespace** around the plot.
- Right-side plot cards have large whitespace; figures too small to inspect.
- Right-column captions: low contrast, small.
- Badge row wraps awkwardly into three lines — visual clutter.
- Title is very large, makes evidence plots visually secondary.

**(b) Design/content:**
- Sharpen the 3-second message: "160 real NYC buildings expanded to a 9,000-case structural-response grid."
- Enlarge the map and right-side plots, or simplify to one visual pipeline: real portfolio → parameter grid → wind records.
- Consolidate badges into one compact metadata strip — setup should read as a designed experimental matrix, not a list.

---

### Slide 08 — Accuracy
**(a) Rendering defects:**
- Footer progress bar: visual collision with bottom nav/footer area — cosmetic.
- Right nav arrow intrudes into lower-right content zone — cosmetic.
- Chart legend/caption row crowded: `FEM`, `HyperNetwork`, and building description run together.
- Y-axis labels: low contrast, small; scientific notation hard to parse quickly.
- Metric card and chart not vertically aligned — card top starts lower than chart tabs.

**(b) Design/content:**
- **Content issue:** card says "16 unseen buildings," header says "160-building unseen-building test" — reconcile; the population result is 900 held-out buildings. 🟠
- Connect headline to the 5× claim: "5× lower error: NRMSE 0.017 on held-out buildings."
- Add a callout on the chart: "predicted response tracks FEM over 60 s."
- Replace "HyperNetwork — unseen-building test" with "No retraining on test buildings."

---

### Slide 09 — Scale / Generalization ✅ CLEAN
**(a) Rendering defects:** clean

**(b) Design/content:**
- Label the split explicitly: "9,000 train / 900 test buildings."
- "RMSE = 0.040" beside "<1% NRMSE" switches metric units without context — clarify or remove.
- Height card: add "held-out" qualifier — "Held-out NRMSE by height."

---

### Slide 10 — Speedup
**(a) Rendering defects:**
- **🔴 Top benchmark bar label clipped off right edge** (`~80...` cut off). Key timing number invisible.
- Overall chart slightly too wide — content pushes into right edge.
- Footer/progress bar: runs along bottom edge, visual collision — cosmetic.
- Nav arrows intrude near lower comparison card — cosmetic.
- Bottom cards: slightly crowded vertically relative to footer.
- Gray text inside benchmark rows and card subtitles: too light for projected conference viewing.

**(b) Design/content:**
- Clarify comparison: "80 s per building, single CPU core" vs "11.4 ms per building, batched GPU inference" — should be legible without relying on small chart labels.
- Right card: make portfolio implication explicit — "900-building portfolio: ≈20 h → seconds."
- Make benchmark chart less dominant and takeaway cards more primary.

---

### Slide 11 — Diagnostic
**(a) Rendering defects:**
- **🔴 Third left-panel bullet clipped** at bottom of 16:9 frame.
- Footer collides with content/progress area — cosmetic.
- Nav arrows occupy lower-right corner — cosmetic intrusion.
- Chart/text layout imbalance: left text oversized and tall, unused whitespace under chart.
- Chart caption: low contrast, hard to read at room distance.
- "Play" button visually detached from controls.

**(b) Design/content:**
- Fix the clip: shorten the third bullet or reduce font size.
- Make title more explicit: "Overlay tool exposes when surrogate leaves FEM agreement."
- Cut to 2 concise bullets — left-column density too high vs the plot.
- Add a callout or annotation showing divergence so the diagnostic value is obvious (current overlay looks too perfect for an OOD-failure story).

---

### Slide 12 — Load-Class NRMSE
**(a) Rendering defects:**
- Footer/progress bar: visual collision at bottom — cosmetic.
- Nav arrows close to content frame edge — cosmetic.
- Chart y-axis labels and tick labels: light gray, small — legibility concern.
- Chart text slightly soft/compressed vs crisp title text.
- Large unused lower-middle whitespace.

**(b) Design/content:**
- Frame the impulse result explicitly: "Impulse remains out of scope / current limitation."
- Remove or rephrase "Click to reveal each load class" — sounds like presenter mechanics.
- Add axis label: "Population mean NRMSE by load class, log scale."
- Add interpretive sentence: "Surrogate accurate for wind and smooth periodic loads; sharp impulse is the unresolved case."

---

### Slide 13 — Limitations + Future
**(a) Rendering defects:**
- Footer/progress: bar touches/overlaps footer area — cosmetic.
- Nav arrows intrude — cosmetic.
- Text density high: bullets 2 and 3 are long — heavy reading for 15-minute talk.
- Footer title and slide number very small / low contrast.

**(b) Design/content:**
- Title says "Future directions" but slide is meant to cover "Limitations + future work" — add clearer framing: "Current limits and next steps."
- Group into Near-term / Longer-term or Data / Physics / Geometry.
- Cut to 3 future directions; make one "next priority" visually dominant.
- Add one closing line: "The next step is improving generalization beyond the current portfolio and excitation envelope."

---

### Slide 14 — Takeaways ✅ (near-clean)
**(a) Rendering defects:**
- Footer/progress: bar overlaps slide footer area — cosmetic.
- Right nav chevron visible inside frame near bottom-right — cosmetic.
- Footer text and icon too close to frame edge — cosmetic.
- Contact card alignment: top starts slightly low relative to headline/content block.
- `7,000×` and `0.89%` stat text is large; not clipped but may overpower the headline.

**(b) Design/content:**
- Tighten: "Cross-building generalization" → "One trained model generalizes across buildings."
- Clarify speed metric: add "OpenSees: 80 s/building (CPU)" to make the baseline explicit.
- Contact card: consider adding a QR code or paper link; email alone is less actionable for conference follow-up.

---

## Holistic Assessment (All 14 Slides)

### A. Narrative Flow
The arc is logical and mostly complete: cost → transfer gap → key idea → implementation → evidence → limitations → takeaway.

**Issues:**
- **Slides 04 and 05 overlap:** both explain "generate weights from building features." 04 is conceptual, 05 is architectural, but the boundary is not sharp. Fix: 04 = simple punchline only; 05 = the exact pipeline.
- **Missing beat:** a brief "what exactly is predicted?" moment before results. The audience needs: "wind-load time series + building features → per-floor displacement response over time."
- **Slide 06 out of flow:** interpolation detail before the audience knows the dataset (slide 07). Consider moving 06 after 07, or framing it explicitly as "the key trick for variable building height."
- **Slide 11 disrupts results arc:** after the speedup, the diagnostic slide slightly interrupts the flow. Better position: before slide 08 ("how we evaluate") or after slide 12 ("not just aggregate metrics").

### B. Visual Consistency
Strong overall design language: large bold titles, blue section labels, white background, consistent footer/progress, green for good metrics, orange for model elements, red for limitations.

**Inconsistencies:**
- Slide 03 diagram is too small and visually weaker than every other slide.
- Slide 04 uses a dense imported figure that feels lower-resolution and less integrated than slide 05's native pipeline.
- Slide 07 has three visual regions at different scales and styles — less polished than the metric slides.
- Slide 11 bullets are too large and wrap awkwardly near the footer.
- Slides 06, 07, 10 approaching "too many badges" — pill overload dilutes impact.
- **Strongest slides:** 08, 09, 10, 14 — visual hierarchy is very clear.

### C. Pacing (15 minutes = ~64 seconds/slide)
**Too dense:**
- 04: title + full architecture + paragraph — needs ~90 s.
- 07: too many small plots/details for a conference talk.
- 11: long bullets compete with the plot.
- 13: four long future directions reads like a paper conclusion.

**Too sparse / underused:**
- 01: visually empty lower half.
- 03: central graphic too small to carry the gap argument.
- 12: honest-limit concept deserves sharper framing.

### D. Top 3 Priorities
1. **Differentiate slides 04 and 05.** Make 04 the conceptual punchline only ("features generate weights; wind drives response"). Make 05 the exact architecture. Remove duplicated language between them.
2. **Upgrade the three weakest visuals: slides 03, 04, and 07.** Enlarge slide 03's comparison diagram. Redraw slide 04 in the deck's native style (current imported figure is lower-resolution and less integrated). Simplify slide 07 to one main dataset visual + 3–4 key facts.
3. **Tighten late-deck pacing (slides 11–13).** Slide 11: 2 concise bullets + fix clip. Slide 12: label impulse as "current limitation" explicitly. Slide 13: cut to 3 directions, one dominant.

---

## Severity Summary — Round 2

| Issue | Severity | Slides |
|---|---|---|
| Bar label clipped off right edge | 🔴 Critical | 10 |
| Bullet clipped off bottom | 🔴 Critical | 11 |
| Body text clipped at bottom | 🔴 Critical | 04 |
| Content label mismatch (16 vs 160 vs 900) | 🟠 Content | 08 |
| Footer/progress bar (cosmetic, no content lost) | 🟡 Low | most slides |
| Nav arrows in footer zone (cosmetic) | 🟡 Low | most slides |
| Low-contrast annotations / chart labels | 🟡 Low | 06, 08, 10, 12 |
| Central diagram too small to read | 🟡 Design | 03 |
| Imported figure mismatched quality | 🟡 Design | 04 |
| Badge/pill overload | 🟡 Design | 06, 07, 10 |
| Slides 04/05 conceptual overlap | 🟡 Narrative | 04, 05 |
| Slide ordering (06 before 07, 11 after 10) | 🟡 Narrative | 06, 11 |
