import { describe, expect, it } from 'vitest';
import { currencySymbol, formatMoney } from '@/lib/format';

describe('format helpers', () => {
  it('returns currency symbols', () => {
    expect(currencySymbol('GBP')).toBe('£');
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('EUR')).toBe('€');
  });

  it('formats money with symbol', () => {
    const value = formatMoney(1234.5, 'GBP');
    expect(value.startsWith('£')).toBe(true);
    expect(value.replace(/[^0-9]/g, '')).toContain('123450');
  });
});
