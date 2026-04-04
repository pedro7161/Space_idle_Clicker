import esProgression from './messages/es/progression.json';
import esResources from './messages/es/resources.json';
import esUi from './messages/es/ui.json';
import esWorld from './messages/es/world.json';
import frProgression from './messages/fr/progression.json';
import frResources from './messages/fr/resources.json';
import frUi from './messages/fr/ui.json';
import frWorld from './messages/fr/world.json';
import { Injectable } from '@angular/core';
import ptProgression from './messages/pt/progression.json';
import ptResources from './messages/pt/resources.json';
import ptUi from './messages/pt/ui.json';
import ptWorld from './messages/pt/world.json';
import ptBrProgression from './messages/pt-BR/progression.json';
import ptBrResources from './messages/pt-BR/resources.json';
import ptBrUi from './messages/pt-BR/ui.json';
import ptBrWorld from './messages/pt-BR/world.json';
import progression from './messages/en/progression.json';
import resources from './messages/en/resources.json';
import ui from './messages/en/ui.json';
import world from './messages/en/world.json';

type MessageValue = string | number;
export type SupportedLocale = 'en' | 'pt' | 'pt-BR' | 'es' | 'fr';
const LOCALE_STORAGE_KEY = 'frontier-miner-locale';

export interface GameMessages {
  ui: typeof ui;
  resources: typeof resources;
  world: typeof world;
  progression: typeof progression;
}

function getInitialLocale(): SupportedLocale {
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'pt' || stored === 'pt-BR' || stored === 'es' || stored === 'fr') {
    return stored;
  }

  if (typeof navigator !== 'undefined') {
    const language = navigator.language.toLowerCase();
    if (language.startsWith('pt-br')) {
      return 'pt-BR';
    }

    if (language.startsWith('pt')) {
      return 'pt';
    }

    if (language.startsWith('es')) {
      return 'es';
    }

    if (language.startsWith('fr')) {
      return 'fr';
    }
  }

  return 'en';
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
  'pt-BR': {
    ui: ptBrUi,
    resources: ptBrResources,
    world: ptBrWorld,
    progression: ptBrProgression,
  },
  es: {
    ui: esUi,
    resources: esResources,
    world: esWorld,
    progression: esProgression,
  },
  fr: {
    ui: frUi,
    resources: frResources,
    world: frWorld,
    progression: frProgression,
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
    { id: 'pt', label: 'Português (Portugal)' },
    { id: 'pt-BR', label: 'Português (Brasil)' },
    { id: 'es', label: 'Español' },
    { id: 'fr', label: 'Français' },
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
