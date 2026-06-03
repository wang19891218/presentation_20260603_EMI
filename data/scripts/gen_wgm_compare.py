"""
gen_wgm_compare.py
------------------
Extract time-history predictions for MLP WGM vs Transformer WGM vs
ground-truth reference on building 0, floor 20 (top).

Run from the project root:
    python documents/presentation_20260603_EMI/data/scripts/gen_wgm_compare.py

Output:
    documents/presentation_20260603_EMI/data/wgm_compare.json
"""

import json
import os
import sys

import numpy
import torch

# -------------------------------------------------------
# Paths (run from project root)
# -------------------------------------------------------
STR_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(os.path.abspath(__file__))))))

sys.path.insert(0, os.path.join(STR_PROJECT_ROOT, 'functions_py'))

from utilities_data import function_get_data_MDOF_five_features  # noqa: E402
from package_hyper_network.utils_network_model import (  # noqa: E402, F401
    LSTM_MIMO_1D3L1D,
    LSTM_MIMO_1D3L1D_Transformer,
    PlainLSTM,
)
from package_hyper_network.hyper_linear_transformer import (  # noqa: E402, F401
    TransformerLinearConditional,
    TransformerWeightGenerator,
)
from package_hyper_network.hyper_lstm_transformer import (  # noqa: E402, F401
    TransformerLSTMCellConditional,
)

STR_DATA_DIR = os.path.join(
    STR_PROJECT_ROOT,
    'data', 'database_structural_response', 'MDOF')
STR_RE_DATA = r'^MDOF_NLML.*T0600_S00160\.npz$'

STR_PATH_MLP_WGM = os.path.join(
    STR_PROJECT_ROOT, 'data', 'model', 'diagnostic_mlp_wgm.pth')
STR_PATH_TRANSFORMER_WGM = os.path.join(
    STR_PROJECT_ROOT, 'data', 'model', 'diagnostic_transformer_wgm.pth')

STR_OUTPUT_JSON = os.path.join(
    STR_PROJECT_ROOT,
    'documents', 'presentation_20260603_EMI',
    'data', 'wgm_compare.json')

INT_BUILDING_INDEX = 0
INT_TIME_STEPS = 600
FLOAT_DT = 0.1          # seconds
INT_TOP_FLOOR_INDEX = 19  # floor 20 (0-indexed)
INT_DOWNSAMPLE_PTS = 300

# -------------------------------------------------------
# Device / dtype
# -------------------------------------------------------
device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
dtype = torch.double
print(f'Device: {device}')

# -------------------------------------------------------
# Load data
# -------------------------------------------------------
print('Loading data...')
dict_data = function_get_data_MDOF_five_features(
    STR_DATA_DIR,
    str_re_file_name_match=STR_RE_DATA,
    int_number_file_to_load=1,
    int_time_steps=INT_TIME_STEPS,
    str_normalization_method='expected_absolute_maximum',
)

# Input:  (n_buildings, T, n_features_per_floor, n_floors) → feature 3
# Output: (n_buildings, T, n_output_channels, n_floors)   → channel 0
array2d_single_input = dict_data['array4d_input'][
    INT_BUILDING_INDEX:INT_BUILDING_INDEX + 1, :, 3, :]   # (1, 600, 20)
array2d_single_output = dict_data['array4d_output'][
    INT_BUILDING_INDEX:INT_BUILDING_INDEX + 1, :, 0, :]   # (1, 600, 20)
array1d_hyper_input = dict_data['array2d_hyper_input'][
    INT_BUILDING_INDEX:INT_BUILDING_INDEX + 1]             # (1, 5)

tensor_input = torch.tensor(array2d_single_input, dtype=dtype).to(device)
tensor_output = torch.tensor(array2d_single_output, dtype=dtype).to(device)
tensor_hyper_input = torch.tensor(array1d_hyper_input, dtype=dtype).to(device)

print(f'  Input shape:       {tensor_input.shape}')
print(f'  Output shape:      {tensor_output.shape}')
print(f'  Hyper-input shape: {tensor_hyper_input.shape}')

# Ground-truth reference (T, 20) → pick top floor
array_target_full = tensor_output[0].cpu().numpy()  # (600, 20)

# -------------------------------------------------------
# Load models
# -------------------------------------------------------
print('Loading MLP WGM model...')
model_mlp = torch.load(
    STR_PATH_MLP_WGM, map_location=device, weights_only=False)
