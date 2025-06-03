import { env } from '@xenova/transformers'

env.allowLocalModels = true;
env.localModelPath = '/models';
env.backends.onnx.wasm.wasmPaths = '/onnxruntime-web/';

