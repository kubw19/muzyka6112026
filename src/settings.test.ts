// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { defaults, readSettings, saveSettings } from './settings';
import { DEFAULT_INTERVALS } from './intervals';
beforeEach(() => localStorage.clear());
describe('settings migration and validation', () => {
  it('migrates the original three settings and adds varied default intervals', () => {
    localStorage.setItem('prima-settings', JSON.stringify({ keyId: 'G', exactOctave: true, showNames: true }));
    expect(readSettings()).toEqual({ ...defaults, keyId: 'G', exactOctave: true, showNames: true });
  });
  it('rejects malformed values and repairs an empty interval set', () => {
    localStorage.setItem('prima-settings', JSON.stringify({ keyId: 'bad', voiceId: 'bad', intervals: [99, '1'], clefs: { bass: 'bad', tenor: 'alto' } }));
    const settings = readSettings();
    expect(settings.voiceId).toBe('soprano'); expect(settings.keyId).toBe('C');
    expect(settings.intervals).toEqual(DEFAULT_INTERVALS); expect(settings.clefs.bass).toBe('bass'); expect(settings.clefs.tenor).toBe('alto');
  });
  it('requires exact octave when restoring octave exercises', () => {
    saveSettings({ ...defaults, intervals: [12], exactOctave: false });
    expect(readSettings().exactOctave).toBe(true);
  });
  it('handles corrupt or unavailable storage gracefully', () => {
    localStorage.setItem('prima-settings', '{broken'); expect(readSettings()).toEqual(defaults);
  });
});
