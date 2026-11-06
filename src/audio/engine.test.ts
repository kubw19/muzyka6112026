import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './engine';
import { frequency } from '../music';

const oscillators: { frequency: { value: number }; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = [];
const envelopes: { linearRampToValueAtTime: ReturnType<typeof vi.fn>; setTargetAtTime: ReturnType<typeof vi.fn> }[] = [];
const compressor = () => ({ threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 0 }, attack: { value: 0 }, release: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() });
beforeEach(() => {
  vi.useFakeTimers(); oscillators.length = 0; envelopes.length = 0;
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('AudioContext', class {
    state = 'running'; currentTime = 10; sampleRate = 48000; destination = {};
    createDynamicsCompressor = compressor;
    close = vi.fn(async () => {});
    createOscillator() {
      const oscillator = { type: '', frequency: { value: 0 }, start: vi.fn(), stop: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), onended: null };
      oscillators.push(oscillator); return oscillator;
    }
    createGain() {
      const gain = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() };
      envelopes.push(gain); return { gain, connect: vi.fn(), disconnect: vi.fn() };
    }
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('local piano synthesis', () => {
  it('synthesizes seven decaying partials and leaves time for a long tail', async () => {
    const engine = new AudioEngine();
    const playback = engine.play([60, 62]); await Promise.resolve();
    expect(oscillators).toHaveLength(14);
    expect(oscillators[0].frequency.value).toBeCloseTo(frequency(60));
    expect(oscillators[7].frequency.value).toBeCloseTo(frequency(62));
    expect(oscillators[7].start.mock.calls[0][0] - oscillators[0].start.mock.calls[0][0]).toBeCloseTo(1.05);
    expect(oscillators[0].stop.mock.calls[0][0] - oscillators[0].start.mock.calls[0][0]).toBeGreaterThan(1.8);
    expect(envelopes[0].linearRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(.34);
    expect(envelopes[6].setTargetAtTime.mock.calls[0][2]).toBeLessThan(envelopes[0].setTargetAtTime.mock.calls[0][2]);
    await vi.advanceTimersByTimeAsync(4000); await playback; engine.dispose();
  });
  it('plays a tonic chord simultaneously with shared headroom and a longer decay', async () => {
    const engine = new AudioEngine(); const playback = engine.play([48, 52, 55], true); await Promise.resolve();
    expect(oscillators).toHaveLength(21);
    expect(new Set(oscillators.map(oscillator => oscillator.start.mock.calls[0][0])).size).toBe(1);
    expect(envelopes[0].linearRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(.34 / Math.sqrt(3));
    expect(oscillators[0].stop.mock.calls[0][0] - oscillators[0].start.mock.calls[0][0]).toBeGreaterThan(2.2);
    await vi.advanceTimersByTimeAsync(3000); await playback; engine.dispose();
  });
  it('stops all partials and resolves interrupted playback', async () => {
    const engine = new AudioEngine(); const playback = engine.play([60]); await Promise.resolve();
    engine.stopPlayback(); await playback;
    expect(oscillators.every(oscillator => oscillator.stop.mock.calls.length === 2)).toBe(true);
    engine.dispose();
  });
});
