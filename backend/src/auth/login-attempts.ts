import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

export const MAX_FAILURES = 5;
export const PAUSE_MS = 5 * 60_000;
/** Failures older than this no longer count towards a pause. */
const WINDOW_MS = 15 * 60_000;

type Entry = { failures: number; since: number; pausedUntil: number };

/**
 * Failed sign-ins per account number, whatever IP they come from (stations have dynamic, often shared IPs).
 * After MAX_FAILURES wrong passwords the account's sign-in pauses for PAUSE_MS; a success clears the count.
 * Keyed by the typed account number, existing or not, so a pause never reveals which accounts exist.
 * shortcut: in memory, per process (like the notification stream); move to the database or Redis when scaling out.
 */
@Injectable()
export class LoginAttempts {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly now: () => number = Date.now) {}

  /** Throws 429 while the account is paused. */
  assertAllowed(accountNumber: string) {
    const pausedUntil = this.entries.get(accountNumber)?.pausedUntil ?? 0;
    const left = pausedUntil - this.now();
    if (left > 0) {
      const minutes = Math.ceil(left / 60_000);
      throw new HttpException(
        `Too many failed sign-ins for this account. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  failed(accountNumber: string) {
    const now = this.now();
    const entry = this.entries.get(accountNumber);
    const fresh = !entry || now - entry.since > WINDOW_MS || entry.pausedUntil > 0;
    const next = fresh ? { failures: 1, since: now, pausedUntil: 0 } : { ...entry, failures: entry.failures + 1 };
    if (next.failures >= MAX_FAILURES) next.pausedUntil = now + PAUSE_MS;
    this.entries.set(accountNumber, next);
    if (this.entries.size > 10_000) this.prune(now); // random account numbers can't grow memory without bound
  }

  succeeded(accountNumber: string) {
    this.entries.delete(accountNumber);
  }

  private prune(now: number) {
    for (const [key, e] of this.entries) {
      if (e.pausedUntil < now && now - e.since > WINDOW_MS) this.entries.delete(key);
    }
  }
}
