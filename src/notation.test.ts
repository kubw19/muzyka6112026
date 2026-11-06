import { describe, expect, it } from 'vitest';
import { KEYS, spellNote, voiceScale } from './music';
import { VOICES } from './voices';
import { generateIntervalQuestion, identifyWrittenInterval, keySignature, quizChoices, writtenAccidentals } from './notation';

describe('accidentals and written intervals', () => {
  it('applies key signatures in every octave and tracks accidentals within the measure', () => {
    expect(keySignature('G').f).toBe('#'); expect(keySignature('F').b).toBe('b');
    const notes = [spellNote(66, 'f'), spellNote(65, 'f'), spellNote(65, 'f'), spellNote(66, 'f'), spellNote(78, 'f')];
    expect(writtenAccidentals(notes, 'G')).toEqual([null, 'n', null, '#', null]);
    expect(writtenAccidentals([spellNote(70, 'b'), spellNote(71, 'b')], 'F')).toEqual([null, 'n']);
  });
  it('can explicitly display every sharp, flat and natural without changing pitch', () => {
    const notes = [spellNote(60, 'c'), spellNote(66, 'f'), spellNote(70, 'b')];
    expect(writtenAccidentals(notes, 'C', true)).toEqual(['n', '#', 'b']);
    expect(notes.map(note => note.midi)).toEqual([60, 66, 70]);
  });
  it('distinguishes enharmonic intervals by spelling', () => {
    expect(identifyWrittenInterval([spellNote(60, 'c'), spellNote(66, 'f')])).toMatchObject({ id: '4zw', semitones: 6 });
    expect(identifyWrittenInterval([spellNote(60, 'c'), spellNote(66, 'g')])).toMatchObject({ id: '5zm', semitones: 6 });
    expect(identifyWrittenInterval([spellNote(60, 'c'), spellNote(63, 'd')]).id).toBe('2zw');
    expect(identifyWrittenInterval([spellNote(63, 'e'), spellNote(60, 'c')]).id).toBe('3m');
  });
  for (const key of KEYS) for (const voice of VOICES) it(`${key.label}, ${voice.label}: quiz is bounded and contains the correct choice exactly once`, () => {
    for (let i = 0; i < 20; i++) {
      const question = generateIntervalQuestion(key.id, voice.id);
      expect(question.answer).toEqual(identifyWrittenInterval(question.notes));
      expect(quizChoices(question).filter(choice => choice.id === question.answer.id)).toHaveLength(1);
      expect(new Set(quizChoices(question).map(choice => choice.id)).size).toBe(6);
      question.notes.forEach(note => { expect(note.midi).toBeGreaterThanOrEqual(voice.low); expect(note.midi).toBeLessThanOrEqual(voice.high); });
      expect(question.answer.semitones).toBeGreaterThan(0); expect(question.answer.semitones).toBeLessThanOrEqual(12);
    }
    const diatonic = generateIntervalQuestion(key.id, voice.id, false);
    for (const note of diatonic.notes) expect(voiceScale(key.id, voice.id)).toContainEqual(note);
    expect(writtenAccidentals(diatonic.notes, key.id)).toEqual([null, null]);
  });
  it('actually generates sharps, flats and cancellations when chromatic mode is enabled', () => {
    const signs = new Set();
    let state = 51;
    const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 2 ** 32; };
    for (const key of ['G', 'F'] as const) for (let i = 0; i < 150; i++) {
      const question = generateIntervalQuestion(key, 'alto', true, random);
      writtenAccidentals(question.notes, key).filter(Boolean).forEach(sign => signs.add(sign));
    }
    expect(signs.has('#')).toBe(true); expect(signs.has('b')).toBe(true); expect(signs.has('n')).toBe(true);
  });
});
