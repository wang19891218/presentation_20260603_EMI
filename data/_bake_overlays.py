"""
_bake_overlays.py -- reproducible pre-bake of overlays.json and results.json
for the EMI 2026 static slide deck.

Sources:
  .coco/tasks_reports/v1_v2_pairs.npz         -- single demo building, v1+v2
  .coco/tasks_reports/phase4_stage_e_dual_amp_pairs.npz -- v1+v2+v3

Run from project root:
  python3 presentation_emi_2026/data/_bake_overlays.py
"""

import json
import math
import numpy as np
from pathlib import Path

# -- paths --
ROOT = Path(__file__).resolve().parent.parent.parent
NPZ_PHASE4 = ROOT / ".coco/tasks_reports/phase4_stage_e_dual_amp_pairs.npz"
OUT_DIR = ROOT / "presentation_emi_2026/data"

# -- helpers --
def sig5(x):
    """Round float to 5 significant figures."""
    if x == 0:
        return 0.0
    d = math.floor(math.log10(abs(x)))
    factor = 10 ** (4 - d)
    return round(x * factor) / factor

def sig5_arr(arr):
    return [sig5(float(v)) for v in arr]

def nrmse_top(nn, fem, floor_idx=14):
    nn_f = nn[:, floor_idx]
    fem_f = fem[:, floor_idx]
    err = nn_f - fem_f
    rms_err = math.sqrt(float(np.mean(err ** 2)))
    rms_fem = math.sqrt(float(np.mean(fem_f ** 2)))
    if rms_fem == 0:
        return float("inf")
    return rms_err / rms_fem

