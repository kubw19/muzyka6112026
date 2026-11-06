export const CLEFS = [
  { id: 'treble', label: 'Wiolinowy', vex: 'treble', annotation: undefined, shift: 0 },
  { id: 'bass', label: 'Basowy', vex: 'bass', annotation: undefined, shift: 0 },
  { id: 'alto', label: 'Altowy (C)', vex: 'alto', annotation: undefined, shift: 0 },
  { id: 'tenor', label: 'Tenorowy (C)', vex: 'tenor', annotation: undefined, shift: 0 },
  { id: 'treble8vb', label: 'Wiolinowy oktawowy (8 pod kluczem)', vex: 'treble', annotation: '8vb', shift: 12 },
] as const;
export type ClefId = typeof CLEFS[number]['id'];
// Approximate choral working ranges, not a classification of the user's voice.
export const VOICES = [
  { id: 'soprano', label: 'Sopran', low: 60, high: 81, range: 'C4–A5', clef: 'treble', demoRoot: 60 },
  { id: 'alto', label: 'Alt', low: 53, high: 74, range: 'F3–D5', clef: 'treble', demoRoot: 60 },
  { id: 'tenor', label: 'Tenor', low: 47, high: 67, range: 'H2–G4', clef: 'bass', demoRoot: 48 },
  { id: 'bass', label: 'Bas', low: 40, high: 60, range: 'E2–C4', clef: 'bass', demoRoot: 48 },
] as const;
export type VoiceId = typeof VOICES[number]['id'];
export const voiceFor = (id: VoiceId) => VOICES.find(voice => voice.id === id)!;
export const clefFor = (id: ClefId) => CLEFS.find(clef => clef.id === id)!;
