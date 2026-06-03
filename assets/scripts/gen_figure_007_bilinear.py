"""
gen_figure_007_bilinear.py
Clean bilinear force–displacement backbone schematic.

Overwrites:
  assets/figure_007.png   (slide-7 already references this path)
  assets/figure_007.svg

Palette (presentation_brief.md):
  primary  #0071e3  — backbone line
  accent   #ff9f0a  — yield point marker
  ink      #1d1d1f  — axes, labels
  muted    #6e6e73  — helper lines, axis labels
  bg       #ffffff

Run from project root:
  python3 presentation_emi_2026/assets/scripts/gen_figure_007_bilinear.py
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os

# ── Palette ───────────────────────────────────────────────────────────────────
PRIMARY = "#0071e3"
ACCENT  = "#ff9f0a"
INK     = "#1d1d1f"
MUTED   = "#6e6e73"
BG      = "#ffffff"
LINE    = "#d2d2d7"

# ── Figure ────────────────────────────────────────────────────────────────────
# Portrait-ish (fits slide-7 centre column at ~40 vh max-height)
fig, ax = plt.subplots(figsize=(6.0, 6.8), facecolor=BG)
ax.set_facecolor(BG)

# ── Backbone geometry ─────────────────────────────────────────────────────────
# Normalised coordinates: δ_y = 1.0, F_y = 1.0 → k₀ = 1.0
# Post-yield slope γ·k₀ with γ = 0.07
gamma = 0.07
delta_y = 1.0
F_y     = 1.0
k0      = F_y / delta_y                       # = 1.0

delta_max = 2.40
F_max     = F_y + gamma * k0 * (delta_max - delta_y)

# Segments
seg1_x = np.array([0.0, delta_y])
seg1_y = np.array([0.0, F_y])

seg2_x = np.array([delta_y, delta_max])
seg2_y = np.array([F_y, F_max])

# ── Plot limits ────────────────────────────────────────────────────────────────
x_max = delta_max * 1.12
y_max = F_max * 1.22
ax.set_xlim(-0.08 * x_max, x_max)
ax.set_ylim(-0.08 * y_max, y_max)

# ── Axes (custom spines through origin) ───────────────────────────────────────
for spine in ax.spines.values():
    spine.set_visible(False)
ax.tick_params(left=False, bottom=False, labelleft=False, labelbottom=False)

ax.axhline(0, color=INK, lw=1.8, zorder=2)
ax.axvline(0, color=INK, lw=1.8, zorder=2)

# Arrow tips on axes
ax.annotate("", xy=(x_max, 0), xytext=(x_max * 0.97, 0),
            arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.8,
                            mutation_scale=14), zorder=3)
ax.annotate("", xy=(0, y_max), xytext=(0, y_max * 0.97),
            arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.8,
                            mutation_scale=14), zorder=3)

# Axis labels
fs_axis = 17
ax.text(x_max * 1.01, -y_max * 0.06,
        r"Displacement  $x$",
        ha="right", va="top", fontsize=fs_axis, color=INK,
        fontfamily="DejaVu Sans")
ax.text(-x_max * 0.03, y_max * 1.01,
        r"Restoring force  $F$",
        ha="left", va="bottom", fontsize=fs_axis, color=INK,
        fontfamily="DejaVu Sans")

# ── Helper dashed lines (δ_y, F_y) ────────────────────────────────────────────
dash_kw = dict(linestyle="--", linewidth=1.2, color=MUTED, zorder=1)
ax.plot([0, delta_y],   [F_y, F_y],   **dash_kw)   # horizontal to yield pt
ax.plot([delta_y, delta_y], [0, F_y], **dash_kw)   # vertical to yield pt

# Tick marks at δ_y and F_y on the axes
tick_len = 0.025 * y_max
ax.plot([delta_y, delta_y], [-tick_len, tick_len], color=INK, lw=1.5, zorder=3)
ax.plot([-tick_len * (y_max/x_max), tick_len * (y_max/x_max)],
        [F_y, F_y], color=INK, lw=1.5, zorder=3)

# ── Backbone lines ─────────────────────────────────────────────────────────────
lw_backbone = 3.0
ax.plot(seg1_x, seg1_y, color=PRIMARY, lw=lw_backbone, solid_capstyle="round",
        zorder=5)
ax.plot(seg2_x, seg2_y, color=PRIMARY, lw=lw_backbone, solid_capstyle="round",
        zorder=5)

# ── Yield point marker ────────────────────────────────────────────────────────
ax.scatter([delta_y], [F_y], s=110, color=ACCENT,
           edgecolors=INK, linewidths=1.5, zorder=7)

# ── Text labels ───────────────────────────────────────────────────────────────
fs_lbl   = 18   # main curve labels
fs_tick  = 16   # axis tick labels (δ_y, F_y)
pad = 0.04 * x_max   # small offset from spine

# δ_y on x-axis
ax.text(delta_y, -pad * 2.0,
        r"$\delta_y$",
        ha="center", va="top", fontsize=fs_tick, color=INK,
        fontfamily="DejaVu Sans")

# F_y on y-axis
ax.text(-pad * 0.8, F_y,
        r"$F_y$",
        ha="right", va="center", fontsize=fs_tick, color=INK,
        fontfamily="DejaVu Sans")

# k₀ — slope label on the initial segment (mid-point, offset above-left)
mid1_x = delta_y * 0.42
mid1_y = k0 * mid1_x
angle_deg = np.degrees(np.arctan2(F_y, delta_y))   # ≈ 45° in data coords
ax.text(mid1_x - 0.09 * x_max, mid1_y + 0.08 * y_max,
        r"slope $= k_0$",
        ha="center", va="bottom", fontsize=fs_lbl, color=PRIMARY,
        fontfamily="DejaVu Sans",
        rotation=angle_deg,
        rotation_mode="anchor")

# γ·k₀ — slope label on post-yield segment
mid2_x = delta_y + (delta_max - delta_y) * 0.52
mid2_y = F_y + gamma * k0 * (mid2_x - delta_y)
angle2_deg = np.degrees(np.arctan2(F_max - F_y, delta_max - delta_y))
ax.text(mid2_x - 0.04 * x_max, mid2_y + 0.09 * y_max,
        r"slope $= \gamma k_0$",
        ha="center", va="bottom", fontsize=fs_lbl, color=PRIMARY,
        fontfamily="DejaVu Sans",
        rotation=angle2_deg,
        rotation_mode="anchor")

# γ value annotation (bottom-right corner, small)
ax.text(x_max * 0.97, y_max * 0.06,
        r"$\gamma = 0.07$",
        ha="right", va="bottom", fontsize=14, color=MUTED,
        fontfamily="DejaVu Sans")

# "Yield point" callout
ax.annotate(
    "Yield point",
    xy=(delta_y, F_y),
    xytext=(delta_y + 0.32 * (delta_max - delta_y),
            F_y - 0.18 * y_max),
    fontsize=14, color=ACCENT,
    fontfamily="DejaVu Sans",
    ha="left", va="top",
    arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=1.2,
                    mutation_scale=10, connectionstyle="arc3,rad=-0.25"),
    zorder=8,
)

# ── Origin label ──────────────────────────────────────────────────────────────
ax.text(-pad * 0.9, -pad * 1.6, "O",
        ha="right", va="top", fontsize=14, color=INK,
        fontfamily="DejaVu Sans")

# ── Light grid (optional, very faint) ─────────────────────────────────────────
# (intentionally omitted for minimal look)

# ── Save ──────────────────────────────────────────────────────────────────────
fig.tight_layout(pad=0.5)

ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
png_path = os.path.join(ASSETS, "figure_007.png")
svg_path = os.path.join(ASSETS, "figure_007.svg")

fig.savefig(png_path, format="png", dpi=200, bbox_inches="tight", facecolor=BG)
fig.savefig(svg_path, format="svg", dpi=200, bbox_inches="tight", facecolor=BG)

print(f"PNG: {png_path}  ({os.path.getsize(png_path):,} bytes)")
print(f"SVG: {svg_path}  ({os.path.getsize(svg_path):,} bytes)")
print("Symbols check: δ_y  F_y  k₀  γ·k₀  — inspect PNG to confirm no garbling.")
