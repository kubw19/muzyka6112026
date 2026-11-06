import { useMemo, useState } from 'react';
import { KEYS, type KeyId } from '../music';
import { generateIntervalQuestion, quizChoices, writtenAccidentals } from '../notation';
import { CLEFS, VOICES, type VoiceId, type ClefId } from '../voices';
import type { Settings } from '../settings';
import { Score } from './Score';

export function IntervalQuiz({ settings, onSettings }: { settings: Settings; onSettings: (settings: Settings) => void }) {
  const [chromatic, setChromatic] = useState(true);
  const [question, setQuestion] = useState(() => generateIntervalQuestion(settings.keyId, settings.voiceId));
  const [answer, setAnswer] = useState<string | null>(null);
  const [result, setResult] = useState({ correct: 0, total: 0 });
  const choices = useMemo(() => quizChoices(question), [question]);
  function next(nextSettings = settings, nextChromatic = chromatic) {
    setQuestion(generateIntervalQuestion(nextSettings.keyId, nextSettings.voiceId, nextChromatic)); setAnswer(null);
  }
  function configure(nextSettings: Settings) { onSettings(nextSettings); next(nextSettings); }
  function respond(id: string) {
    if (answer !== null) return;
    setAnswer(id); setResult(value => ({ correct: value.correct + Number(id === question.answer.id), total: value.total + 1 }));
  }
  const visibleSigns = writtenAccidentals(question.notes, settings.keyId);
  return <>
    <div className="page-heading"><div><div className="eyebrow">MODUŁ 04 · CZYTANIE INTERWAŁÓW</div><h1>Rozpoznaj z nut<span>.</span></h1><p>Policz nazwy dźwięków i uwzględnij wszystkie znaki. Jaki to interwał?</p></div><div className="session-stat"><strong>{result.correct}/{result.total}</strong><span>poprawnych w tej sesji</span></div></div>
    <section className="practice-card quiz-card" aria-labelledby="quiz-title"><div className="card-heading"><div><span className="eyebrow">DWA DŹWIĘKI · JEDNA ODPOWIEDŹ</span><h2 id="quiz-title">Jaki interwał widzisz?</h2></div><span className="pill">{KEYS.find(key => key.id === settings.keyId)?.label}</span></div>
      <div className="quiz-settings"><label>Tonacja<select aria-label="Tonacja quizu" value={settings.keyId} onChange={event => configure({ ...settings, keyId: event.target.value as KeyId })}>{KEYS.map(key => <option key={key.id} value={key.id}>{key.label}</option>)}</select></label><label>Głos<select aria-label="Głos quizu" value={settings.voiceId} onChange={event => configure({ ...settings, voiceId: event.target.value as VoiceId })}>{VOICES.map(voice => <option key={voice.id} value={voice.id}>{voice.label}</option>)}</select></label><label>Klucz<select aria-label="Klucz quizu" value={settings.clefs[settings.voiceId]} onChange={event => onSettings({ ...settings, clefs: { ...settings.clefs, [settings.voiceId]: event.target.value as ClefId } })}>{CLEFS.map(clef => <option key={clef.id} value={clef.id}>{clef.label}</option>)}</select></label></div>
      <label className="quiz-chromatic"><input type="checkbox" checked={chromatic} onChange={event => { setChromatic(event.target.checked); next(settings, event.target.checked); }}/> Także znaki przygodne: ♯ krzyżyki, ♭ bemole i ♮ kasowniki</label>
      <Score notes={question.notes} keyId={settings.keyId} clefId={settings.clefs[settings.voiceId]} interval/>
      <div className="quiz-answers" aria-label="Odpowiedzi">{choices.map(choice => <button className={`quiz-answer ${answer && choice.id === question.answer.id ? 'correct' : answer === choice.id ? 'incorrect' : ''}`} key={choice.id} disabled={answer !== null} onClick={() => respond(choice.id)}><strong>{choice.id}</strong><span>{choice.label}</span></button>)}</div>
      {answer !== null && <div className={`quiz-feedback ${answer === question.answer.id ? 'success' : ''}`} role="status"><h3>{answer === question.answer.id ? 'Dobrze!' : 'Sprawdźmy to razem.'} {question.answer.label} ({question.answer.id})</h3><p>{question.notes[0].name} → {question.notes[1].name}: numer interwału to {question.answer.number}, a odległość wynosi {question.answer.semitones} półt. ({question.answer.semitones / 2} tonu).</p><p>{visibleSigns.includes('n') ? 'Kasownik przy nucie przywraca jej naturalną wysokość, także gdy przy kluczu jest krzyżyk lub bemol. ' : ''}Znaki przy kluczu obowiązują we wszystkich oktawach; przygodne zmieniają wskazany dźwięk w tym takcie.</p><p>Liczy się też pisownia: np. 4zw i 5zm mają po 6 półtonów, ale różne numery.</p></div>}
      <div className="quiz-bottom"><button className="button primary" onClick={() => next()}>{answer === null ? 'Inna para nut' : 'Następne pytanie'} →</button><span>♯ podwyższa o półton · ♭ obniża o półton · ♮ przywraca dźwięk naturalny</span></div>
    </section>
  </>;
}
