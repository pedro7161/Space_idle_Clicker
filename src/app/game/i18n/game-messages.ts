import { Injectable } from '@angular/core';
import progression from './messages/en/progression.json';
import resources from './messages/en/resources.json';
import ui from './messages/en/ui.json';
import world from './messages/en/world.json';

type MessageValue = string | number;

export interface GameMessages {
  ui: typeof ui;
  resources: typeof resources;
  world: typeof world;
  progression: typeof progression;
}

const MESSAGE_CATALOGS: { en: GameMessages } = {
  en: {
    ui,
    resources,
    world,
    progression,
  },
};

export function formatMessage(
  template: string,
  params: Record<string, MessageValue>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export const GAME_MESSAGES = MESSAGE_CATALOGS.en;

@Injectable({ providedIn: 'root' })
export class GameMessagesService {
  private readonly locale = 'en';

  get messages(): GameMessages {
    return MESSAGE_CATALOGS[this.locale];
  }

  format(template: string, params: Record<string, MessageValue>): string {
    return formatMessage(template, params);
  }
}
