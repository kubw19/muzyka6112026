// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { frequency } from './music';
import type { Pitch } from './audio/pitch';

const audio = vi.hoisted(() => ({
  onPitch: null as null | ((pitch: Pitch | null, now: number) => void),
  start: vi.fn(), stopMic: vi.fn(), stopPlayback: vi.fn(), play: vi.fn(), dispose: vi.fn(),
}));
vi.mock('./audio/engine', () => ({ AudioEngine: class {
  start = audio.start; stopMic = audio.stopMic; stopPlayback = audio.stopPlayback;
  play = audio.play; dispose = audio.dispose;
} }));
vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: () => ({ offlineReady: [true, vi.fn()], needRefresh: [false, vi.fn()], updateServiceWorker: vi.fn() }) }));
vi.mock('./components/Score', () => ({ Score: ({ notes, current, clefId, showIntervals, explicitAccidentals }: { notes: { midi: number }[]; current: number; clefId: string; showIntervals: boolean; explicitAccidentals: boolean }) => <div data-testid="score" data-notes={JSON.stringify(notes.map(n => n.midi))} data-current={current} data-clef={clefId} data-intervals={String(showIntervals)} data-accidentals={String(explicitAccidentals)}/> }));
import App from './App';

beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks(); audio.onPitch = null;
  audio.start.mockImplementation(async (onPitch) => { audio.onPitch = onPitch; return true; });
  audio.play.mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
