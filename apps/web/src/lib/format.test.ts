import { formatTime } from './format';

describe('formatTime', () => {
  it('formata minutos e segundos', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(3725)).toBe('1:02:05');
  });
  it('trata valores invalidos', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
    expect(formatTime(null)).toBe('0:00');
    expect(formatTime(-4)).toBe('0:00');
  });
});
