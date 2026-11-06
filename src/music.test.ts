import { describe, expect, it } from 'vitest';
import { generateMelody, intervalNotes, tonicTriad, KEYS, scale, voiceScale } from './music';
import { VOICES } from './voices';
import { DEFAULT_INTERVALS, INTERVALS } from './intervals';
describe('melodies', () => {
  it('places a major tonic triad in every key and vocal range', () => {
    for (const key of KEYS) for (const voice of VOICES) {
      const chord = tonicTriad(key.id, voice.id);
      expect(chord.map(midi => midi - chord[0])).toEqual([0, 4, 7]);
      expect((chord[0] - key.root) % 12).toBeCloseTo(0);
      expect(chord[0]).toBeGreaterThanOrEqual(voice.low);
      expect(chord[2]).toBeLessThanOrEqual(voice.high);
    }
  });
  for (const key of KEYS) it(`${key.label}: four diatonic notes with selected intervals`, () => {
    const degrees = scale(key.id);
    expect(degrees.map(n => n.midi - key.root)).toEqual([0,2,4,5,7]);
    for (let trial = 0; trial < 100; trial++) {
      const melody = generateMelody(key.id);
      expect(melody).toHaveLength(4);
      melody.forEach((note, i) => {
        expect(voiceScale(key.id, 'soprano')).toContainEqual(note);
        expect(note.key).toMatch(/^[a-g]\/[3-5]$/);
        if (i) expect(DEFAULT_INTERVALS).toContain(Math.abs(note.midi - melody[i - 1].midi));
      });
    }
  });
  for (const voice of VOICES) for (const key of KEYS) it(`${voice.label}, ${key.label}: every interval can be practiced alone within range`, () => {
    for (const interval of INTERVALS) for (let trial = 0; trial < 10; trial++) {
      const melody = generateMelody(key.id, voice.id, [interval.semitones]);
      for (const [i, note] of melody.entries()) {
        expect(note.midi).toBeGreaterThanOrEqual(voice.low);
        expect(note.midi).toBeLessThanOrEqual(voice.high);
        if (i) expect(Math.abs(note.midi - melody[i - 1].midi)).toBe(interval.semitones);
      }
    }
  });
  it('varies intervals and avoids immediately returning when alternatives exist', () => {
    const melody = generateMelody('C', 'soprano', DEFAULT_INTERVALS, () => .5);
    const jumps = melody.slice(1).map((note, i) => Math.abs(note.midi - melody[i].midi));
    expect(new Set(jumps).size).toBe(3);
    expect(melody[0].midi).not.toBe(melody[2].midi);
    expect(melody[1].midi).not.toBe(melody[3].midi);
  });
  it('fails clearly for an empty or impossible interval set', () => {
    expect(() => generateMelody('C', 'bass', [])).toThrow();
    expect(() => generateMelody('C', 'bass', [30])).toThrow();
  });
  it('library pairs preserve pitch, spelling, direction and voice range', () => {
    for (const voice of VOICES) for (const interval of INTERVALS) {
      const up = intervalNotes(interval.semitones, voice.id);
      const down = intervalNotes(interval.semitones, voice.id, true);
      expect(up[1].midi - up[0].midi).toBe(interval.semitones);
      expect(down).toEqual([...up].reverse());
      for (const note of up) { expect(note.midi).toBeGreaterThanOrEqual(voice.low); expect(note.midi).toBeLessThanOrEqual(voice.high); }
    }
    expect(intervalNotes(1, 'bass')[1]).toMatchObject({ key: 'd/3', name: 'Des3', accidental: 'b' });
    expect(intervalNotes(6, 'soprano')[1]).toMatchObject({ key: 'f/4', name: 'Fis4', accidental: '#' });
  });
  it('spells notes across octave boundaries correctly', () => {
    expect(scale('G').map(n => n.key)).toEqual(['g/4','a/4','b/4','c/5','d/5']);
    expect(scale('Cb')[0]).toMatchObject({ midi: 59, key: 'c/4', name: 'Ces4' });
    expect(scale('Gb')[3]).toMatchObject({ midi: 71, key: 'c/5', name: 'Ces5' });
  });
});
