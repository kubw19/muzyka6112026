import { KEYS, type KeyId } from './music';
import { CLEFS, VOICES, type ClefId, type VoiceId } from './voices';
import { DEFAULT_INTERVALS, INTERVALS } from './intervals';
export type Settings = { keyId: KeyId; exactOctave: boolean; showNames: boolean; autoAdvance: boolean; showIntervals: boolean; chromaticNotes: boolean; voiceId: VoiceId; clefs: Record<VoiceId, ClefId>; intervals: number[] };
export const defaults: Settings = { keyId: 'C', autoAdvance: false, exactOctave: false, showNames: false, showIntervals: false, chromaticNotes: true, voiceId: 'soprano', clefs: { soprano: 'treble', alto: 'treble', tenor: 'bass', bass: 'bass' }, intervals: DEFAULT_INTERVALS };
export function readSettings(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem('prima-settings') ?? '{}');
    const selected = Array.isArray(value?.intervals) ? INTERVALS.map(i => i.semitones).filter(i => value.intervals.includes(i)) : [];
    const intervals = selected.length ? selected : [...DEFAULT_INTERVALS];
    const clefs = { ...defaults.clefs };
    for (const voice of VOICES) if (CLEFS.some(c => c.id === value?.clefs?.[voice.id])) clefs[voice.id] = value.clefs[voice.id];
    return {
      keyId: KEYS.some(key => key.id === value?.keyId) ? value.keyId : defaults.keyId,
      exactOctave: intervals.includes(12) || value?.exactOctave === true,
      showNames: typeof value?.showNames === 'boolean' ? value.showNames : false,
      showIntervals: value?.showIntervals === true,
      autoAdvance: value?.autoAdvance === true,
      chromaticNotes: value?.chromaticNotes !== false,
      voiceId: VOICES.some(v => v.id === value?.voiceId) ? value.voiceId : defaults.voiceId,
      clefs, intervals,
    };
  } catch { return defaults; }
}
export function saveSettings(settings: Settings) {
  try { localStorage.setItem('prima-settings', JSON.stringify(settings)); } catch { /* Exercise remains usable without storage. */ }
}
