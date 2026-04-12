import { GameMessagesService } from './game-messages';

describe('GameMessagesService', () => {
  let svc: GameMessagesService;

  beforeEach(() => {
    svc = new GameMessagesService();
  });

  it('formats messages using formatMessage', () => {
    const out = svc.format('Hello {name}', { name: 'Tester' });
    expect(out).toBe('Hello Tester');
  });
});
