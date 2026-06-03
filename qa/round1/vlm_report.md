# VLM Visual QA — Round 1

**Date:** 2026-05-31  
**Method:** Playwright headless screenshots (1280×720, all fragments expanded) → `codex exec -i` (gpt-5.5)  
**Status of slides 02–05:** Provisional — new artwork pending for slides 02/03/05

---

## Systemic Issues (appear on nearly every slide)

1. **Footer text clipped / overlapped by progress bar** — the deck footer (bottom-left) and the reveal progress bar sit at the same vertical position and collide. Affects slides 02, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14.
2. **Slide content overflows bottom of 16:9 frame** — multiple slides have content below y=720px, cut by the reveal chrome. Root cause: slides are taller than the 720-unit reveal canvas or use viewport-relative units instead of slide-relative. Affects slides 02, 05, 07, 10, 11, 12, 13, 14.
3. **Navigation chevrons intrude into slide content** — reveal's edge-controls arrows (left/right) overlap slide content, especially tables and charts. Affects slides 06, 09, 10, 13.
4. **Footer/page-number overlay overlaps lower content** — the `c/t` slide number pill sits inside the slide frame and competes with lower content. Affects slides 06, 07, 09, 11.
5. **Low-contrast secondary text everywhere** — `--ink-mute` gray captions, footer, chart labels, and card descriptors are all flagged as hard to read. Cross-deck issue.

---

## Per-Slide Punch-List

### Slide 01 — Title
- Title text is oversized, fills most of slide height, leaves excessive blank space below.
- Footer text bottom-left: very low contrast against white.
- Footer/controls at bottom edge: visually cramped.

### Slide 02 — Problem  _(provisional — hero image changing)_
- **OVERFLOW:** Last line of bottom body paragraph ("is impractical at portfolio scale.") clipped off bottom.
- Navigation overlay at bottom overlaps the clipped paragraph text.
- Image caption under plot: low contrast light-gray monospace on white.

### Slide 03 — Gap  _(provisional — diagram changing)_
- "VS" separator between images: pale gray, very low contrast on white.
- Footer text bottom-left: very small and low contrast.
- Right plot's "HyperNet" label: cramped at top-right edge, partially clipped/overlapping nearby text.

### Slide 04 — Key Idea
- Small gray descriptor text inside the four diagram cards: hard to read against pale backgrounds.
- Footer text "Generating Surrogates…": very faint against white.
- Slide number pill: small and faint.

### Slide 05 — Architecture  _(provisional — wind-load input being added)_
- **OVERFLOW/CLIP:** Bottom orange footer text ("Weights generated, not stored") clipped — only the top of the line is visible.
- Progress bar at bottom overlaps/covers the slide footer area.
- Gray subtitles inside the six architecture boxes: low contrast.
- Center caption under diagram: low contrast against white.

### Slide 06 — Interpolation
- **OVERLAP:** Footer/caption text clipped/obscured by the blue progress bar along the bottom edge.
- Footer overlaps with the red/green pill callouts (bottom of slide content).
- Slide counter `6 / 14` overlaps the footer/caption area.
- Left/right navigation chevrons intrude into the slide frame near the subtitle.

### Slide 07 — Setup
- **OVERFLOW:** Bottom metrics row ("height range (m)") cut off at bottom.
- Large blue "50-130" metric: vertically crowded, "130" nearly overlaps footer.
- Footer text overlaps with slide control icon, partially obscured.
- Pagination pill overlaps slide content/footer.
- Right-side figure captions: low contrast gray.
- Bottom-right caption text too close to footer, visually crowded.

### Slide 08 — Accuracy
- Footer caption bottom-left: very low contrast against white.
- Chart axis labels and tick labels: too light/small (especially `time (s)` and y-axis values).
- Right carousel arrow: very close to slide edge, visually crowded.

### Slide 09 — Scale / Generalization
- **OVERLAP:** Right nav chevron overlaps highlighted `9K - INTERP` table column at right edge.
- Left nav chevron protrudes into slide content beside the table.
- Footer text: very low contrast against white.
- Progress/navigation UI overlaps slide footer area.

### Slide 10 — Speedup
- **OVERFLOW/CLIP:** Entire bottom metric row clipped — "80 s", "7,000×", "≈ 20 h", "seconds" cut by bottom edge.
- Footer/progress UI overlaps the bottom content.
- Right nav arrow overlaps the OpenSees FEM bar area.
- Title is very large and wraps awkwardly, leaving excessive empty vertical space while lower content is clipped.

### Slide 11 — Diagnostic
- **OVERFLOW:** Left bullet list overflows bottom; "baseline fails on" cut by slide edge/progress bar.
- Footer text overlaps lower bullet content.
- Progress UI covers/obscures lower-left text.
- Slide number control overlaps content area.
- Chart caption: very low contrast light gray.

### Slide 12 — Curriculum (v1→v2→v3)
- **OVERFLOW/CLIP:** Left "WHAT CHANGED" card extends below 16:9 frame; "Per-class loss weighting" bullet clipped at bottom.
- Footer text overlaps clipped left card content.
- Chart axis labels and caption: very low contrast light gray (y-axis, caption under chart).
- Chart text undersized: bar labels, legend, axis ticks hard to read at presentation distance.

### Slide 13 — Limitations
- **OVERFLOW:** Left residual card body text overflows/clips off bottom of slide; last lines cut by footer/progress bar.
- Footer text partially clipped/obscured by blue progress bar and controls.
- Right nav chevron overlaps right card near mid-right edge.
- Bottom-right slide counter overlaps footer/progress area.

### Slide 14 — Takeaways
- **OVERFLOW/CLIP:** Third bullet's final line ("GPU inference") cut by bottom edge.
- Bottom-right author/contact area clipped; lower blue text mostly off-frame.
- Footer text overlaps nav chrome, very low contrast.
- Main title oversized, forces lower content off the 16:9 frame.

---

## Severity Summary

| Issue | Severity | Slides |
|-------|----------|--------|
| Content overflow / bottom-clip | 🔴 Critical | 02, 05, 07, 10, 11, 12, 13, 14 |
| Nav chevrons overlapping content | 🟠 High | 06, 09, 10, 13 |
| Footer ↔ progress-bar collision | 🟠 High | all slides |
| Oversized title pushing content off-frame | 🟠 High | 01, 10, 14 |
| Low-contrast secondary text | 🟡 Medium | all slides |
| Chart labels too small / low contrast | 🟡 Medium | 08, 12 |

---

## Recommended Root-Cause Fixes (diagnosis only — no changes made)

1. **Global bottom padding:** Add `padding-bottom: 60–80px` to `.reveal .slides section` (or shrink the deck's inner content max-height) so no content touches the bottom chrome band.
2. **Footer z-order / placement:** Move `deck-footer` above the progress bar or add enough bottom margin so the two don't collide.
3. **Hide nav controls OR push them outside the frame:** Set `controlsLayout: "bottom-right"` or increase `margin` in Reveal config so edge arrows don't intrude on content.
4. **Title font-size cap:** Add `max-font-size` or a smaller `em` value for `h2.slide-title` on content-heavy slides; the current size is too large when there is substantial body content below.
5. **Chart labels:** Increase canvas font sizes in `EMI.bars` and `EMI.overlay` components — current sizes are below readable threshold at 1280×720.
