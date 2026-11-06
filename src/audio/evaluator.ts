import { centsFromTarget } from '../music';
import type { Pitch } from './pitch';
export const TOLERANCE_CENTS = 100;
export type Reading = { cents: number | null; progress: number; accepted: boolean; waitingForChange?: boolean };

/** A break, wrong note or long sampling gap resets the continuous hold. */
export class NoteEvaluator {
  private since: number | null = null;
  private last: number | null = null;
  private previous: { hz: number; target: number } | null = null;
  private quietSince: number | null = null;
  private resetHold() { this.since = null; this.last = null; }
  reset() { this.resetHold(); this.previous = null; this.quietSince = null; }
  update(pitch: Pitch | null, target: number, exact: boolean, now: number, blocked = false): Reading {
    if (blocked) { this.reset(); return { cents: null, progress: 0, accepted: false }; }
    if (!pitch || pitch.confidence < .9) {
      this.resetHold();
      this.quietSince ??= now;
      if (now - this.quietSince >= 120) this.previous = null;
      return { cents: null, progress: 0, accepted: false };
    }
    this.quietSince = null;
    const cents = centsFromTarget(pitch.hz, target, exact);
    // Adjacent tolerance bands overlap at ±100 cents. A held note must not
    // advance through a semitone melody: require a changed pitch or a short release.
    if (this.previous && this.previous.target !== target && Math.abs(1200 * Math.log2(pitch.hz / this.previous.hz)) < 40) {
      this.resetHold(); return { cents, progress: 0, accepted: false, waitingForChange: true };
    }
    if (Math.abs(cents) > TOLERANCE_CENTS + 1e-6) { this.resetHold(); return { cents, progress: 0, accepted: false }; }
    if (this.last === null || now - this.last > 160) this.since = now;
    this.last = now;
    const progress = Math.min(1, (now - this.since!) / 300);
    const accepted = progress >= 1;
    if (accepted) { this.resetHold(); this.previous = { hz: pitch.hz, target }; }
    return { cents, progress, accepted };
  }
}