const start = async () => { await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Zacznij śpiewać' })); }); };
const sing = (midi: number, startTime: number) => {
  for (let now = startTime; now <= startTime + 300; now += 50) act(() => audio.onPitch?.({ hz: frequency(midi), confidence: .99, rms: .2 }, now));
};
describe('singing module integration', () => {
  it('Dalej keeps the same stream and evaluates the new melody instead of the captured old notes', async () => {
    render(<App/>); await start();
    const stops = audio.stopMic.mock.calls.length;
    const callback = audio.onPitch;
    sing(JSON.parse(screen.getByTestId('score').getAttribute('data-notes')!)[0], 0);
    fireEvent.click(screen.getByRole('button', { name: 'Dalej — nowa melodia' }));
    expect(audio.stopMic.mock.calls.length).toBe(stops);
    expect(audio.start).toHaveBeenCalledTimes(1); expect(audio.onPitch).toBe(callback);
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('0');
    const notes: number[] = JSON.parse(screen.getByTestId('score').getAttribute('data-notes')!);
    notes.forEach((note, i) => sing(note, 1000 + i * 500));
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('4');
    expect(screen.getByRole('button', { name: 'Zatrzymaj mikrofon' })).toBeTruthy();
    expect(audio.stopMic.mock.calls.length).toBe(stops);
    fireEvent.click(screen.getByRole('button', { name: 'Dalej — nowa melodia' }));
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('0');
    expect(audio.start).toHaveBeenCalledTimes(1);
  });
  it('automatically advances only when enabled, after the completion pause', async () => {
    vi.useFakeTimers(); render(<App/>); await start();
    const stops = audio.stopMic.mock.calls.length;
    fireEvent.click(screen.getByRole('checkbox', { name: /Automatycznie dalej/ }));
    expect(audio.stopMic.mock.calls.length).toBe(stops);
    const notes: number[] = JSON.parse(screen.getByTestId('score').getAttribute('data-notes')!);
    notes.forEach((note, i) => sing(note, i * 500));
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('4');
    await act(async () => vi.advanceTimersByTime(1199));
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('4');
    await act(async () => vi.advanceTimersByTime(1));
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('0');
    expect(audio.start).toHaveBeenCalledTimes(1); expect(audio.stopMic.mock.calls.length).toBe(stops);
    expect(JSON.parse(localStorage.getItem('prima-settings')!).autoAdvance).toBe(true);
  });
  it('manual next and stopping the microphone cancel pending automatic navigation', async () => {
    vi.useFakeTimers(); render(<App/>); await start();
    fireEvent.click(screen.getByRole('checkbox', { name: /Automatycznie dalej/ }));
    const notes: number[] = JSON.parse(screen.getByTestId('score').getAttribute('data-notes')!);
    notes.forEach((note, i) => sing(note, i * 500));
    fireEvent.click(screen.getByRole('button', { name: 'Dalej — nowa melodia' }));
    const next = screen.getByTestId('score').getAttribute('data-notes');
    await act(async () => vi.advanceTimersByTime(1500));
    expect(screen.getByTestId('score').getAttribute('data-notes')).toBe(next);
    const current: number[] = JSON.parse(next!);
    current.forEach((note, i) => sing(note, 3000 + i * 500));
    fireEvent.click(screen.getByRole('button', { name: 'Zatrzymaj mikrofon' }));
    await act(async () => vi.advanceTimersByTime(1500));
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('4');
    expect(screen.getByTestId('score').getAttribute('data-notes')).toBe(next);
  });

  it('opens notation quiz, locks the first answer and allows another question', () => {
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: /Rozpoznaj interwał/ }));
    const answers = screen.getByRole('region', { name: 'Jaki interwał widzisz?' }).querySelectorAll<HTMLButtonElement>('.quiz-answer');
    expect(answers.length).toBe(6);
    fireEvent.click(answers[0]);
    expect(screen.getByRole('status').textContent).toContain('numer interwału');
    expect([...answers].every(button => button.disabled)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Następne pytanie/ }));
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.change(screen.getByLabelText('Tonacja quizu'), { target: { value: 'G' } });
    expect(JSON.parse(localStorage.getItem('prima-settings')!).keyId).toBe('G');
  });
  it('plays the tonic triad without revealing or changing the first note', async () => {
    render(<App/>); await start();
    const before = screen.getByTestId('score').getAttribute('data-notes');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Posłuchaj tonacji' })); });
    const chord = audio.play.mock.calls.at(-1)![0] as number[];
    expect(chord.map(midi => midi - chord[0])).toEqual([0, 4, 7]);
    expect(chord[0] % 12).toBe(0);
    expect(audio.play.mock.calls.at(-1)![1]).toBe(true);
    expect(screen.getByTestId('score').getAttribute('data-notes')).toBe(before);
    expect(audio.stopMic).toHaveBeenCalled();
  });
  it('toggles interval hints independently without resetting the melody', () => {
    render(<App/>);
    const before = screen.getByTestId('score').getAttribute('data-notes');
    fireEvent.click(screen.getByRole('button', { name: 'Pokaż interwały' }));
    expect(screen.getByTestId('score').getAttribute('data-intervals')).toBe('true');
    expect(screen.getByTestId('score').getAttribute('data-notes')).toBe(before);
    expect(JSON.parse(localStorage.getItem('prima-settings')!).showIntervals).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Ukryj interwały' }));
    expect(screen.getByTestId('score').getAttribute('data-intervals')).toBe('false');
  });
  it('completes all four notes without a tempo requirement and keeps the microphone ready for the next melody', async () => {
    render(<App/>);
    const notes: number[] = JSON.parse(screen.getByTestId('score').getAttribute('data-notes')!);
    await start();
    notes.forEach((midi, i) => sing(midi - 12, 1000 + i * 1500));
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('4');
    expect(screen.getByRole('heading', { name: 'Cała melodia zaśpiewana!' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Zatrzymaj mikrofon' })).toBeTruthy();
    expect(audio.stopMic).not.toHaveBeenCalled();
  });
  it('does not accept a different octave in exact mode', async () => {
    render(<App/>);
    fireEvent.click(screen.getByRole('checkbox', { name: /Dokładna oktawa/ }));
    const notes: number[] = JSON.parse(screen.getByTestId('score').getAttribute('data-notes')!);
    await start(); sing(notes[0] - 12, 0);
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('0');
    expect(screen.getByRole('heading', { name: /Za nisko/ })).toBeTruthy();
  });
  it('keeps playback usable when microphone permission is denied', async () => {
    audio.start.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    render(<App/>); await start();
    expect(screen.getByRole('alert').textContent).toContain('Brak zgody na mikrofon');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Pierwszy dźwięk' })); });
    expect(audio.play).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Number)]), false);
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('invalidates microphone callbacks during playback', async () => {
    let finish!: () => void;
    audio.play.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    render(<App/>); await start();
    const notes: number[] = JSON.parse(screen.getByTestId('score').getAttribute('data-notes')!);
    fireEvent.click(screen.getByRole('button', { name: 'Odsłuchaj melodię' }));
    expect(screen.getByRole('heading', { name: /Trwa odsłuch/ })).toBeTruthy();
    sing(notes[0], 0);
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('0');
    expect(audio.stopMic).toHaveBeenCalled();
    await act(async () => finish());
    expect(screen.getByRole('button', { name: 'Zacznij śpiewać' })).toBeTruthy();
  });
  it('stops a pending microphone request and ignores its late result', async () => {
    let finish!: (value: boolean) => void;
    audio.start.mockImplementation(() => new Promise<boolean>(resolve => { finish = resolve; }));
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: 'Zacznij śpiewać' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zatrzymaj mikrofon' }));
    await act(async () => finish(true));
    expect(screen.getByRole('button', { name: 'Zacznij śpiewać' })).toBeTruthy();
  });
  it('persists settings and resets progress when changing key', async () => {
    render(<App/>); await start();
    const notes: number[] = JSON.parse(screen.getByTestId('score').getAttribute('data-notes')!);
    sing(notes[0], 0);
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('1');
    fireEvent.change(screen.getByLabelText('Tonacja'), { target: { value: 'G' } });
    expect(screen.getByTestId('score').getAttribute('data-current')).toBe('0');
    expect(JSON.parse(localStorage.getItem('prima-settings')!).keyId).toBe('G');
    expect(screen.getByRole('button', { name: 'Zacznij śpiewać' })).toBeTruthy();
  });
  it('remembers independent clefs for every voice without changing sounding notes', () => {
    render(<App/>);
    fireEvent.change(screen.getByLabelText('Głos', { exact: true }), { target: { value: 'tenor' } });
    expect(screen.getByTestId('score').getAttribute('data-clef')).toBe('bass');
    const notes = screen.getByTestId('score').getAttribute('data-notes');
    fireEvent.change(screen.getByLabelText('Klucz', { exact: true }), { target: { value: 'treble8vb' } });
    expect(screen.getByTestId('score').getAttribute('data-clef')).toBe('treble8vb');
    expect(screen.getByTestId('score').getAttribute('data-notes')).toBe(notes);
    fireEvent.change(screen.getByLabelText('Głos', { exact: true }), { target: { value: 'alto' } });
    expect(screen.getByTestId('score').getAttribute('data-clef')).toBe('treble');
    fireEvent.change(screen.getByLabelText('Głos', { exact: true }), { target: { value: 'tenor' } });
    expect(screen.getByTestId('score').getAttribute('data-clef')).toBe('treble8vb');
  });
  it('enforces a nonempty interval set and exact octave for octave exercises', () => {
    render(<App/>);
    fireEvent.click(screen.getByRole('button', { name: 'Sekundy' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sekunda mała' }));
    expect((screen.getByRole('checkbox', { name: 'Sekunda wielka' }) as HTMLInputElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Oktawa czysta' }));
    const octave = screen.getByRole('checkbox', { name: /Dokładna oktawa/ }) as HTMLInputElement;
    expect(octave.checked).toBe(true); expect(octave.disabled).toBe(true);
  });
  it('plays library intervals in both directions and transfers a choice to practice', async () => {
    render(<App/>); await start();
    fireEvent.click(screen.getByRole('button', { name: /Interwały/ }));
    expect(audio.stopMic).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Sekunda mała/ }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Odsłuchaj kolejno/ })); });
    expect(audio.play).toHaveBeenLastCalledWith([60, 61], false);
    fireEvent.click(screen.getByRole('button', { name: /W dół/ }));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Odsłuchaj razem/ })); });
    expect(audio.play).toHaveBeenLastCalledWith([61, 60], true);
    fireEvent.click(screen.getByRole('button', { name: /Ćwicz ten interwał/ }));
    const notes: number[] = JSON.parse(screen.getByTestId('score').getAttribute('data-notes')!);
    expect(notes.slice(1).every((note, i) => Math.abs(note - notes[i]) === 1)).toBe(true);
    expect(screen.getByRole('button', { name: 'Zacznij śpiewać' })).toBeTruthy();
  });
});
