export interface ChangelogItem {
  type: 'added' | 'changed' | 'fixed';
  en: string;
  pt: string;
}

export interface ChangelogEntry {
  version: string;
  releasedAt: string;
  title: {
    en: string;
    pt: string;
  };
  summary: {
    en: string;
    pt: string;
  };
  items: ChangelogItem[];
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: '0.5.1',
    releasedAt: '2026-04-03',
    title: {
      en: 'Save Migration Safeguards',
      pt: 'Proteções de Migração de Saves',
    },
    summary: {
      en: 'Older local saves are now promoted into the current storage version automatically when the game starts.',
      pt: 'Os saves locais antigos passam agora a ser promovidos automaticamente para a versão atual do armazenamento quando o jogo arranca.',
    },
    items: [
      {
        type: 'fixed',
        en: 'When a new save key version is introduced, matching progress from older local saves is now carried into the current save instead of starting over.',
        pt: 'Quando é introduzida uma nova versão da chave de save, o progresso compatível dos saves locais antigos passa agora para o save atual em vez de recomeçar.',
      },
      {
        type: 'fixed',
        en: 'Old versioned save entries are removed only after the current save is written successfully.',
        pt: 'As entradas antigas versionadas só são removidas depois de o save atual ser escrito com sucesso.',
      },
    ],
  },
  {
    version: '0.5.0',
    releasedAt: '2026-04-03',
    title: {
      en: 'Fleet Command and Orbital Stations',
      pt: 'Comando da Frota e Estações Orbitais',
    },
    summary: {
      en: 'Ship control now lives in its own workspace, and planets can be upgraded with orbital stations to improve logistics.',
      pt: 'O controlo de naves passa a viver num espaço próprio, e os planetas podem ser melhorados com estações orbitais para melhorar a logística.',
    },
    items: [
      {
        type: 'added',
        en: 'A dedicated Ships workspace with separate sections for routes, ship building, and ship stats.',
        pt: 'Um espaço dedicado de Naves com secções separadas para rotas, construção de naves e estado da frota.',
      },
      {
        type: 'added',
        en: 'Buildable orbital stations above planets, with stronger dispatch capacity and faster route handling.',
        pt: 'Estações orbitais construíveis acima dos planetas, com maior capacidade de despacho e rotas mais rápidas.',
      },
      {
        type: 'added',
        en: 'Planet station panels that show local route traffic and prepare each world for future hub management.',
        pt: 'Painéis de estação por planeta que mostram o tráfego local de rotas e preparam cada mundo para futura gestão de hubs.',
      },
      {
        type: 'changed',
        en: 'Ship management moved out of the launch tab and into a proper page-style command deck.',
        pt: 'A gestão de naves saiu do separador de lançamento e passou para um verdadeiro convés de comando em formato de página.',
      },
      {
        type: 'changed',
        en: 'The old planet cargo hold panel was replaced by orbital station planning and status.',
        pt: 'O antigo painel de armazém planetário foi substituído por planeamento e estado de estação orbital.',
      },
    ],
  },
  {
    version: '0.4.0',
    releasedAt: '2026-04-03',
    title: {
      en: 'Planet Logistics Update',
      pt: 'Atualização de Logística Planetária',
    },
    summary: {
      en: 'Resources now live on each planet, and ships can move cargo through repeatable routes.',
      pt: 'Os recursos passam a existir por planeta, e as naves podem mover carga através de rotas repetíveis.',
    },
    items: [
      {
        type: 'added',
        en: 'Planet-based inventories for mining, crafting, and automation output.',
        pt: 'Inventários por planeta para mineração, fabrico e produção automática.',
      },
      {
        type: 'added',
        en: 'Fleet Command screen with ship building, route setup, cargo limits, and ETA display.',
        pt: 'Ecrã de Comando da Frota com construção de naves, criação de rotas, limites de carga e ETA.',
      },
      {
        type: 'added',
        en: 'Ship tiers, cargo capacity, and travel speed, with planet access requirements by tier.',
        pt: 'Níveis de nave, capacidade de carga e velocidade de viagem, com requisitos de acesso por nível.',
      },
      {
        type: 'added',
        en: 'In-game changelog viewer accessible from the settings dialog.',
        pt: 'Visualizador de changelog no jogo acessível a partir do menu de definições.',
      },
      {
        type: 'changed',
        en: 'The old shared cargo hold is now a planet-local inventory view.',
        pt: 'O antigo armazém partilhado passou a ser uma vista de inventário local ao planeta.',
      },
      {
        type: 'fixed',
        en: 'Travel unlock logic now respects the strongest ship tier the player owns.',
        pt: 'A lógica de desbloqueio de viagem passa agora a respeitar o nível mais alto de nave que o jogador possui.',
      },
    ],
  },
  {
    version: '0.3.0',
    releasedAt: '2026-04-03',
    title: {
      en: 'Initial Playable Build',
      pt: 'Primeira Versão Jogável',
    },
    summary: {
      en: 'The first playable version of the game was assembled, including the core launch and planet travel loop.',
      pt: 'A primeira versão jogável do jogo foi montada, incluindo o ciclo principal de lançamento e viagem entre planetas.',
    },
    items: [
      {
        type: 'added',
        en: 'Ship assembly with hull, thrusters, and guidance parts.',
        pt: 'Montagem de nave com casco, propulsores e núcleo de navegação.',
      },
      {
        type: 'added',
        en: 'Planet discovery screen with travel costs and planetary yield differences.',
        pt: 'Ecrã de descoberta de planetas com custos de viagem e diferenças de rendimento planetário.',
      },
      {
        type: 'changed',
        en: 'Launch progression was moved into the operations panel.',
        pt: 'A progressão de lançamento foi movida para o painel de operações.',
      },
    ],
  },
];
