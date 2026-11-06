import { useMemo, useState } from 'react';
import { INTERVALS, INTERVAL_SOURCE, VOICE_SOURCE, intervalFor } from '../intervals';
import { intervalNotes } from '../music';
import { CLEFS, VOICES, type VoiceId, type ClefId } from '../voices';
import type { Settings } from '../settings';
import { Score } from './Score';

export function IntervalLibrary({ settings, onSettings, onPlay, onStop, playing, onPractice }: {
  settings: Settings; onSettings: (settings: Settings) => void;
  onPlay: (notes: number[], together: boolean) => void; onStop: () => void; playing: boolean;
  onPractice: (semitones: number) => void;
}) {
  const [selected, setSelected] = useState(7);
  const [descending, setDescending] = useState(false);
  const item = intervalFor(selected);
  const notes = useMemo(() => intervalNotes(selected, settings.voiceId, descending), [selected, settings.voiceId, descending]);
  function changeInterval(semitones: number) { onStop(); setSelected(semitones); }
  return <>
    <div className="page-heading"><div><div className="eyebrow">MODUŁ 02 · BIBLIOTEKA INTERWAŁÓW</div><h1>Usłysz odległość<span>.</span></h1><p>Dwa dźwięki. Jeden charakter. Poznaj skoki, które tworzą melodie.</p></div><span className="library-count">12 interwałów<br/><strong>od półtonu do oktawy</strong></span></div>
    <div className="library-layout">
      <section className="interval-list-card" aria-label="Wybierz interwał"><span className="eyebrow">ODLEGŁOŚCI</span><div className="interval-list">{INTERVALS.map(interval => <button key={interval.semitones} type="button" className={`interval-list-item ${selected === interval.semitones ? 'selected' : ''}`} aria-pressed={selected === interval.semitones} onClick={() => changeInterval(interval.semitones)}><span className="interval-symbol">{interval.short}</span><span><strong>{interval.label}</strong><small>{interval.semitones} {interval.semitones === 1 ? 'półton' : interval.semitones < 5 ? 'półtony' : 'półtonów'}</small></span><span className="interval-arrow">›</span></button>)}</div></section>
      <section className="interval-detail practice-card" aria-labelledby="interval-title"><div className="card-heading"><div><span className="eyebrow">POSŁUCHAJ I ZAPAMIĘTAJ</span><h2 id="interval-title">{item.label}</h2></div><span className="interval-large-symbol">{item.short}</span></div>
        <div className="library-controls"><label>Głos<select aria-label="Głos w bibliotece" value={settings.voiceId} onChange={event => { onStop(); onSettings({ ...settings, voiceId: event.target.value as VoiceId }); }}>{VOICES.map(voice => <option key={voice.id} value={voice.id}>{voice.label}</option>)}</select></label><label>Klucz<select aria-label="Klucz w bibliotece" value={settings.clefs[settings.voiceId]} onChange={event => { onStop(); onSettings({ ...settings, clefs: { ...settings.clefs, [settings.voiceId]: event.target.value as ClefId } }); }}>{CLEFS.map(clef => <option key={clef.id} value={clef.id}>{clef.label}</option>)}</select></label></div>
        <div className="direction-switch" aria-label="Kierunek interwału"><button aria-pressed={!descending} onClick={() => { onStop(); setDescending(false); }}>↗ W górę</button><button aria-pressed={descending} onClick={() => { onStop(); setDescending(true); }}>↘ W dół</button></div>
        <Score notes={notes} keyId="C" clefId={settings.clefs[settings.voiceId]} interval/>
        <div className="interval-note-caption">{notes[0].name} <span>{descending ? '↘' : '↗'}</span> {notes[1].name}<small>{item.semitones} {item.semitones === 1 ? 'półton' : item.semitones < 5 ? 'półtony' : 'półtonów'}</small></div>
        <div className="library-audio-actions"><button className="button primary" onClick={() => onPlay(notes.map(n => n.midi), false)}>▷ Odsłuchaj kolejno</button><button className="button secondary" onClick={() => onPlay(notes.map(n => n.midi), true)}>♫ Odsłuchaj razem</button>{playing && <button className="button ghost" onClick={onStop}>□ Zatrzymaj</button>}</div>
        <p className="library-playing" role="status">{playing ? 'Trwa odsłuch interwału…' : 'Odsłuch działa także offline. Dźwięki są generowane lokalnie.'}</p>
        <div className="interval-tip"><span className="eyebrow">JAK GO USŁYSZEĆ</span><p>{item.tip}</p></div>
        <div className="song-association"><span className="eyebrow">SKOJARZENIE Z MELODII</span><h3>{descending ? item.down : item.up}</h3><p>Skojarzenie dotyczy {descending ? 'kierunku w dół' : 'kierunku w górę'}. Odsłuch powyżej odtwarza sam interwał, nie nagranie utworu. Wybierz wersję melodii, którą dobrze znasz.</p><a href={INTERVAL_SOURCE} target="_blank" rel="noreferrer">Więcej przykładów piosenek w EarMaster ↗</a></div>
        <button className="button secondary practice-interval" onClick={() => onPractice(item.semitones)}>Ćwicz ten interwał w melodii →</button>
      </section>
    </div>
    <section className="learning-notes"><div><span className="eyebrow">ĆWICZ ŚWIADOMIE</span><h3>Skojarzenie to początek.</h3><p>Zaśpiewaj dwa dźwięki, zrób chwilę przerwy i odtwórz je z pamięci. Porównuj podobne odległości, np. tercję małą i wielką. Ćwicz osobno w górę i w dół, a potem zmieniaj tonację w module śpiewania.</p></div><div><span className="eyebrow">ZAKRES I ZAPIS</span><h3>Głos wybiera brzmienie, klucz — zapis.</h3><p>Zakresy są orientacyjne; wygodny zakres konkretnego głosu może być węższy. Zwykły klucz wiolinowy i basowy pokazują wysokość brzmiącą. Wiolinowy z „8” pod spodem brzmi oktawę niżej od zapisu. Klucz altowy lub tenorowy nie oznacza automatycznie rodzaju głosu.</p><div className="source-links"><a href={VOICE_SOURCE} target="_blank" rel="noreferrer">Zakresy głosów — Yale Library ↗</a><a href={INTERVAL_SOURCE} target="_blank" rel="noreferrer">Skojarzenia interwałów — EarMaster ↗</a></div></div></section>
  </>;
}