model_mlp.device = device
model_mlp.to(device).to(dtype).eval()

print('Loading Transformer WGM model...')
model_transformer = torch.load(
    STR_PATH_TRANSFORMER_WGM, map_location=device, weights_only=False)
model_transformer.device = device
model_transformer.to(device).to(dtype).eval()

# -------------------------------------------------------
# Inference
# -------------------------------------------------------
print('Running inference...')
with torch.no_grad():
    array_pred_mlp = model_mlp(
        tensor_input, tensor_hyper_input)[0].cpu().numpy()          # (600, 20)
    array_pred_transformer = model_transformer(
        tensor_input, tensor_hyper_input)[0].cpu().numpy()          # (600, 20)

# -------------------------------------------------------
# Metrics (all 20 floors, matching notebook)
# -------------------------------------------------------
float_rmse_mlp = float(numpy.sqrt(
    numpy.mean((array_pred_mlp - array_target_full) ** 2)))
float_rmse_transformer = float(numpy.sqrt(
    numpy.mean((array_pred_transformer - array_target_full) ** 2)))

array_std_target = numpy.std(array_target_full, axis=0)
array_std_mlp = numpy.std(array_pred_mlp, axis=0)
array_std_transformer = numpy.std(array_pred_transformer, axis=0)

float_std_ratio_mlp = float(
    array_std_mlp.mean() / array_std_target.mean())
float_std_ratio_transformer = float(
    array_std_transformer.mean() / array_std_target.mean())

print()
print('=' * 60)
print(f'MLP WGM         RMSE={float_rmse_mlp:.6f}  '
      f'std_ratio={float_std_ratio_mlp:.4f}')
print(f'Transformer WGM RMSE={float_rmse_transformer:.6f}  '
      f'std_ratio={float_std_ratio_transformer:.4f}')
print('=' * 60)

# -------------------------------------------------------
# Build time-series at top floor (floor 20, index 19)
# -------------------------------------------------------
array_t_full = numpy.arange(INT_TIME_STEPS) * FLOAT_DT  # (600,)
array_ref_full = array_target_full[:, INT_TOP_FLOOR_INDEX]
array_mlp_full = array_pred_mlp[:, INT_TOP_FLOOR_INDEX]
array_tfm_full = array_pred_transformer[:, INT_TOP_FLOOR_INDEX]

# Downsample uniformly to ~300 points
int_step = INT_TIME_STEPS // INT_DOWNSAMPLE_PTS
array_idx = numpy.arange(0, INT_TIME_STEPS, int_step)
array_t_ds = array_t_full[array_idx]
array_ref_ds = array_ref_full[array_idx]
array_mlp_ds = array_mlp_full[array_idx]
array_tfm_ds = array_tfm_full[array_idx]

int_n = len(array_idx)
print(f'Downsampled to {int_n} points (step={int_step})')


def _to_5sig(array):
    """Round to 5 significant figures and return as Python list."""
    out = []
    for v in array:
        if v == 0.0:
            out.append(0.0)
        else:
            magnitude = int(numpy.floor(numpy.log10(abs(v))))
            factor = 10 ** (4 - magnitude)
            out.append(round(float(v) * factor) / factor)
    return out


dict_out = {
    "meta": {
        "building": "building 0 (single-building diagnostic)",
        "dof": "floor 20 (top floor, index 19)",
        "dt": FLOAT_DT,
        "n": int_n,
    },
    "t": _to_5sig(array_t_ds),
    "reference": _to_5sig(array_ref_ds),
    "mlp": _to_5sig(array_mlp_ds),
    "transformer": _to_5sig(array_tfm_ds),
    "rmse": {
        "mlp": round(float_rmse_mlp, 6),
        "transformer": round(float_rmse_transformer, 6),
    },
    "std_ratio": {
        "mlp": round(float_std_ratio_mlp, 6),
        "transformer": round(float_std_ratio_transformer, 6),
    },
}

os.makedirs(os.path.dirname(STR_OUTPUT_JSON), exist_ok=True)
with open(STR_OUTPUT_JSON, 'w') as fh:
    json.dump(dict_out, fh, indent=2)

print(f'\nWrote: {STR_OUTPUT_JSON}')
print('Done.')
