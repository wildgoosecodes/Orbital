import { supabase } from './supabaseClient';

/** Converts a recorded audio Blob (e.g. MediaRecorder's webm/opus) into a 16-bit PCM WAV,
 *  since that's a format Gemini's audio understanding reliably accepts — decoding via
 *  AudioContext sidesteps MediaRecorder's mimeType varying by browser. */
export async function blobToWav(blob: Blob): Promise<{ base64: string; mimeType: string }> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextCtor();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numFrames = audioBuffer.length;

  const interleaved = new Int16Array(numFrames * numChannels);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < numFrames; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      interleaved[i * numChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
  }

  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = interleaved.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    view.setInt16(offset, interleaved[i], true);
  }

  await audioCtx.close();

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);

  return { base64, mimeType: 'audio/wav' };
}

/** Sends recorded audio to the existing transcribe-audio Edge Function and
 *  returns the transcribed text. */
export async function transcribeAudio(blob: Blob): Promise<string> {
  const { base64, mimeType } = await blobToWav(blob);
  const { data, error } = await supabase.functions.invoke('transcribe-audio', {
    body: { audio: { data: base64, mimeType } },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.text as string;
}
