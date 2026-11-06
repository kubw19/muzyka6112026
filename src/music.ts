import { voiceFor, type VoiceId } from './voices';
import { DEFAULT_INTERVALS } from './intervals';
export type MusicalNote = { midi: number; key: string; name: string; degree: number; accidental?: string };
export const KEYS = [
  { id: 'C', label: 'C-dur', root: 60, letters: ['c','d','e','f','g'], names: ['C','D','E','F','G'] },
  { id: 'G', label: 'G-dur', root: 67, letters: ['g','a','b','c','d'], names: ['G','A','H','C','D'] },
  { id: 'D', label: 'D-dur', root: 62, letters: ['d','e','f','g','a'], names: ['D','E','Fis','G','A'] },
  { id: 'A', label: 'A-dur', root: 69, letters: ['a','b','c','d','e'], names: ['A','H','Cis','D','E'] },
  { id: 'E', label: 'E-dur', root: 64, letters: ['e','f','g','a','b'], names: ['E','Fis','Gis','A','H'] },
  { id: 'B', label: 'H-dur', root: 71, letters: ['b','c','d','e','f'], names: ['H','Cis','Dis','E','Fis'] },
  { id: 'F#', label: 'Fis-dur', root: 66, letters: ['f','g','a','b','c'], names: ['Fis','Gis','Ais','H','Cis'] },
  { id: 'F', label: 'F-dur', root: 65, letters: ['f','g','a','b','c'], names: ['F','G','A','B','C'] },
  { id: 'Bb', label: 'B-dur', root: 70, letters: ['b','c','d','e','f'], names: ['B','C','D','Es','F'] },
  { id: 'Eb', label: 'Es-dur', root: 63, letters: ['e','f','g','a','b'], names: ['Es','F','G','As','B'] },
  { id: 'Ab', label: 'As-dur', root: 68, letters: ['a','b','c','d','e'], names: ['As','B','C','Des','Es'] },
  { id: 'Db', label: 'Des-dur', root: 61, letters: ['d','e','f','g','a'], names: ['Des','Es','F','Ges','As'] },
  { id: 'Gb', label: 'Ges-dur', root: 66, letters: ['g','a','b','c','d'], names: ['Ges','As','B','Ces','Des'] },
  { id: 'Cb', label: 'Ces-dur', root: 59, letters: ['c','d','e','f','g'], names: ['Ces','Des','Es','Fes','Ges'] },
  { id: 'C#', label: 'Cis-dur', root: 61, letters: ['c','d','e','f','g'], names: ['Cis','Dis','Eis','Fis','Gis'] },
] as const;
export type KeyId = typeof KEYS[number]['id'];
const intervals = [0, 2, 4, 5, 7];
const naturals: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
export function scale(keyId: KeyId): MusicalNote[] {
  const key = KEYS.find(k => k.id === keyId)!;
  return intervals.map((step, degree) => {
    const midi = key.root + step;
    const letter = key.letters[degree];
    // Written octave follows the letter (e.g. Ces4 sounds as H3).
    const octave = Math.round((midi - naturals[letter]) / 12) - 1;
    return { midi, degree, key: `${letter}/${octave}`, name: `${key.names[degree]}${octave}` };
  });
}
const letters = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
const naturalNames = ['C', 'D', 'E', 'F', 'G', 'A', 'H'];
const sharpNames = ['Cis', 'Dis', 'Eis', 'Fis', 'Gis', 'Ais', 'His'];
const flatNames = ['Ces', 'Des', 'Es', 'Fes', 'Ges', 'As', 'B'];
export function spellNote(midi: number, letter: string, degree = 0): MusicalNote {
  const octave = Math.round((midi - naturals[letter]) / 12) - 1;
  const alteration = midi - ((octave + 1) * 12 + naturals[letter]);
  const index = letters.indexOf(letter);
  const name = (alteration < 0 ? flatNames : alteration > 0 ? sharpNames : naturalNames)[index];
  return { midi, key: `${letter}/${octave}`, name: `${name}${octave}`, degree, accidental: alteration < 0 ? 'b' : alteration > 0 ? '#' : undefined };
}
/** All diatonic notes in the selected sounding vocal range. */
export function voiceScale(keyId: KeyId, voiceId: VoiceId): MusicalNote[] {
  const key = KEYS.find(item => item.id === keyId)!;
  const voice = voiceFor(voiceId);
  const firstLetter = letters.indexOf(key.letters[0]);
  const result: MusicalNote[] = [];
  for (let octave = -3; octave <= 2; octave++) {
    [0, 2, 4, 5, 7, 9, 11].forEach((step, degree) => {
      const midi = key.root + octave * 12 + step;
      if (midi >= voice.low && midi <= voice.high) result.push(spellNote(midi, letters[(firstLetter + degree) % 7], degree));
    });
  }
  return result.sort((a, b) => a.midi - b.midi);
}
export function generateMelody(keyId: KeyId, voiceId: VoiceId = 'soprano', allowed: readonly number[] = DEFAULT_INTERVALS, random = Math.random): MusicalNote[] {
  const notes = voiceScale(keyId, voiceId);
  const neighbors = (note: MusicalNote) => notes.filter(next => allowed.includes(Math.abs(next.midi - note.midi)) && next.midi !== note.midi);
  const starts = notes.filter(note => neighbors(note).length);
  if (!starts.length) throw new Error('Nie ma możliwej melodii dla wybranych interwałów i zakresu.');
  const pick = (items: MusicalNote[]) => items[Math.min(items.length - 1, Math.floor(random() * items.length))];
  const melody = [pick(starts)];
  const usedIntervals = new Set<number>();
  while (melody.length < 4) {
    const previous = melody[melody.length - 1];
    let options = neighbors(previous);
    const fresh = options.filter(next => !usedIntervals.has(Math.abs(next.midi - previous.midi)));
    if (fresh.length) options = fresh;
    const withoutReturn = options.filter(next => next.midi !== melody[melody.length - 2]?.midi);
    if (withoutReturn.length) options = withoutReturn;
    const next = pick(options);
    usedIntervals.add(Math.abs(next.midi - previous.midi));
    melody.push(next);
  }
  return melody;
}
export function intervalNotes(semitones: number, voiceId: VoiceId, descending = false): MusicalNote[] {
  const root = voiceFor(voiceId).demoRoot;
  const upperLetters = ['c', 'd', 'd', 'e', 'e', 'f', 'f', 'g', 'a', 'a', 'b', 'b', 'c'];
  const pair = [spellNote(root, 'c'), spellNote(root + semitones, upperLetters[semitones])];
  return descending ? pair.reverse() : pair;
}
/** Root-position tonic triad, placed as close as possible to the voice's center. */
export function tonicTriad(keyId: KeyId, voiceId: VoiceId): number[] {
  const key = KEYS.find(item => item.id === keyId)!;
  const voice = voiceFor(voiceId);
  const candidates = Array.from({ length: 7 }, (_, i) => key.root + (i - 4) * 12)
    .filter(root => root >= voice.low && root + 7 <= voice.high);
  const middle = (voice.low + voice.high) / 2;
  const root = candidates.sort((a, b) => Math.abs(a + 4 - middle) - Math.abs(b + 4 - middle))[0];
  if (root === undefined) throw new Error('Brak trójdźwięku w zakresie głosu.');
  return [root, root + 4, root + 7];
}
export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export const midiFromFrequency = (hz: number) => 69 + 12 * Math.log2(hz / 440);
export function centsFromTarget(hz: number, targetMidi: number, exactOctave: boolean): number {
  const cents = 1200 * Math.log2(hz / frequency(targetMidi));
  return exactOctave ? cents : ((cents + 600) % 1200 + 1200) % 1200 - 600;
}
export function detectedName(hz: number) {
  const midi = Math.round(midiFromFrequency(hz));
  const names = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'];
  return `${names[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}
