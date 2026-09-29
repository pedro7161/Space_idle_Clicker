import { GameMessagesService } from './game-messages';

describe('GameMessagesService', () => {
  let service: GameMessagesService;

  beforeEach(() => {
    localStorage.clear();
    service = new GameMessagesService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('formats messages using formatMessage', () => {
    const result = service.format('Hello {name}', { name: 'Tester' });
    expect(result).toBe('Hello Tester');
  });

  it('exposes each supported locale once', () => {
    expect(service.localeOptions.map(option => option.id)).toEqual([
      'en',
      'pt',
      'pt-BR',
      'es',
      'fr',
    ]);
  });

  it('persists locale changes', () => {
    service.setLocale('pt-BR');

    expect(service.currentLocale).toBe('pt-BR');
    expect(localStorage.getItem('frontier-miner-locale')).toBe('pt-BR');
  });
});
