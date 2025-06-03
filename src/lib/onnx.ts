import {
	env,
	AutoTokenizer,
	AutoModelForSequenceClassification,
	type AutoTokenizer as TokenizerType,
	type AutoModelForSequenceClassification as ModelType,
} from '@xenova/transformers'

env.allowLocalModels = true;
env.localModelPath = 'models';
env.allowRemoteModels = false; // Prevent fallback to HF Hub
env.backends.onnx.wasm.wasmPaths = '/onnxruntime-web/';

let toxTok: TokenizerType | null = null;
let toxModel: ModelType | null = null;

// const TOX_MODEL_ID = "unitary/toxic-bert";
const TOX_MODEL_ID = "tensor-trek/distilbert-toxicity-classifier";

export async function loadToxServer() {
	if (toxTok && toxModel) return { toxTok, toxModel }
	toxTok = await AutoTokenizer.from_pretrained(TOX_MODEL_ID, { local_files_only: true })
	toxModel = await AutoModelForSequenceClassification.from_pretrained(TOX_MODEL_ID, { local_files_only: true })
	return { toxTok, toxModel }
}

export async function inferToxicity(text: string): Promise<number> {
	const { toxTok, toxModel } = await loadToxServer()
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const encoding = await (toxTok as any)(text, { addSpecialTokens: true, maxLength: 128, padding: 'max_length', truncation: true })
	
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const output = await (toxModel as any)(encoding);

	const logits = output.logits.data as Float32Array

	const toxLogit = logits[1];
	const toxProb = 1 / (1 + Math.exp(-toxLogit));

	return parseFloat(toxProb.toFixed(2))
}
