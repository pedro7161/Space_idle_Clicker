import { formatMessage } from './game-messages';

describe('formatMessage', () => {
  it('replaces placeholders with provided params', () => {
    const result = formatMessage('Hello {name}, score {score}', { name: 'Alice', score: 42 });
    expect(result).toBe('Hello Alice, score 42');
  });

  it('keeps placeholder when param missing', () => {
    const result = formatMessage('Hello {name}, level {level}', { name: 'Bob' } as any);
    expect(result).toBe('Hello Bob, level {level}');
  });
});
