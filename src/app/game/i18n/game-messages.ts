import { Injectable } from '@angular/core';
import ptProgression from './messages/pt/progression.json';
import ptResources from './messages/pt/resources.json';
import ptUi from './messages/pt/ui.json';
import ptWorld from './messages/pt/world.json';
import progression from './messages/en/progression.json';
import resources from './messages/en/resources.json';
import ui from './messages/en/ui.json';
import world from './messages/en/world.json';

type MessageValue = string | number;
export type SupportedLocale = 'en' | 'pt';
const LOCALE_STORAGE_KEY = 'frontier-miner-locale';

export interface GameMessages {
  ui: typeof ui;
  resources: typeof resources;
  world: typeof world;
  progression: typeof progression;
}

function getInitialLocale(): SupportedLocale {
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === 'pt' ? 'pt' : 'en';
}

const MESSAGE_CATALOGS: Record<SupportedLocale, GameMessages> = {
  en: {
    ui,
    resources,
    world,
    progression,
  },
  pt: {
    ui: ptUi,
    resources: ptResources,
    world: ptWorld,
    progression: ptProgression,
  },
};

export function formatMessage(
  template: string,
  params: Record<string, MessageValue>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export const GAME_MESSAGES = MESSAGE_CATALOGS[getInitialLocale()];

@Injectable({ providedIn: 'root' })
export class GameMessagesService {
  private locale: SupportedLocale = getInitialLocale();

  readonly localeOptions: Array<{ id: SupportedLocale; label: string }> = [
    { id: 'en', label: 'English' },
    { id: 'pt', label: 'Português' },
  ];

  get messages(): GameMessages {
    return MESSAGE_CATALOGS[this.locale];
  }

  get currentLocale(): SupportedLocale {
    return this.locale;
  }

  setLocale(locale: SupportedLocale): void {
    this.locale = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }

  format(template: string, params: Record<string, MessageValue>): string {
    return formatMessage(template, params);
  }
}
