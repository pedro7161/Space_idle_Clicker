import { FormatNumberPipe } from './format-number.pipe';

describe('FormatNumberPipe', () => {
  let pipe: FormatNumberPipe;

  beforeEach(() => {
    pipe = new FormatNumberPipe();
  });

  it('should return whole numbers below 1000 as-is', () => {
    expect(pipe.transform(0)).toBe('0');
    expect(pipe.transform(1)).toBe('1');
    expect(pipe.transform(999)).toBe('999');
  });

  it('should floor fractional values below 1000', () => {
    expect(pipe.transform(1.9)).toBe('1');
    expect(pipe.transform(99.99)).toBe('99');
  });

  it('should format thousands with K suffix', () => {
    expect(pipe.transform(1000)).toBe('1.0K');
    expect(pipe.transform(1500)).toBe('1.5K');
    expect(pipe.transform(999_999)).toBe('1000.0K');
  });

  it('should format millions with M suffix', () => {
    expect(pipe.transform(1_000_000)).toBe('1.00M');
    expect(pipe.transform(5_500_000)).toBe('5.50M');
  });

  it('should format billions with B suffix', () => {
    expect(pipe.transform(1_000_000_000)).toBe('1.00B');
    expect(pipe.transform(2_350_000_000)).toBe('2.35B');
  });

  it('should format trillions with T suffix', () => {
    expect(pipe.transform(1_000_000_000_000)).toBe('1.00T');
    expect(pipe.transform(9_999_000_000_000)).toBe('10.00T');
  });
});
