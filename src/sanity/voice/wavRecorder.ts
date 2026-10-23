// Records the microphone as plain WAV (24 kHz, mono, 16-bit): plays on every phone,
// iPhone Safari included, and keeps the full quality needed to train a voice.
// Uses the Web Audio API instead of MediaRecorder, whose iPhone files Safari's own
// player can refuse.

const RATE = 24000;

type Ctx = typeof AudioContext;

export type WavRecording = { stop: () => Promise<{ blob: Blob; seconds: number }> };

export async function recordWav(): Promise<WavRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: false, noiseSuppression: true, autoGainControl: false },
  });
  const AC: Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: Ctx }).webkitAudioContext;
  const ctx = new AC();
  await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);
  const tap = ctx.createScriptProcessor(4096, 1, 1);
  const chunks: Float32Array[] = [];
  tap.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
  source.connect(tap);
  // The tap only runs while connected to the output; it writes nothing, so it stays silent.
  tap.connect(ctx.destination);

  return {
    async stop() {
      tap.disconnect();
      source.disconnect();
      // Microphone off straight away: iPhone won't play sound back while it's on.
      stream.getTracks().forEach((t) => t.stop());
      const from = ctx.sampleRate;
      await ctx.close();
      const pcm = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
      let at = 0;
      for (const c of chunks) {
        pcm.set(c, at);
        at += c.length;
      }
      const samples = pcm.length ? await resample(pcm, from, RATE) : pcm;
      return { blob: toWav(samples, RATE), seconds: samples.length / RATE };
    },
  };
}

async function resample(pcm: Float32Array, from: number, to: number): Promise<Float32Array> {
  if (from === to) return pcm;
  const off = new OfflineAudioContext(1, Math.ceil((pcm.length * to) / from), to);
  const buffer = off.createBuffer(1, pcm.length, from);
  buffer.getChannelData(0).set(pcm);
  const play = off.createBufferSource();
  play.buffer = buffer;
  play.connect(off.destination);
  play.start();
  return (await off.startRendering()).getChannelData(0);
}

function toWav(samples: Float32Array, rate: number): Blob {
  const data = new DataView(new ArrayBuffer(44 + samples.length * 2));
  const text = (at: number, s: string) => [...s].forEach((ch, i) => data.setUint8(at + i, ch.charCodeAt(0)));
  text(0, "RIFF");
  data.setUint32(4, 36 + samples.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  data.setUint32(16, 16, true);
  data.setUint16(20, 1, true); // PCM
  data.setUint16(22, 1, true); // mono
  data.setUint32(24, rate, true);
  data.setUint32(28, rate * 2, true);
  data.setUint16(32, 2, true);
  data.setUint16(34, 16, true);
  text(36, "data");
  data.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => data.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
  return new Blob([data], { type: "audio/wav" });
}
