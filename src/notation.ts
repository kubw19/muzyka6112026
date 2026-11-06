import { KEYS, spellNote, voiceScale, type KeyId, type MusicalNote } from './music';
import { voiceFor, type VoiceId } from './voices';

const letters = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
const majorSteps = [0, 2, 4, 5, 7, 9, 11];
export type AccidentalSign = '#' | 'b' | 'n';
export function keySignature(keyId: KeyId): Record<string, AccidentalSign> {
  const key = KEYS.find(item => item.id === keyId)!;
  const start = letters.indexOf(key.letters[0]);
  return Object.fromEntries(majorSteps.map((step, i) => {
    const letter = letters[(start + i) % 7];
    return [letter, (spellNote(key.root + step, letter).accidental ?? 'n') as AccidentalSign];
  }));
}
/** Accidental scope is a written pitch in this single measure; the key applies in every octave. */
export function writtenAccidentals(notes: MusicalNote[], keyId: KeyId, explicit = false): (AccidentalSign | null)[] {
  const signature = keySignature(keyId);
  const measure = new Map<string, AccidentalSign>();
  return notes.map(note => {
    const actual = (note.accidental ?? 'n') as AccidentalSign;
    const previous = measure.get(note.key) ?? signature[note.key[0]];
    measure.set(note.key, actual);
    return explicit || previous !== actual ? actual : null;
  });
}
const rank = (note: MusicalNote) => Number(note.key.split('/')[1]) * 7 + letters.indexOf(note.key[0]);
export function identifyWrittenInterval(notes: MusicalNote[]) {
  const number = Math.abs(rank(notes[1]) - rank(notes[0])) + 1;
  const semitones = Math.abs(notes[1].midi - notes[0].midi);
  const base = [0, 0, 2, 4, 5, 7, 9, 11, 12][number];
  if (base === undefined) throw new Error('Obsługiwane są interwały proste.');
  const delta = semitones - base;
  const perfect = [1, 4, 5, 8].includes(number);
  const quality = delta === 0 ? (perfect ? 'cz' : 'w') : delta === -1 ? (perfect ? 'zm' : 'm') : delta === 1 ? 'zw' : delta === -2 && !perfect ? 'zm' : null;
  if (!quality) throw new Error('Interwał wymaga podwójnej zmiany.');
  const noun = ['', 'Pryma', 'Sekunda', 'Tercja', 'Kwarta', 'Kwinta', 'Seksta', 'Septyma', 'Oktawa'][number];
  const adjective = { cz: 'czysta', w: 'wielka', m: 'mała', zw: 'zwiększona', zm: 'zmniejszona' }[quality];
  return { id: `${number}${quality}`, label: `${noun} ${adjective}`, number, semitones };
}
export type IntervalQuestion = { notes: MusicalNote[]; answer: ReturnType<typeof identifyWrittenInterval> };
export function generateIntervalQuestion(keyId: KeyId, voiceId: VoiceId, chromatic = true, random = Math.random): IntervalQuestion {
  const scale = voiceScale(keyId, voiceId);
  const voice = voiceFor(voiceId);
  const diatonic: IntervalQuestion[] = [], altered: IntervalQuestion[] = [];
  function add(notes: MusicalNote[], destination: IntervalQuestion[]) {
    if (notes.some(note => note.midi < voice.low || note.midi > voice.high)) return;
    const number = Math.abs(rank(notes[1]) - rank(notes[0])) + 1;
    const distance = Math.abs(notes[1].midi - notes[0].midi);
    if (number < 2 || number > 8 || distance < 1 || distance > 12) return;
    try { destination.push({ notes, answer: identifyWrittenInterval(notes) }); } catch { /* Outside the single-alteration exercise. */ }
  }
  for (const first of scale) for (const second of scale) {
    add([first, second], diatonic);
    if (!chromatic) continue;
    for (const index of [0, 1]) for (const change of [-1, 1]) {
      const pair = [first, second];
      const original = pair[index];
      const modified = spellNote(original.midi + change, original.key[0], original.degree);
      // spellNote only supports ordinary sharp / flat / natural; no double accidentals.
      const originalAlt = original.accidental === '#' ? 1 : original.accidental === 'b' ? -1 : 0;
      if (Math.abs(originalAlt + change) > 1) continue;
      pair[index] = modified;
      add(pair, altered);
    }
  }
  const pool = chromatic && random() >= .25 && altered.length ? altered : diatonic;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
export function quizChoices(question: IntervalQuestion) {
  const samples: MusicalNote[][] = [];
  for (const number of [2, 3, 4, 5, 6, 7, 8]) {
    const letter = letters[(number - 1) % 7];
    const octave = number === 8 ? 5 : 4;
    const naturalMidi = ({ c: 60, d: 62, e: 64, f: 65, g: 67, a: 69, b: 71 } as Record<string, number>)[letter] + (octave - 4) * 12;
    for (const change of [-1, 0, 1]) if (naturalMidi + change - 60 > 0 && naturalMidi + change - 60 <= 12) samples.push([spellNote(60, 'c'), spellNote(naturalMidi + change, letter)]);
  }
  const all = samples.map(identifyWrittenInterval);
  const alternatives = all.filter(choice => choice.id !== question.answer.id).sort((a, b) =>
    (Math.abs(a.number - question.answer.number) * 2 + Math.abs(a.semitones - question.answer.semitones)) -
    (Math.abs(b.number - question.answer.number) * 2 + Math.abs(b.semitones - question.answer.semitones)));
  return [question.answer, ...alternatives.slice(0, 5)].sort((a, b) => a.number - b.number || a.semitones - b.semitones);
}
