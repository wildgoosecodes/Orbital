class PcmCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      // Copy the samples — the engine reuses the underlying buffer after this call returns.
      this.port.postMessage(Float32Array.from(input[0]));
    }
    return true;
  }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor);
