"""
_bake_mimo.py — bake MIMO multi-floor dataset for slide 11 input→output component.

Source: .coco/tasks_reports/phase4_stage_e_dual_amp_pairs.npz
Output: presentation_emi_2026/data/mimo.json

Floor indices (0-based): [2, 6, 10, 14]
  Floor 3  (idx 2)  — near-bottom
  Floor 7  (idx 6)  — lower-mid
  Floor 11 (idx 10) — upper-mid
  Floor 15 (idx 14) — top

Model versions used:
  wind      → v3, default variant
  constant  → v3, default variant
  sine      → v3, default variant
  impulse   → v3, 0.5MN in-distribution variant

Downsampling: 600 steps → 300 pts (step=2), dt_stored=0.1 → effective dt=0.2 s
Time axis: 0, 0.2, 0.4, ..., 59.8 s (300 points)
"""

import json
import pathlib
import numpy as np

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent  # project root
NPZ  = ROOT / ".coco/tasks_reports/phase4_stage_e_dual_amp_pairs.npz"
OUT  = HERE / "mimo.json"

FLOORS_SHOWN = [2, 6, 10, 14]   # 0-indexed; floor labels 3,7,11,15
STEP         = 2                  # downsample stride: 600 → 300 pts
N_SIG        = 5                  # significant figures for rounding

def sigfig(arr, n):
    """Round array values to n significant figures, return Python list."""
    out = []
    for v in arr:
        fv = float(v)
        if fv == 0.0:
            out.append(0.0)
        else:
            from math import log10, floor
            mag = floor(log10(abs(fv)))
            factor = 10 ** (n - 1 - mag)
            out.append(round(fv * factor) / factor)
    return out

def extract_class(d, load_key, fem_key, nn_key, floors, step):
    """
    Extract one load class.
    Returns dict with keys: input (per floor), fem (per floor), nn (per floor).
    Each is a list of lists (one list per floor).
    """
    load = d[load_key]   # shape (600, 15)
    fem  = d[fem_key]    # shape (600, 15)
    nn   = d[nn_key]     # shape (600, 15)

    # Downsample along time axis
    load_ds = load[::step]  # (300, 15)
    fem_ds  = fem[::step]
    nn_ds   = nn[::step]

    inp_rows = []
    fem_rows = []
    nn_rows  = []
    for f in floors:
        inp_rows.append(sigfig(load_ds[:, f], N_SIG))
        fem_rows.append(sigfig(fem_ds[:, f],  N_SIG))
        nn_rows.append(sigfig(nn_ds[:, f],    N_SIG))

    return {"input": inp_rows, "fem": fem_rows, "nn": nn_rows}


def main():
    d = np.load(NPZ, allow_pickle=True)

    # Time axis (downsampled): 0, 0.2, ..., 59.8 → 300 pts
    t_full = np.arange(600) * 0.1        # 0.0 … 59.9
    t_ds   = t_full[::STEP]              # 0.0, 0.2, … 59.8
    t_list = sigfig(t_ds, N_SIG)

    classes = {
        "wind": {
            "load_key": "wind_v3_default_load",
            "fem_key":  "wind_v3_default_fem",
            "nn_key":   "wind_v3_default_nn",
            "version":  "v3/default",
            "note":     "multi-floor spatially non-uniform wind load; each floor has different force magnitude",
        },
        "constant": {
            "load_key": "constant_v3_default_load",
            "fem_key":  "constant_v3_default_fem",
            "nn_key":   "constant_v3_default_nn",
            "version":  "v3/default",
            "note":     "multi-floor spatially uniform constant load; identical force at every floor",
        },
        "sine": {
            "load_key": "sine_v3_default_load",
            "fem_key":  "sine_v3_default_fem",
            "nn_key":   "sine_v3_default_nn",
            "version":  "v3/default",
            "note":     "multi-floor spatially uniform sinusoidal load; identical force at every floor",
        },
        "impulse": {
            "load_key": "impulse_v3_0p5MN_indist_load",
            "fem_key":  "impulse_v3_0p5MN_indist_fem",
            "nn_key":   "impulse_v3_0p5MN_indist_nn",
            "version":  "v3/0.5MN_indist",
            "note":     "multi-floor spatially uniform impulse (0.5 MN, in-distribution); identical force at every floor",
        },
    }

    result = {
        "meta": {
            "dt_stored":     0.1,
            "dt_downsampled": 0.2,
            "n_steps":       300,
            "n_floors":      15,
            "demo_building": "H85 W25 D25 z0.02 rho200 15F seed42",
            "source_npz":    "phase4_stage_e_dual_amp_pairs.npz",
            "versions_used": {
                cls: info["version"] for cls, info in classes.items()
            },
            "notes": {
                cls: info["note"] for cls, info in classes.items()
            },
        },
        "floors_shown": FLOORS_SHOWN,
        "t": t_list,
    }

    for cls, info in classes.items():
        extracted = extract_class(
            d,
            info["load_key"],
            info["fem_key"],
            info["nn_key"],
            FLOORS_SHOWN,
            STEP,
        )
        result[cls] = extracted

    OUT.write_text(json.dumps(result, separators=(",", ":")) + "\n")
    print(f"Written: {OUT}")
    print(f"Floors shown (0-indexed): {FLOORS_SHOWN}")
    print(f"Time points: {len(t_list)} (t={t_list[0]}…{t_list[-1]} s)")

    # Quick sanity check
    for cls in classes:
        rows_in  = len(result[cls]["input"])
        rows_fem = len(result[cls]["fem"])
        rows_nn  = len(result[cls]["nn"])
        n_t      = len(result[cls]["input"][0])
        print(f"  {cls}: input={rows_in}×{n_t}, fem={rows_fem}×{n_t}, nn={rows_nn}×{n_t}")

    # Report load character per class
    print("\nLoad character (is wind multi-floor?):")
    for cls in classes:
        load_key = classes[cls]["load_key"]
        load_full = d[load_key]   # (600, 15)
        floor_rms = np.sqrt(np.mean(load_full**2, axis=0))
        nonzero_floors = int(np.sum(floor_rms > 1e-6 * floor_rms.max()))
        print(f"  {cls}: {nonzero_floors} floors with significant load "
              f"(max_rms={floor_rms.max():.4g})")

    print(f"\nFile size: {OUT.stat().st_size/1024:.1f} KB")


if __name__ == "__main__":
    main()
