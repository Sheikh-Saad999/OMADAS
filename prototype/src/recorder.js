// Browser-side audio engine.
// Captures the microphone as 16 kHz mono PCM, cuts it into short WAV segments
// (so each upload stays under Vercel's 4.5 MB request limit) and hands every
// segment to a callback. Nothing is stored: audio only lives in memory.

export const TARGET_RATE = 16000;
export const SEGMENT_SECONDS = 75;
const SILENCE_RMS = 0.003; // segments quieter than this are skipped (saves quota, avoids hallucinated text)

const WORKLET_SRC = `
class PcmCapture extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice(0));
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
`;

function resample(input, fromRate, toRate) {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx];
    const b = input[Math.min(idx + 1, input.length - 1)];
    out[i] = a + (b - a) * frac;
  }
  return out;
}

function rms(samples) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / (samples.length || 1));
}

function wavBase64(samples, rate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  write(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * createRecorder({ onSegment, onLevel, onError })
 *   onSegment({ index, offsetSeconds, durationSeconds, base64, mimeType })
 *   onLevel(0..1)  throttled to ~10 updates per second
 * Returns { start(), stop() }.
 */
export function createRecorder({ onSegment, onLevel, onError }) {
  let stream = null;
  let ctx = null;
  let node = null;
  let chunks = [];
  let chunkSamples = 0;
  let offsetSeconds = 0;
  let index = 0;
  let lastLevelAt = 0;
  let running = false;

  function flush(final) {
    if (!chunkSamples) return;
    const merged = new Float32Array(chunkSamples);
    let pos = 0;
    for (const c of chunks) {
      merged.set(c, pos);
      pos += c.length;
    }
    chunks = [];
    chunkSamples = 0;

    const samples = resample(merged, ctx.sampleRate, TARGET_RATE);
    const durationSeconds = samples.length / TARGET_RATE;
    if (final && durationSeconds < 1) return; // ignore a trailing fragment
    const segmentOffset = offsetSeconds;
    offsetSeconds += durationSeconds;

    if (rms(samples) < SILENCE_RMS) return; // silent segment: skip, but keep the clock advancing

    onSegment({
      index: index++,
      offsetSeconds: segmentOffset,
      durationSeconds,
      base64: wavBase64(samples, TARGET_RATE),
      mimeType: "audio/wav",
    });
  }

  async function start() {
    if (running) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioWorkletNode === "undefined") {
      throw new Error("This browser does not support microphone capture. Please use a current version of Chrome, Edge or Safari.");
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      throw new Error("Microphone access was denied. Please allow microphone access in the browser and try again.");
    }

    try {
      ctx = new AudioContext({ sampleRate: TARGET_RATE });
    } catch {
      ctx = new AudioContext(); // some browsers refuse a custom rate; we resample manually
    }

    const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" }));
    try {
      await ctx.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }

    const source = ctx.createMediaStreamSource(stream);
    node = new AudioWorkletNode(ctx, "pcm-capture");
    const mute = ctx.createGain();
    mute.gain.value = 0; // keeps the graph "pulled" without playing the mic back through the speakers
    source.connect(node);
    node.connect(mute);
    mute.connect(ctx.destination);

    chunks = [];
    chunkSamples = 0;
    offsetSeconds = 0;
    index = 0;
    running = true;

    const segmentSamples = ctx.sampleRate * SEGMENT_SECONDS;
    node.port.onmessage = (e) => {
      if (!running) return;
      const data = e.data;
      chunks.push(data);
      chunkSamples += data.length;

      const now = performance.now();
      if (onLevel && now - lastLevelAt > 100) {
        lastLevelAt = now;
        onLevel(Math.min(1, rms(data) * 6));
      }
      if (chunkSamples >= segmentSamples) {
        try {
          flush(false);
        } catch (err) {
          onError?.(err);
        }
      }
    };
  }

  function stop() {
    if (!running) return;
    running = false;
    try {
      flush(true);
    } catch (err) {
      onError?.(err);
    }
    node?.disconnect();
    stream?.getTracks().forEach((t) => t.stop());
    ctx?.close();
    node = null;
    stream = null;
    ctx = null;
    onLevel?.(0);
  }

  return { start, stop };
}
