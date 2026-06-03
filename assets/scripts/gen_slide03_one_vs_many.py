"""
gen_slide03_one_vs_many.py
Generates assets/slide03_one_vs_many.svg and .png

Concept diagram contrasting:
  LEFT  — "One model per building" (blue)
  RIGHT — "One shared HyperNetwork" (orange)

Design targets (v3 — decisively larger):
  figsize  9.5 x 7.0 in  →  aspect 1.357  (closer to square)
  Fonts:
    panel headings / VS badge   36 pt
    title                       32 pt
    ✗ / ✓ callouts              27 pt
    model-box labels            24 pt
    column captions / labels    22 pt
  Tight margins (subplots_adjust 0.005) so diagram fills ~95% of canvas.
  Vertical layout pre-computed to guarantee no overlap at these sizes.

Palette (presentation_brief.md):
  primary  #0071e3  blue
  accent   #ff9f0a  orange
  ink      #1d1d1f
  muted    #6e6e73
  bg       #ffffff / bg-alt #f5f5f7

Run from project root:
  python3 presentation_emi_2026/assets/scripts/gen_slide03_one_vs_many.py
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import os

# ── Palette ────────────────────────────────────────────────────────────────────
PRIMARY = "#0071e3"
ACCENT  = "#ff9f0a"
INK     = "#1d1d1f"
MUTED   = "#6e6e73"
BG      = "#ffffff"
BG_ALT  = "#f5f5f7"
LINE    = "#d2d2d7"
RED     = "#ff3b30"
GREEN   = "#34c759"

# ── Font sizes (points) ────────────────────────────────────────────────────────
FS_TITLE    = 32   # top banner
FS_HEADING  = 36   # "Conventional approach" / "HyperNetwork approach"
FS_CALLOUT  = 27   # ✗ / ✓ lines
FS_BOX      = 24   # "Model N" / "Hyper\nNetwork\n(shared)"
FS_COL_LBL  = 22   # "N buildings", "N models" column labels
FS_CAPTION  = 20   # bottom caption box (2 lines)
FS_VS       = 36   # VS badge

# ── Canvas ─────────────────────────────────────────────────────────────────────
W, H = 9.5, 7.0       # inches  →  aspect 1.357
fig, ax = plt.subplots(figsize=(W, H), facecolor=BG)
ax.set_aspect("equal")
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.axis("off")
fig.subplots_adjust(left=0.005, right=0.995, top=0.995, bottom=0.005)

# Approximate single-line text height in figure-inches for a given pt size.
# At 150 dpi: 1 pt = 1/72 in of text height (good enough for gap planning).
def th(pts): return pts / 72.0

# ── Vertical layout  (all in figure-inches, y from bottom) ────────────────────
# Total height H = 7.0 in
# Reserve ~0.06 at top and bottom for tight margins.
#
# Title bar (above both panels):
Y_TITLE   = H - 0.20    # va="top" → text descends from here
# Panel heading centres (inside panels):
Y_HEAD    = H - 0.80    # 36 pt → half-height 0.25 → top 6.20 + 0.25 = 6.45, bottom 5.95
# ✗/✓ callout centres:
Y_CALL    = H - 1.60    # 27 pt → half 0.188 → top 5.40 + 0.188 = 5.588, bottom 5.213
#   gap head-bottom(5.95) to call-top(5.588) = 0.362 ✓
# Building / box row centres:
Y_ROWS    = [4.62, 3.22, 1.82]   # three rows, spacing 1.40 in
#   call-bottom(5.213) to row1-top(4.62+0.36=4.98): gap 0.233 ✓
#   row1-bot(4.62-0.36=4.26) to row2-top(3.22+0.39=3.61): gap 0.65 ✓
#   row2-bot(3.22-0.39=2.83) to row3-top(1.82+0.42=2.24): gap 0.59 ✓
# Column labels (below third building):
Y_COL_LBL = 1.12        # 22 pt → half 0.153 → top 1.273, bot 0.967
#   row3-bot(1.82-0.42=1.40) to col-lbl-top(1.273): gap 0.127 ✓
# Caption boxes:
Y_CAP     = 0.46        # 2-line 20 pt → approx half-height 0.39 → top 0.85, bot 0.07
#   col-lbl-bot(0.967) to cap-top(0.85): gap 0.117 ✓

# Panel divider x:
MID   = W / 2            # 4.75
LEFT_CX  = MID / 2       # 2.375
RIGHT_CX = MID + MID/2   # 7.125

# ── Helpers ────────────────────────────────────────────────────────────────────

def building_glyph(cx, cy, bw, bh, color):
    bx, by = cx - bw/2, cy - bh/2
    ax.add_patch(FancyBboxPatch(
        (bx, by), bw, bh, boxstyle="round,pad=0.025",
        linewidth=1.8, edgecolor=color, facecolor=BG_ALT, zorder=3))
    ww, wh = bw*0.20, bh*0.09
    for rx in [cx - bw*0.22, cx + bw*0.22]:
        for ry in [cy - bh*0.24, cy, cy + bh*0.24]:
            ax.add_patch(mpatches.Rectangle(
                (rx - ww/2, ry - wh/2), ww, wh,
                linewidth=0, facecolor=color, alpha=0.32, zorder=4))


def model_box(cx, cy, bw, bh, label, color, lw=2.0, fs=FS_BOX):
    bx, by = cx - bw/2, cy - bh/2
    ax.add_patch(FancyBboxPatch(
        (bx, by), bw, bh, boxstyle="round,pad=0.07",
        linewidth=lw, edgecolor=color, facecolor=color,
        alpha=0.14, zorder=3))
    ax.text(cx, cy, label, ha="center", va="center",
            fontsize=fs, color=color, fontweight="bold",
            fontfamily="DejaVu Sans", zorder=5, linespacing=1.25)


def arrow_to(x0, y0, x1, y1, color):
    ax.annotate("", xy=(x1, y1), xytext=(x0, y0),
                arrowprops=dict(arrowstyle="-|>", color=color,
                                lw=1.8, mutation_scale=18, alpha=0.72),
                zorder=4)


# ── Divider ────────────────────────────────────────────────────────────────────
ax.axvline(MID, color=LINE, lw=1.4, linestyle="--", alpha=0.7, zorder=2)

# ── Title ──────────────────────────────────────────────────────────────────────
ax.text(MID, Y_TITLE,
        "Scaling structural response prediction to a portfolio",
        ha="center", va="top",
        fontsize=FS_TITLE, color=INK, fontweight="bold",
        fontfamily="DejaVu Sans", zorder=5)

# ── Panel backgrounds ──────────────────────────────────────────────────────────
PAD = 0.13
for x0, x1 in [(PAD, MID - PAD), (MID + PAD, W - PAD)]:
    ax.add_patch(FancyBboxPatch(
        (x0, 0.13), x1 - x0, H - 0.62,
        boxstyle="round,pad=0.07",
        linewidth=1.0, edgecolor=LINE, facecolor=BG_ALT,
        alpha=0.55, zorder=1))

# ══════════════════════════════════════════════════════════════════════════════
# LEFT panel — Conventional: one model per building
# ══════════════════════════════════════════════════════════════════════════════

# Panel heading
ax.text(LEFT_CX, Y_HEAD, "Conventional",
        ha="center", va="center",
        fontsize=FS_HEADING, color=MUTED, fontweight="bold",
        fontfamily="DejaVu Sans", zorder=5)

# ✗ callout
ax.text(LEFT_CX, Y_CALL, "✗  one training run per building",
        ha="center", va="center",
        fontsize=FS_CALLOUT, color=RED, fontweight="bold",
        fontfamily="DejaVu Sans", zorder=5)

# Buildings + model boxes
BLDG_X  = 1.08     # x-centre of building column
NET_X   = 3.52     # x-centre of model-box column
NET_W   = 1.38     # model box width
NET_H   = 0.66     # model box height
BW      = 0.54     # building width

for i, y in enumerate(Y_ROWS):
    bh = 0.72 + i * 0.07          # buildings get taller lower in stack
    building_glyph(BLDG_X, y, BW, bh, PRIMARY)
    model_box(NET_X, y, NET_W, NET_H, f"Model {i+1}", PRIMARY)
    arrow_to(BLDG_X + BW/2, y, NET_X - NET_W/2, y, PRIMARY)

# Column labels
ax.text(BLDG_X, Y_COL_LBL, "N buildings",
        ha="center", va="center",
        fontsize=FS_COL_LBL, color=MUTED, fontfamily="DejaVu Sans", zorder=5)
ax.text(NET_X, Y_COL_LBL, "N models",
        ha="center", va="center",
        fontsize=FS_COL_LBL, color=MUTED, fontfamily="DejaVu Sans", zorder=5)

# Bottom caption
ax.text(LEFT_CX, Y_CAP,
        "N buildings  →  N trained models\nNo sharing across buildings",
        ha="center", va="center",
        fontsize=FS_CAPTION, color=PRIMARY,
        fontfamily="DejaVu Sans", linespacing=1.4, zorder=5,
        bbox=dict(boxstyle="round,pad=0.20", facecolor=BG,
                  edgecolor=PRIMARY, linewidth=1.5, alpha=0.95))

# ══════════════════════════════════════════════════════════════════════════════
# RIGHT panel — HyperNetwork: one shared model
# ══════════════════════════════════════════════════════════════════════════════

# Panel heading
ax.text(RIGHT_CX, Y_HEAD, "HyperNetwork",
        ha="center", va="center",
        fontsize=FS_HEADING, color=MUTED, fontweight="bold",
        fontfamily="DejaVu Sans", zorder=5)

# ✓ callout
ax.text(RIGHT_CX, Y_CALL, "✓  one model for any building",
        ha="center", va="center",
        fontsize=FS_CALLOUT, color=GREEN, fontweight="bold",
        fontfamily="DejaVu Sans", zorder=5)

# Buildings + shared model box
BLDG_X_R = MID + 0.68    # 5.43
NET_CX_R  = MID + 3.38   # 8.13
NET_CY_R  = Y_ROWS[1]    # 3.22  (middle row)
NET_W_R   = 1.72          # shared box width
NET_H_R   = 2.08          # shared box height (spans 3 rows)

model_box(NET_CX_R, NET_CY_R, NET_W_R, NET_H_R,
          "Hyper\nNetwork\n(shared)", ACCENT, lw=2.6, fs=FS_BOX)

for i, y in enumerate(Y_ROWS):
    bh = 0.72 + i * 0.07
    building_glyph(BLDG_X_R, y, BW, bh, ACCENT)
    arrow_to(BLDG_X_R + BW/2, y, NET_CX_R - NET_W_R/2, NET_CY_R, ACCENT)

# Column labels
ax.text(BLDG_X_R, Y_COL_LBL, "N buildings",
        ha="center", va="center",
        fontsize=FS_COL_LBL, color=MUTED, fontfamily="DejaVu Sans", zorder=5)
ax.text(NET_CX_R, Y_COL_LBL, "1 shared model",
        ha="center", va="center",
        fontsize=FS_COL_LBL, color=MUTED, fontfamily="DejaVu Sans", zorder=5)

# Bottom caption
ax.text(RIGHT_CX, Y_CAP,
        "N buildings  →  1 model,  no retraining\nWeights generated from building features",
        ha="center", va="center",
        fontsize=FS_CAPTION, color=ACCENT,
        fontfamily="DejaVu Sans", linespacing=1.4, zorder=5,
        bbox=dict(boxstyle="round,pad=0.20", facecolor=BG,
                  edgecolor=ACCENT, linewidth=1.5, alpha=0.95))

# ── VS badge ──────────────────────────────────────────────────────────────────
ax.add_patch(mpatches.Circle((MID, NET_CY_R), 0.46, color=INK, zorder=6))
ax.text(MID, NET_CY_R, "VS",
        ha="center", va="center",
        fontsize=FS_VS, color=BG, fontweight="bold",
        fontfamily="DejaVu Sans", zorder=7)

# ── Save ───────────────────────────────────────────────────────────────────────
ASSETS   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
svg_path = os.path.join(ASSETS, "slide03_one_vs_many.svg")
png_path = os.path.join(ASSETS, "slide03_one_vs_many.png")

fig.savefig(svg_path, format="svg", dpi=150, bbox_inches="tight", facecolor=BG)
fig.savefig(png_path, format="png", dpi=150, bbox_inches="tight", facecolor=BG)

print(f"SVG : {svg_path}  ({os.path.getsize(svg_path):,} bytes)")
print(f"PNG : {png_path}  ({os.path.getsize(png_path):,} bytes)")
print(f"Canvas: {W:.1f} x {H:.1f} in  →  aspect {W/H:.3f}")
print("Font sizes (pt):")
print(f"  title={FS_TITLE}  headings={FS_HEADING}  callouts={FS_CALLOUT}")
print(f"  box-labels={FS_BOX}  col-labels={FS_COL_LBL}  captions={FS_CAPTION}  VS={FS_VS}")