def load_curve(f, key_prefix, floor=14, downsample_to=300):
    """Extract top-floor curves and verify NRMSE against stored metric."""
    fem_full = f[f"{key_prefix}_fem"]
    nn_full  = f[f"{key_prefix}_nn"]
    metrics  = json.loads(str(f[f"{key_prefix}_metrics_json"]))

    stored_nrmse   = metrics["nrmse_floor"][floor]
    computed_nrmse = nrmse_top(nn_full, fem_full, floor)
    rel_diff = abs(computed_nrmse - stored_nrmse) / max(abs(stored_nrmse), 1e-12)
    mismatch = rel_diff > 0.15

    n    = fem_full.shape[0]
    step = max(1, n // downsample_to)
    t_ds   = np.arange(n)[::step] * 0.1
    fem_ds = fem_full[::step, floor]
    nn_ds  = nn_full[::step, floor]

    return {
        "t":   sig5_arr(t_ds),
        "fem": sig5_arr(fem_ds),
        "nn":  sig5_arr(nn_ds),
        "_nrmse_top_computed": round(computed_nrmse, 6),
        "_nrmse_top_stored":   round(stored_nrmse, 6),
        "_nrmse_mismatch":     mismatch,
        "_rel_diff_pct":       round(rel_diff * 100, 2),
    }

# -- load npz --
f_ph4 = np.load(NPZ_PHASE4, allow_pickle=True)

LOAD_PREFIXES = {
    "wind":     {1: "wind_v1_default",         2: "wind_v2_default",         3: "wind_v3_default"},
    "constant": {1: "constant_v1_default",     2: "constant_v2_default",     3: "constant_v3_default"},
    "sine":     {1: "sine_v1_default",         2: "sine_v2_default",         3: "sine_v3_default"},
    "impulse":  {1: "impulse_v1_0p5MN_indist", 2: "impulse_v2_0p5MN_indist", 3: "impulse_v3_0p5MN_indist"},
}

FLOOR_TOP = 14

overlays = {
    "meta": {
        "dt_stored": 0.1,
        "n_steps": 600,
        "n_downsampled": None,
        "floor_top_index": FLOOR_TOP,
        "demo_building": "H85 W25 D25 z0.02 rho200 15F seed42",
        "impulse_amplitude": "0.5MN (in-distribution)",
        "source_npz": "phase4_stage_e_dual_amp_pairs.npz",
    }
}

mismatches = []

for load_class, prefix_map in LOAD_PREFIXES.items():
    overlays[load_class] = {}
    for ver, prefix in prefix_map.items():
        ver_key = f"v{ver}"
        try:
            curve = load_curve(f_ph4, prefix, floor=FLOOR_TOP)
        except KeyError as e:
            print(f"  MISSING: {prefix} -- {e}")
            continue

        if curve["_nrmse_mismatch"]:
            mismatches.append({
                "load": load_class, "ver": ver_key,
                "stored": curve["_nrmse_top_stored"],
                "computed": curve["_nrmse_top_computed"],
                "rel_diff_pct": curve["_rel_diff_pct"],
            })
            print(f"  MISMATCH {load_class}_{ver_key}: stored={curve['_nrmse_top_stored']:.4f} "
                  f"computed={curve['_nrmse_top_computed']:.4f} rel={curve['_rel_diff_pct']:.1f}%")
        else:
            print(f"  OK {load_class}_{ver_key}: nrmse_top={curve['_nrmse_top_computed']:.6f} "
                  f"rel_diff={curve['_rel_diff_pct']:.1f}%")

        clean = {k: v for k, v in curve.items() if not k.startswith("_")}
        overlays[load_class][ver_key] = clean

# fill n_downsampled
for lc in overlays:
    if lc == "meta":
        continue
    for vk in overlays[lc]:
        overlays["meta"]["n_downsampled"] = len(overlays[lc][vk]["t"])
        break
    break

out_overlays = OUT_DIR / "overlays.json"
with open(out_overlays, "w") as fh:
    json.dump(overlays, fh, separators=(",", ":"))
print(f"\nWrote {out_overlays} ({out_overlays.stat().st_size / 1024:.1f} kB)")

# Print mismatch log
if mismatches:
    print(f"\nNRMSE MISMATCHES ({len(mismatches)}):")
    for m in mismatches:
        print(f"  {m['load']}_{m['ver']}: stored={m['stored']:.4f} computed={m['computed']:.4f} "
              f"rel_diff={m['rel_diff_pct']:.1f}%")
    print("  NOTE: stored nrmse_floor[14] = single-demo-building top-floor NRMSE.")
    print("  Paper population_nrmse = mean over 900 test buildings -- NOT comparable.")
else:
    print("All NRMSE values verified (< 15% relative difference).")

# -- results.json (all values from main_ver_5.tex) --
results = {
    "population_nrmse": {
        "wind":     {"v1": 0.0099, "v2": 0.0185, "v3": 0.0125},
        "constant": {"v1": 2.94,   "v2": 0.077,  "v3": 0.046},
        "sine":     {"v1": 12.0,   "v2": 0.310,  "v3": 0.137},
        "impulse":  {"v1": 22.9,   "v2": 0.800,  "v3": 0.542},
    },
    "headline": {
        "nrmse_160_before":      0.087,
        "nrmse_160_after":       0.017,
        "nrmse_9k_mean_pct":     0.98,
        "nrmse_9k_median_pct":   0.89,
        "speedup":               7000,
        "opensees_s_per_building": 80,
        "n_buildings_9k":        9000,
        "n_test":                900,
    },
    "scalability": [
        {"metric": "Features N_F",          "b160": "5",          "k9_zeropad": "7",          "k9_interp": "7"},
        {"metric": "Training buildings",    "b160": "128",        "k9_zeropad": "7200",       "k9_interp": "7200"},
        {"metric": "Test buildings",        "b160": "16",         "k9_zeropad": "900",        "k9_interp": "900"},
        {"metric": "Split protocol",        "b160": "simulation", "k9_zeropad": "simulation", "k9_interp": "building-level"},
        {"metric": "Output representation", "b160": "10 floors",  "k9_zeropad": "40 slots",   "k9_interp": "20 heights"},
        {"metric": "Parameters",            "b160": "6,828,324",  "k9_zeropad": "7.08M",      "k9_interp": "6.83M"},
        {"metric": "Mean RMSE",             "b160": "0.0004",     "k9_zeropad": "0.0035",     "k9_interp": "2.67e-4"},
        {"metric": "Mean NRMSE (%)",        "b160": "1.70",       "k9_zeropad": "6.46",       "k9_interp": "0.98"},
        {"metric": "Median NRMSE (%)",      "b160": None,         "k9_zeropad": None,         "k9_interp": "0.89"},
        {"metric": "NRMSE std (%)",         "b160": None,         "k9_zeropad": None,         "k9_interp": "0.37"},
        {"metric": "NRMSE 10F/15F/20F (%)", "b160": None,         "k9_zeropad": None,         "k9_interp": "1.05/1.01/0.88"},
        {"metric": "Training time",         "b160": None,         "k9_zeropad": None,         "k9_interp": "~4 h"},
    ],
    "stratified_sine": [
        {"bin": "< 0.85 (sub-resonance)",         "v3_n": 164, "v3_mean": 0.096, "v2_n": 314, "v2_mean": 0.184},
        {"bin": "[0.85, 1.15] (resonance)",        "v3_n": 445, "v3_mean": 0.133, "v2_n": 152, "v2_mean": 0.396},
        {"bin": "> 1.15 (super-resonance)",        "v3_n": 291, "v3_mean": 0.165, "v2_n": 434, "v2_mean": 0.370},
        {"bin": "[0.95, 1.05] (tight resonance)",  "v3_n": 150, "v3_mean": 0.130, "v2_n":  53, "v2_mean": 0.351},
    ],
}

out_results = OUT_DIR / "results.json"
with open(out_results, "w") as fh:
    json.dump(results, fh, indent=2)
print(f"Wrote {out_results} ({out_results.stat().st_size / 1024:.1f} kB)")

print("\n=== Overlay coverage ===")
for lc in ["wind", "constant", "sine", "impulse"]:
    present = list(overlays.get(lc, {}).keys())
    print(f"  {lc}: {present}")

print("\nDone.")
