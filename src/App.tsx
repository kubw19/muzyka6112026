import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { AudioEngine } from './audio/engine';
import { NoteEvaluator, type Reading } from './audio/evaluator';
import type { Pitch } from './audio/pitch';
import { detectedName, generateMelody, tonicTriad, KEYS } from './music';
import { Score } from './components/Score';
import { readSettings, saveSettings, type Settings } from './settings';
import { voiceFor, clefFor } from './voices';
import { intervalFor } from './intervals';
import { PracticeSettings } from './components/PracticeSettings';
import { IntervalLibrary } from './components/IntervalLibrary';
import { IntervalReference } from './components/IntervalReference';
import { IntervalQuiz } from './components/IntervalQuiz';

type Mode = 'idle' | 'requesting' | 'listening' | 'playing' | 'complete';
const emptyReading: Reading = { cents: null, progress: 0, accepted: false };
function Icon({ type, size = 20 }: { type: 'play' | 'mic' | 'next' | 'stop' | 'note' | 'check'; size?: number }) {
  const paths = {
    play: <path d="m9 5 11 7-11 7z"/>,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></>,
    next: <><path d="M5 12h14m-5-5 5 5-5 5M5 4v4h4M5 8a8 8 0 0 1 13-3"/></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="2"/>,
    note: <><path d="M10 17V5l10-2v12M10 8l10-2"/><ellipse cx="6.5" cy="18" rx="3.5" ry="2.5"/><ellipse cx="16.5" cy="16" rx="3.5" ry="2.5"/></>,
    check: <path d="m5 12 4 4L20 5"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export default function App() {
  const [settings, setSettings] = useState(readSettings);
  const [page, setPage] = useState<'practice' | 'intervals' | 'reference' | 'quiz'>('practice');
  const [melody, setMelody] = useState(() => generateMelody(settings.keyId, settings.voiceId, settings.intervals));
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState<Mode>('idle');
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [reading, setReading] = useState(emptyReading);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(0);
  const engine = useRef<AudioEngine | null>(null);
  const evaluator = useRef(new NoteEvaluator());
  const currentRef = useRef(0);
  const operation = useRef(0);
  const offline = useRegisterSW();
  useEffect(() => {
    let mounted = true;
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.ready.then(() => { if (mounted) offline.offlineReady[1](true); });
    }
    return () => { mounted = false; };
  }, []);
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => {
    const onHidden = () => { if (document.hidden) stop(); };
    document.addEventListener('visibilitychange', onHidden);
    return () => { operation.current++; engine.current?.dispose(); document.removeEventListener('visibilitychange', onHidden); };
  }, []);
  function getEngine() { return engine.current ??= new AudioEngine(); }
  function stop() {
    operation.current++;
    engine.current?.stopMic(); engine.current?.stopPlayback(); evaluator.current.reset();
    setPitch(null); setReading(emptyReading); setMode(currentRef.current === 4 ? 'complete' : 'idle');
  }
  function reset(keyId = settings.keyId, newMelody = true, nextSettings = settings) {
    stop(); setError(''); currentRef.current = 0; setCurrent(0); setMode('idle');
    if (newMelody) setMelody(generateMelody(keyId, nextSettings.voiceId, nextSettings.intervals));
  }
  function changeSettings(nextSettings: Settings) {
    reset(nextSettings.keyId, true, nextSettings);
    setSettings(nextSettings);
  }
  function displaySettings(nextSettings: Settings) { stop(); setSettings(nextSettings); }
  function navigate(nextPage: 'practice' | 'intervals' | 'reference' | 'quiz') { stop(); setError(''); setPage(nextPage); }
  function practiceInterval(semitones: number) {
    changeSettings({ ...settings, intervals: [semitones], exactOctave: semitones === 12 || settings.exactOctave });
    setPage('practice');
  }
  async function playNotes(notes: number[], together = false) {
    stop(); setError('');
    const id = ++operation.current;
    setMode('playing');
    try { await getEngine().play(notes, together); }
    catch { if (id === operation.current) setError('Nie udało się odtworzyć dźwięku. Spróbuj ponownie.'); }
    finally { if (id === operation.current) setMode(currentRef.current === 4 ? 'complete' : 'idle'); }
  }
  async function listen() {
    stop(); setError('');
    if (currentRef.current === 4) { currentRef.current = 0; setCurrent(0); }
    const id = ++operation.current;
    setMode('requesting');
    try {
      const started = await getEngine().start((detected, now) => {
        if (id !== operation.current || currentRef.current >= 4) return;
        setPitch(detected);
        const result = evaluator.current.update(detected, melody[currentRef.current].midi, settings.exactOctave, now);
        setReading(result);
        if (result.accepted) {
          currentRef.current++;
          setCurrent(currentRef.current); setReading(emptyReading);
          if (currentRef.current === 4) {
            engine.current?.stopMic(); setMode('complete'); setPitch(null); setCompleted(n => n + 1);
          }
        }
      }, () => {
        if (id === operation.current) { stop(); setError('Mikrofon został odłączony. Podłącz go i spróbuj ponownie.'); }
      });
      if (id === operation.current && started) setMode('listening');
    } catch (cause) {
      if (id !== operation.current) return;
      getEngine().stopMic(); setMode('idle');
      const name = cause && typeof cause === 'object' && 'name' in cause ? cause.name : '';
      setError(cause instanceof Error && cause.message === 'INSECURE'
        ? 'Mikrofon wymaga HTTPS albo adresu localhost. Odsłuch nadal działa.'
        : name === 'NotAllowedError' ? 'Brak zgody na mikrofon. Zezwól na dostęp w ustawieniach witryny i spróbuj ponownie. Możesz też ćwiczyć z odsłuchem.'
        : name === 'NotFoundError' ? 'Nie znaleziono mikrofonu. Podłącz go i spróbuj ponownie. Odsłuch nadal działa.'
        : 'Nie udało się uruchomić mikrofonu. Sprawdź, czy jest podłączony i dostępny dla przeglądarki. Odsłuch nadal działa.');
    }
  }
  async function play(firstOnly: boolean) {
    await playNotes((firstOnly ? melody.slice(0, 1) : melody).map(n => n.midi));
  }
  const cents = reading.cents;
  const inTune = cents !== null && Math.abs(cents) <= 100 + 1e-6;
  const status = mode === 'complete' ? 'Cała melodia zaśpiewana!' : mode === 'playing' ? 'Trwa odsłuch · mikrofon wyłączony'
    : mode === 'requesting' ? 'Czekam na zgodę na mikrofon…' : mode !== 'listening' ? 'Gotowy na pierwszą nutę?'
    : reading.waitingForChange ? 'Zmień dźwięk lub zrób krótką przerwę' : cents === null ? 'Zaśpiewaj i przytrzymaj dźwięk' : inTune ? 'Dobrze — utrzymaj dźwięk' : cents < 0 ? 'Za nisko — zaśpiewaj wyżej' : 'Za wysoko — zaśpiewaj niżej';
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="./" aria-label="Prima — strona główna"><span className="brand-icon"><Icon type="note" size={25}/></span><span>prima<span className="brand-dot">.</span></span></a>
      <div className="sidebar-caption">TWOJA PRZESTRZEŃ MUZYKI</div>
      <nav aria-label="Moduły"><div className="nav-label">ĆWICZENIA</div><button className={`nav-item ${page === 'practice' ? 'active' : ''}`} aria-current={page === 'practice' ? 'page' : undefined} onClick={() => navigate('practice')}><Icon type="note"/><span>Śpiewanie z nut</span><span className="nav-number">01</span></button><button className={`nav-item ${page === 'intervals' ? 'active' : ''}`} aria-current={page === 'intervals' ? 'page' : undefined} onClick={() => navigate('intervals')}><Icon type="play"/><span>Interwały</span><span className="nav-number">02</span></button><button className={`nav-item ${page === 'reference' ? 'active' : ''}`} aria-current={page === 'reference' ? 'page' : undefined} onClick={() => navigate('reference')}><Icon type="note"/><span>Ściągawka</span><span className="nav-number">03</span></button><button className={`nav-item ${page === 'quiz' ? 'active' : ''}`} aria-current={page === 'quiz' ? 'page' : undefined} onClick={() => navigate('quiz')}><Icon type="note"/><span>Rozpoznaj interwał</span><span className="nav-number">04</span></button></nav>
      <div className="sidebar-bottom"><div className="little-staff">♪</div><strong>Po jednej nucie.</strong><p>Małe ćwiczenia.<br/>Coraz większa pewność.</p><span className="privacy-dot"/> Dźwięk zostaje u Ciebie</div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span>Pracownia słuchu <span className="breadcrumb">/</span> <strong>{page === 'practice' ? 'Śpiewanie z nut' : page === 'intervals' ? 'Interwały' : page === 'quiz' ? 'Rozpoznaj interwał' : 'Ściągawka'}</strong></span><span className="local-badge"><span/> {offline.offlineReady[0] ? 'Gotowe do pracy offline' : 'Bez konta · lokalnie'}</span></header>
      <main>
        {page === 'quiz' ? <IntervalQuiz settings={settings} onSettings={changeSettings}/> : page === 'reference' ? <IntervalReference onListen={() => navigate('intervals')}/> : page === 'intervals' ? <>
          <IntervalLibrary settings={settings} onSettings={changeSettings} onPlay={(notes, together) => void playNotes(notes, together)} onStop={stop} playing={mode === 'playing'} onPractice={practiceInterval}/>
          {error && <div className="error" role="alert">{error}</div>}
        </> : <>
        <div className="page-heading"><div><div className="eyebrow">MODUŁ 01 · CZYTANIE NUT GŁOSEM</div><h1>Od nuty do melodii<span>.</span></h1><p>Spójrz na nuty. Złap pierwszy dźwięk. Zaśpiewaj po swojemu.</p></div><div className="session-stat"><strong>{String(completed).padStart(2, '0')}</strong><span>melodii w tej sesji</span></div></div>
        <div className="practice-layout">
          <section className="practice-card" aria-labelledby="exercise-title">
            <div className="card-heading"><div><span className="eyebrow">TWOJE ĆWICZENIE</span><h2 id="exercise-title">Cztery nuty. Bez pośpiechu.</h2></div><span className="pill">{voiceFor(settings.voiceId).label}</span></div>
            <div className="exercise-meta"><span>{KEYS.find(k => k.id === settings.keyId)?.label}</span><span>4/4</span><span>Ćwierćnuty</span><span>{clefFor(settings.clefs[settings.voiceId]).label}</span><span>{settings.intervals.map(i => intervalFor(i).short).join(" · ")}</span></div>
            <Score notes={melody} keyId={settings.keyId} current={current} clefId={settings.clefs[settings.voiceId]} showIntervals={settings.showIntervals} explicitAccidentals={settings.explicitAccidentals}/>
            <div className="interval-hint-controls"><button className={`button ghost ${settings.showIntervals ? 'hints-active' : ''}`} aria-pressed={settings.showIntervals} onClick={() => setSettings(s => ({ ...s, showIntervals: !s.showIntervals }))}>{settings.showIntervals ? 'Ukryj interwały' : 'Pokaż interwały'}</button>{settings.showIntervals && <span>m — mała · w — wielka · cz — czysta · TT — tryton · ↗ w górę · ↘ w dół</span>}</div>
            <div className="note-steps" aria-label="Postęp melodii">{melody.map((note, i) => <div key={i} className={`note-step ${i < current ? 'done' : i === current ? 'now' : ''}`}><span>{i < current ? <Icon type="check" size={15}/> : i + 1}</span>{settings.showNames && <small>{note.name}</small>}</div>)}</div>
            <div className="score-actions"><button className="button secondary" onClick={() => void playNotes(tonicTriad(settings.keyId, settings.voiceId), true)} disabled={mode === 'playing'} title="Trójdźwięk toniczny: I, III i V stopień skali"><Icon type="play"/>Posłuchaj tonacji</button><button className="button secondary" onClick={() => void play(true)} disabled={mode === 'playing'}><Icon type="note"/>Pierwszy dźwięk</button><button className="button ghost" onClick={() => void play(false)} disabled={mode === 'playing'}><Icon type="play"/>Odsłuchaj melodię</button><button className="button new-exercise" onClick={() => reset()}><Icon type="next"/>Nowa melodia</button></div>
            <div className={`listening-panel ${mode === 'listening' ? 'is-listening' : ''} ${mode === 'complete' ? 'is-complete' : ''}`}>
              <div className="listening-heading"><span className="mic-disc"><Icon type={mode === 'complete' ? 'check' : 'mic'} size={22}/></span><div><h3 aria-live="polite">{status}</h3><p>{mode === 'complete' ? 'Świetnie. Powtórz ćwiczenie lub wylosuj kolejną melodię.' : mode === 'listening' ? `Nuta ${current + 1} z 4 · przytrzymaj przez chwilę, aby ją zaliczyć.` : 'Aplikacja poczeka na każdą nutę. Tempo nie jest oceniane.'}</p></div></div>
              <div className="pitch-display"><div className="pitch-value"><span>WYKRYTY DŹWIĘK</span><strong>{pitch && mode === 'listening' ? detectedName(pitch.hz) : '—'}</strong><small>{pitch && mode === 'listening' ? `${Math.round(pitch.hz)} Hz` : 'Twój głos pojawi się tutaj'}</small></div><div className="tuner"><div className="tuner-labels"><span>za nisko</span><span>w punkt</span><span>za wysoko</span></div><div className="tuner-track"><div className="tuner-zone"/><div className="tuner-center"/>{cents !== null && <div className={`tuner-needle ${inTune ? 'in-tune' : ''}`} style={{ left: `${50 + Math.max(-200, Math.min(200, cents)) * .225}%` }}/>}</div><div className="tuner-caption">{cents === null ? 'Tolerancja ±100 centów · pół tonu' : `${cents > 0 ? '+' : ''}${Math.round(cents)} centów od nuty`}</div><div className="hold-track" role="progressbar" aria-label="Utrzymanie poprawnej nuty" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(reading.progress * 100)}><div style={{ width: `${reading.progress * 100}%` }}/></div></div></div>
              <div className="mic-actions">{mode === 'listening' || mode === 'requesting' || mode === 'playing' ? <button className="button primary" onClick={stop}><Icon type="stop"/>{mode === 'playing' ? 'Zatrzymaj odsłuch' : 'Zatrzymaj mikrofon'}</button> : <button className="button primary" onClick={() => void listen()}><Icon type="mic"/>{mode === 'complete' ? 'Zaśpiewaj jeszcze raz' : current > 0 ? 'Kontynuuj śpiewanie' : 'Zacznij śpiewać'}</button>}<span>{mode === 'listening' ? '● Mikrofon aktywny' : 'Mikrofon włącza się tylko na Twoje żądanie'}</span></div>
            </div>
            {error && <div className="error" role="alert">{error}</div>}
          </section>
          <aside className="settings-column"><PracticeSettings settings={settings} onChange={changeSettings} onDisplayChange={displaySettings}/>
            <section className="guide-card"><span className="eyebrow">MAŁA WSKAZÓWKA</span><h3>Najpierw poczuj tonację.</h3><p>„Posłuchaj tonacji” gra trójdźwięk toniczny — I, III i V stopień skali razem. Znajdź pierwszy dźwięk samodzielnie, a gdy potrzebujesz podpowiedzi, odsłuchaj go osobno. Interwały możesz odkryć dopiero po próbie.</p><div className="guide-bottom">♬ <span>Użyj słuchawek, by mikrofon<br/>słyszał przede wszystkim Ciebie.</span></div></section>
          </aside>
        </div>
        </>}
        <footer><span>Spokojna praktyka, dobry słuch.</span><span>Bez nagrywania · Bez wysyłania dźwięku</span></footer>
        {offline.needRefresh[0] && <div className="update-banner" role="status">Dostępna jest nowa wersja.<button className="button secondary" onClick={() => { stop(); void offline.updateServiceWorker(true); }}>Zaktualizuj</button></div>}
      </main>
    </div>
  </div>;
}
