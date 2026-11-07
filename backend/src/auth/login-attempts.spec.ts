import { HttpException } from '@nestjs/common';
import { LoginAttempts, MAX_FAILURES, PAUSE_MS } from './login-attempts.js';

describe('LoginAttempts', () => {
  let now = 0;
  const attempts = () => new LoginAttempts(() => now);
  const paused = (a: LoginAttempts, acct: string) => {
    try {
      a.assertAllowed(acct);
      return false;
    } catch (e) {
      return e instanceof HttpException && e.getStatus() === 429;
    }
  };

  beforeEach(() => (now = 1_000_000));

  it('pauses an account after 5 failures for 5 minutes, then lets it try again', () => {
    const a = attempts();
    for (let i = 0; i < MAX_FAILURES - 1; i++) a.failed('B13084');
    expect(paused(a, 'B13084')).toBe(false);
    a.failed('B13084');
    expect(paused(a, 'B13084')).toBe(true);
    expect(paused(a, 'B99999')).toBe(false); // other accounts unaffected
    now += PAUSE_MS - 1;
    expect(paused(a, 'B13084')).toBe(true);
    now += 1;
    expect(paused(a, 'B13084')).toBe(false);
    a.failed('B13084'); // a fresh count after the pause
    expect(paused(a, 'B13084')).toBe(false);
  });

  it('a success clears the count; old failures expire', () => {
    const a = attempts();
    for (let i = 0; i < MAX_FAILURES - 1; i++) a.failed('B1');
    a.succeeded('B1');
    a.failed('B1');
    expect(paused(a, 'B1')).toBe(false);

    for (let i = 0; i < MAX_FAILURES - 2; i++) a.failed('B2');
    now += 16 * 60_000; // past the 15-minute window
    a.failed('B2');
    a.failed('B2');
    expect(paused(a, 'B2')).toBe(false);
  });
});
