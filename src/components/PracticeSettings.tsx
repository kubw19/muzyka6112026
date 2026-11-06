import { KEYS, type KeyId } from '../music';
import { CLEFS, VOICES, voiceFor, type VoiceId, type ClefId } from '../voices';
import { INTERVALS } from '../intervals';
import type { Settings } from '../settings';

export function PracticeSettings({ settings, onChange, onDisplayChange }: { settings: Settings; onChange: (settings: Settings) => void; onDisplayChange: (settings: Settings) => void }) {
  const voice = voiceFor(settings.voiceId);
  function toggleInterval(semitones: number) {
    const intervals = settings.intervals.includes(semitones) ? settings.intervals.filter(item => item !== semitones) : [...settings.intervals, semitones].sort((a, b) => a - b);
    if (!intervals.length) return;
    onChange({ ...settings, intervals, exactOctave: intervals.includes(12) || settings.exactOctave });
  }
  return <section className="settings-card"><span className="eyebrow">DOPASUJ ĆWICZENIE</span><h2>Twój punkt wyjścia</h2>
    <label className="field-label" htmlFor="voice">Głos</label><select id="voice" value={settings.voiceId} onChange={event => onChange({ ...settings, voiceId: event.target.value as VoiceId })}>{VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select>
    <p className="field-hint">Orientacyjny zakres: <strong>{voice.range}</strong>. Dopasuj głos do wygodnego rejestru.</p>
    <label className="field-label" htmlFor="clef">Klucz</label><select id="clef" value={settings.clefs[settings.voiceId]} onChange={event => onDisplayChange({ ...settings, clefs: { ...settings.clefs, [settings.voiceId]: event.target.value as ClefId } })}>{CLEFS.map(clef => <option key={clef.id} value={clef.id}>{clef.label}</option>)}</select>
    <p className="field-hint">Klucz zapamiętujemy osobno dla każdego głosu. Zmiana klucza nie zmienia brzmienia nut.</p>
    <label className="field-label" htmlFor="key">Tonacja</label><select id="key" value={settings.keyId} onChange={event => onChange({ ...settings, keyId: event.target.value as KeyId })}>{KEYS.map(key => <option key={key.id} value={key.id}>{key.label}</option>)}</select>
    <p className="field-hint">Melodie w zakresie wybranego głosu; opcja chromatyczna dodaje dźwięki spoza skali.</p>
    <fieldset className="interval-picker"><legend>Ćwiczone interwały</legend><p>Każdy skok melodii pochodzi z tego zestawu. Wybierz co najmniej jeden.</p><div className="interval-choices">{INTERVALS.map(interval => <label key={interval.semitones} className={`interval-choice ${settings.intervals.includes(interval.semitones) ? 'selected' : ''}`} title={`${interval.label} · ${interval.semitones} półt.`}><input type="checkbox" checked={settings.intervals.includes(interval.semitones)} disabled={settings.intervals.length === 1 && settings.intervals[0] === interval.semitones} onChange={() => toggleInterval(interval.semitones)} aria-label={interval.label}/><span>{interval.short}</span></label>)}</div><div className="interval-presets"><button type="button" onClick={() => onChange({ ...settings, intervals: [1, 2] })}>Sekundy</button><button type="button" onClick={() => onChange({ ...settings, intervals: [3, 4] })}>Tercje</button><button type="button" onClick={() => onChange({ ...settings, intervals: [5, 7] })}>Kwarty i kwinty</button><button type="button" onClick={() => onChange({ ...settings, intervals: INTERVALS.map(i => i.semitones), exactOctave: true })}>Wszystkie</button></div><p className="selected-intervals">{settings.intervals.map(item => INTERVALS.find(i => i.semitones === item)!.label).join(' · ')}</p></fieldset>
    <div className="setting-divider"/><label className="toggle-row"><span><strong>Dokładna oktawa</strong><small>{settings.intervals.includes(12) ? 'Wymagana przy ćwiczeniu oktaw' : 'Śpiewaj w zapisanej oktawie'}</small></span><input type="checkbox" checked={settings.exactOctave} disabled={settings.intervals.includes(12)} onChange={event => onChange({ ...settings, exactOctave: event.target.checked })}/></label>
    <label className="toggle-row"><span><strong>Nazwy dźwięków</strong><small>Podpowiedzi pod pięciolinią</small></span><input type="checkbox" checked={settings.showNames} onChange={event => onDisplayChange({ ...settings, showNames: event.target.checked })}/></label>
    <label className="toggle-row"><span><strong>Dźwięki chromatyczne</strong><small>Rzadko: 1–2 dźwięki spoza tonacji</small></span><input type="checkbox" checked={settings.chromaticNotes} onChange={event => onChange({ ...settings, chromaticNotes: event.target.checked })}/></label>
    <label className="toggle-row"><span><strong>Automatycznie dalej</strong><small>Kolejna melodia 1,2 s po ukończeniu</small></span><input type="checkbox" checked={settings.autoAdvance} onChange={event => onDisplayChange({ ...settings, autoAdvance: event.target.checked })}/></label>
    <div className="range-note">Tolerancja: ±100 centów (pół tonu). {settings.exactOctave ? 'Liczy się również dokładna oktawa.' : 'Możesz śpiewać w wygodnej oktawie.'}</div>
  </section>;
}
