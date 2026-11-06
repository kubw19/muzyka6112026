import { describe, expect, it } from 'vitest';
import { detectPitch } from './pitch';
import { frequency } from '../music';

function signal(hz: number, sampleRate: number, harmonic = false, detune = 0) {
  return Float32Array.from({ length: 4096 }, (_, i) => {
    const phase = 2 * Math.PI * hz * 2 ** (detune / 1200) * i / sampleRate;
    return harmonic ? .09 * Math.sin(phase) + .2 * Math.sin(2 * phase) + .08 * Math.sin(3 * phase) : .3 * Math.sin(phase);
  });
}
describe('YIN', () => {
  for (const sampleRate of [44100, 48000]) {
    for (const midi of [36, 40, 48, 60, 67, 69, 76, 84]) {
      it(`detects MIDI ${midi} at ${sampleRate} Hz`, () => {
        const hz = frequency(midi);
        const result = detectPitch(signal(hz, sampleRate), sampleRate);
        expect(result).not.toBeNull();
        expect(Math.abs(1200 * Math.log2(result!.hz / hz))).toBeLessThan(5);
      });
    }
  }
  it('retains the fundamental with stronger second harmonic', () => {
    const result = detectPitch(signal(196, 48000, true), 48000);
    expect(result).not.toBeNull();
    expect(Math.abs(1200 * Math.log2(result!.hz / 196))).toBeLessThan(5);
  });
  it('measures detuning instead of snapping to a note', () => {
    const result = detectPitch(signal(440, 48000, false, 37), 48000)!;
    expect(1200 * Math.log2(result.hz / 440)).toBeCloseTo(37, 0);
  });
  it('ignores silence and low-level input', () => {
    expect(detectPitch(new Float32Array(4096), 48000)).toBeNull();
    expect(detectPitch(signal(440, 48000).map(x => x * .001), 48000)).toBeNull();
    expect(detectPitch(new Float32Array(4096).fill(.2), 48000)).toBeNull();
  });
  it('rejects deterministic broadband noise', () => {
    let state = 17;
    const noise = Float32Array.from({ length: 4096 }, () => { state = (state * 1664525 + 1013904223) >>> 0; return (state / 2 ** 32 - .5) * .5; });
    expect(detectPitch(noise, 48000)).toBeNull();
  });
});
