/**
 * "Hey Orbital" hands-free detection via openWakeWord's 3-stage ONNX pipeline,
 * run continuously on live mic audio: melspectrogram.onnx -> embedding_model.onnx
 * -> a custom hey_orbital.onnx classifier, scored over a sliding embedding window.
 * Tensor shapes/names below were verified empirically against the real model files,
 * not assumed from documentation (see project memory for the specifics).
 */
(async function initWakeWord() {
  const CHUNK_SIZE = 1280; // samples per melspectrogram call (80ms @ 16kHz)
  const MEL_WINDOW = 76; // mel frames per embedding-model call
  const MEL_STRIDE = 8; // advance this many frames between embedding calls
  const TARGET_SAMPLE_RATE = 16000;
  const DETECTION_THRESHOLD = 0.5;
  const DETECTION_DEBOUNCE_MS = 3000;

  function concatFloat32(a, b) {
    const out = new Float32Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
  }

  async function loadModel(dirUrl, filename) {
    const res = await fetch(`${dirUrl}/${filename}`);
    if (!res.ok) throw new Error(`Failed to fetch ${filename}: HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    return ort.InferenceSession.create(buffer);
  }

  let melSession;
  let embSession;
  let classifierSession;
  let classifierInputName;
  let numEmbeddings;
  let embDim;

  try {
    ort.env.wasm.wasmPaths = '../node_modules/onnxruntime-web/dist/';

    const modelDir = await window.orbital.getWakewordModelDir();
    const dirUrl = `file:///${modelDir}`.replace(/\\/g, '/');

    melSession = await loadModel(dirUrl, 'melspectrogram.onnx');
    embSession = await loadModel(dirUrl, 'embedding_model.onnx');
    classifierSession = await loadModel(dirUrl, 'hey_orbital.onnx');

    classifierInputName = classifierSession.inputNames[0];
    const shape = classifierSession.inputMetadata[0].shape; // e.g. [1, 16, 96]
    numEmbeddings = shape[1];
    embDim = shape[2];

    console.log('Wake-word model loaded — listening (see wakeword/PLACE_MODEL_FILE_HERE.txt for which phrase is currently trained).');
  } catch (err) {
    console.log('Wake-word listening not started (model missing or failed to load):', err.message);
    return;
  }

  let melFrameBuffer = [];
  let embeddingBuffer = [];
  let sampleBuffer = new Float32Array(0);
  let framesSinceLastEmbedding = 0;
  let lastDetectionAt = 0;

  async function onWakeWordDetected() {
    const now = Date.now();
    if (now - lastDetectionAt < DETECTION_DEBOUNCE_MS) return;
    lastDetectionAt = now;
    console.log('Wake word detected');
    await window.orbital.showAndFocus();
    if (typeof isRecording !== 'undefined' && !isRecording && typeof startRecording === 'function') {
      startRecording(true);
    }
  }

  async function processChunk(chunk) {
    const inputTensor = new ort.Tensor('float32', chunk, [1, CHUNK_SIZE]);
    const melResults = await melSession.run({ [melSession.inputNames[0]]: inputTensor });
    const melOutput = melResults[melSession.outputNames[0]];
    const dims = melOutput.dims; // verified shape: [1, 1, n_frames, 32]
    const nFrames = dims[dims.length - 2];
    const nMel = dims[dims.length - 1];

    for (let f = 0; f < nFrames; f++) {
      const frame = new Float32Array(nMel);
      for (let m = 0; m < nMel; m++) frame[m] = melOutput.data[f * nMel + m];
      melFrameBuffer.push(frame);
    }
    if (melFrameBuffer.length > 500) melFrameBuffer = melFrameBuffer.slice(-500);
    framesSinceLastEmbedding += nFrames;

    while (melFrameBuffer.length >= MEL_WINDOW && framesSinceLastEmbedding >= MEL_STRIDE) {
      const windowFrames = melFrameBuffer.slice(melFrameBuffer.length - MEL_WINDOW);
      const windowData = new Float32Array(MEL_WINDOW * nMel);
      for (let f = 0; f < MEL_WINDOW; f++) windowData.set(windowFrames[f], f * nMel);

      const embInput = new ort.Tensor('float32', windowData, [1, MEL_WINDOW, nMel, 1]);
      const embResults = await embSession.run({ [embSession.inputNames[0]]: embInput });
      const embOutput = embResults[embSession.outputNames[0]];
      embeddingBuffer.push(Float32Array.from(embOutput.data.slice(-embDim)));
      if (embeddingBuffer.length > numEmbeddings * 3) embeddingBuffer = embeddingBuffer.slice(-numEmbeddings * 3);
      framesSinceLastEmbedding -= MEL_STRIDE;

      if (embeddingBuffer.length >= numEmbeddings) {
        const recent = embeddingBuffer.slice(-numEmbeddings);
        const stacked = new Float32Array(numEmbeddings * embDim);
        for (let e = 0; e < numEmbeddings; e++) stacked.set(recent[e], e * embDim);

        const clInput = new ort.Tensor('float32', stacked, [1, numEmbeddings, embDim]);
        const clResults = await classifierSession.run({ [classifierInputName]: clInput });
        const score = clResults[classifierSession.outputNames[0]].data[0];
        if (score >= DETECTION_THRESHOLD) onWakeWordDetected();
      }
    }
  }

  let micStream;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1 } });
  } catch (err) {
    console.log('Wake-word listening not started — microphone unavailable:', err.message);
    return;
  }

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(micStream);
  await audioCtx.audioWorklet.addModule('wakewordWorkletProcessor.js');
  const workletNode = new AudioWorkletNode(audioCtx, 'pcm-capture-processor');
  source.connect(workletNode);

  const nativeSampleRate = audioCtx.sampleRate;
  let resampleTail = new Float32Array(0);

  workletNode.port.onmessage = (event) => {
    const incoming = event.data;
    const merged = concatFloat32(resampleTail, incoming);

    // Linear-interpolation resample down to 16kHz — getUserMedia's native rate
    // (often 44.1/48kHz) isn't reliably forceable, so this is done manually.
    const ratio = nativeSampleRate / TARGET_SAMPLE_RATE;
    const outLength = Math.floor(merged.length / ratio);
    const resampled = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIndex = i * ratio;
      const i0 = Math.floor(srcIndex);
      const i1 = Math.min(i0 + 1, merged.length - 1);
      const frac = srcIndex - i0;
      resampled[i] = merged[i0] * (1 - frac) + merged[i1] * frac;
    }
    resampleTail = merged.slice(Math.floor(outLength * ratio));

    sampleBuffer = concatFloat32(sampleBuffer, resampled);
    while (sampleBuffer.length >= CHUNK_SIZE) {
      const chunk = sampleBuffer.slice(0, CHUNK_SIZE);
      sampleBuffer = sampleBuffer.slice(CHUNK_SIZE);
      processChunk(chunk).catch((err) => console.error('Wake-word processing error:', err));
    }
  };
})();
