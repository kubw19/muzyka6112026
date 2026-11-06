import { describe, expect, it } from 'vitest';
import { NoteEvaluator } from './evaluator';
import { frequency } from '../music';
const pitch = (midi = 60) => ({ hz: frequency(midi), confidence: .99, rms: .2 });
function hold(evaluator: NoteEvaluator, target = 60, exact = false, start = 0) {
  let result;
  for (let now = start; now <= start + 300; now += 50) result = evaluator.update(pitch(), target, exact, now);
  return result!;
}
describe('continuous note evaluation', () => {
  it('accepts only after 300 ms', () => {
    const e = new NoteEvaluator();
    expect(e.update(pitch(), 60, false, 0).accepted).toBe(false);
    for (const time of [50,100,150,200,250]) expect(e.update(pitch(), 60, false, time).accepted).toBe(false);
    expect(e.update(pitch(), 60, false, 300).accepted).toBe(true);
  });
  it('accepts another octave only in relaxed octave mode', () => {
    expect(hold(new NoteEvaluator(), 72, false).accepted).toBe(true);
    expect(hold(new NoteEvaluator(), 72, true).accepted).toBe(false);
  });
  it('resets on silence, wrong notes, uncertainty, playback and sample gaps', () => {
    for (const interruption of ['silence','wrong','uncertain','blocked','gap']) {
      const e = new NoteEvaluator();
      e.update(pitch(), 60, false, 0); e.update(pitch(), 60, false, 100);
      if (interruption === 'gap') { expect(e.update(pitch(), 60, false, 400).progress).toBe(0); continue; }
      e.update(interruption === 'silence' ? null : interruption === 'wrong' ? pitch(62) : interruption === 'uncertain' ? { ...pitch(), confidence: .4 } : pitch(), 60, false, 150, interruption === 'blocked');
      expect(e.update(pitch(), 60, false, 200).progress).toBe(0);
    }
  });
  it('resets the hold after acceptance and requires a new target', () => {
    const e = new NoteEvaluator();
    expect(hold(e).accepted).toBe(true);
    expect(e.update(pitch(), 62, false, 350).accepted).toBe(false);
    expect(e.update(pitch(62), 62, false, 400).progress).toBe(0);
    for (const time of [450,500,550,600,650]) e.update(pitch(62), 62, false, time);
    expect(e.update(pitch(62), 62, false, 700).accepted).toBe(true);
  });
  it('applies inclusive 100-cent tolerance and preserves sharp/flat direction', () => {
    const e = new NoteEvaluator();
    expect(e.update(pitch(60.99), 60, true, 0).cents).toBeCloseTo(99);
    expect(e.update(pitch(60.99), 60, true, 50).progress).toBeGreaterThan(0);
    expect(e.update(pitch(61.01), 60, true, 100).progress).toBe(0);
    expect(e.update(pitch(59.4), 60, false, 100).cents).toBeCloseTo(-60);
    expect(hold(new NoteEvaluator(), 61, true).accepted).toBe(true);
  });
  it('does not count the same held pitch as the next semitone note', () => {
    const e = new NoteEvaluator();
    expect(hold(e).accepted).toBe(true);
    for (let now = 350; now <= 1000; now += 50) {
      const reading = e.update(pitch(), 61, true, now);
      expect(reading.accepted).toBe(false);
      expect(reading.waitingForChange).toBe(true);
    }
    for (const time of [1050,1100,1150,1200,1250,1300]) e.update(pitch(61), 61, true, time);
    expect(e.update(pitch(61), 61, true, 1350).accepted).toBe(true);
  });
  it('permits a new attempt after a short release', () => {
    const e = new NoteEvaluator(); hold(e);
    e.update(null, 61, true, 350); e.update(null, 61, true, 500);
    expect(hold(e, 61, true, 550).accepted).toBe(true);
  });
});
