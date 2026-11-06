import { frequency } from '../music';
import { detectPitch, type Pitch } from './pitch';

export class AudioEngine {
  private context: AudioContext | null = null;
  private output: DynamicsCompressorNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frame = 0;
  private generation = 0;
  private playback = 0;
  private voices: OscillatorNode[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private resolvePlay: (() => void) | null = null;
  private async ready() {
    this.context ??= new AudioContext();
    if (!this.output) {
      this.output = this.context.createDynamicsCompressor();
      this.output.threshold.value = -12; this.output.knee.value = 18;
      this.output.ratio.value = 5; this.output.attack.value = .003; this.output.release.value = .18;
      this.output.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context;
  }
  async start(onPitch: (pitch: Pitch | null, time: number) => void, onEnded: () => void): Promise<boolean> {
    this.stopMic();
    const generation = this.generation;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('INSECURE');
    const context = await this.ready();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
    if (generation !== this.generation) { stream.getTracks().forEach(t => t.stop()); return false; }
    this.stream = stream;
    stream.getAudioTracks().forEach(track => track.addEventListener('ended', onEnded, { once: true }));
    this.source = context.createMediaStreamSource(stream);
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 4096;
    this.source.connect(this.analyser);
    const buffer = new Float32Array(this.analyser.fftSize);
    let last = -Infinity;
    const tick = (now: number) => {
      if (generation !== this.generation || !this.analyser) return;
      if (now - last >= 40) {
        last = now;
        this.analyser.getFloatTimeDomainData(buffer);
        onPitch(detectPitch(buffer, context.sampleRate), now);
      }
      if (generation === this.generation) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
    return true;
  }
  stopMic() {
    this.generation++;
    cancelAnimationFrame(this.frame);
    this.source?.disconnect(); this.source = null;
    this.analyser?.disconnect(); this.analyser = null;
    this.stream?.getTracks().forEach(track => track.stop()); this.stream = null;
  }
  async play(notes: number[], together = false) {
    this.stopMic(); this.stopPlayback();
    const playback = this.playback;
    const context = await this.ready();
    if (playback !== this.playback) return;
    const start = context.currentTime + .08;
    const spacing = 1.05;
    const duration = together ? 2.3 : 1.9;
    const harmonics = [1, .5, .25, .13, .075, .04, .02];
    notes.forEach((midi, i) => {
      const at = start + (together ? 0 : i * spacing);
      const fundamental = frequency(midi);
      // Struck-string approximation: fast attack, slightly inharmonic partials,
      // and higher harmonics decaying faster than the body of the note.
      harmonics.forEach((weight, index) => {
        const partial = index + 1;
        const hz = fundamental * partial * Math.sqrt(1 + .000035 * index * index);
        if (hz >= context.sampleRate / 2) return;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = hz;
        const peak = .34 * weight / (together ? Math.sqrt(notes.length) : 1);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(peak, at + .008);
        gain.gain.setTargetAtTime(.00001, at + .018, .65 / partial ** .65);
        gain.gain.setValueAtTime(.00001, at + duration);
        oscillator.connect(gain); gain.connect(this.output!);
        oscillator.start(at); oscillator.stop(at + duration + .025);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
        this.voices.push(oscillator);
      });
    });
    await new Promise<void>(resolve => {
      this.resolvePlay = resolve;
      const end = (together ? 0 : Math.max(0, notes.length - 1) * spacing) + duration + .15;
      this.timer = setTimeout(() => { this.voices = []; this.resolvePlay = null; resolve(); }, end * 1000);
    });
  }
  stopPlayback() {
    this.playback++;
    clearTimeout(this.timer);
    this.voices.forEach(voice => { try { voice.stop(); } catch { /* already ended */ } });
    this.voices = []; this.resolvePlay?.(); this.resolvePlay = null;
  }
  dispose() { this.stopMic(); this.stopPlayback(); this.output?.disconnect(); this.output = null; void this.context?.close(); this.context = null; }
}
