import os
from huggingface_hub import snapshot_download
from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForSequenceClassification, ORTQuantizer
from optimum.onnxruntime.configuration import AutoQuantizationConfig

# TOX_MODEL_ID = "unitary/toxic-bert"
TOX_MODEL_ID = "tensor-trek/distilbert-toxicity-classifier"
EXPORT_BASE_DIR = "../public/models"
QUANT_CONFIG = AutoQuantizationConfig.arm64(
	is_static=False, per_channel=False
)

os.makedirs(EXPORT_BASE_DIR, exist_ok=True)

def export_and_quantize(model_id: str):
	org, name = model_id.split("/")
	export_dir = os.path.join(EXPORT_BASE_DIR, org, name)

	print(f"Downloading {model_id}…")
	snapshot_download(repo_id=model_id, cache_dir=export_dir)

	print(f"Exporting {model_id} to ONNX…")
	ort_model = ORTModelForSequenceClassification.from_pretrained(
		model_id, export=True
	)
	ort_model.save_pretrained(export_dir)

	tokenizer = AutoTokenizer.from_pretrained(model_id)
	tokenizer.save_pretrained(export_dir)

	print(f"Quantizing {model_id}…")
	quantizer = ORTQuantizer.from_pretrained(export_dir) 
	quantizer.quantize(
		save_dir=export_dir,
		quantization_config=QUANT_CONFIG
	)

	onnx_src = os.path.join(export_dir, "model_quantized.onnx")
	onnx_dst_dir = os.path.join(export_dir, "onnx")
	os.makedirs(onnx_dst_dir, exist_ok=True)
	if os.path.exists(onnx_src):
		onnx_dst = os.path.join(onnx_dst_dir, "model_quantized.onnx")
		os.replace(onnx_src, onnx_dst)
		print(f"Moved model_quantized.onnx to {onnx_dst_dir}")

for model_id in (TOX_MODEL_ID, ):
	export_and_quantize(model_id)

print("Export and quantization complete.")
