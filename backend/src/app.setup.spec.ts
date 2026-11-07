import { trustProxy } from './app.setup.js';

describe('trustProxy', () => {
  it('reads hop counts, booleans and address lists', () => {
    expect(trustProxy('1')).toBe(1);
    expect(trustProxy('true')).toBe(true);
    expect(trustProxy('false')).toBe(false);
    expect(trustProxy('loopback, 172.16.0.0/12')).toBe('loopback, 172.16.0.0/12');
  });
});
