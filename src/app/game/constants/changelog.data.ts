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
    version: '0.6.1',
    releasedAt: '2026-04-04',
    title: {
      en: 'Dev Tools and Panel Polish',
      pt: 'Ferramentas Dev e Polimento dos Painéis',
    },
    summary: {
      en: 'Non-production builds now include fast progression tools, and long operation panels scroll more cleanly.',
      pt: 'As builds não produtivas passam agora a incluir ferramentas para acelerar a progressão, e os painéis longos de operações fazem scroll de forma mais limpa.',
    },
    items: [
      {
        type: 'added',
        en: 'A dev-only tools section in Settings with one-click resource grants for the current planet or every planet.',
        pt: 'Uma secção de ferramentas apenas para dev nas Definições com atribuição de recursos num clique para o planeta atual ou para todos os planetas.',
      },
      {
        type: 'fixed',
        en: 'The settings menu now scrolls inside the dialog when the content grows beyond the viewport.',
        pt: 'O menu de definições passa agora a fazer scroll dentro do diálogo quando o conteúdo ultrapassa a altura da janela.',
      },
      {
        type: 'fixed',
        en: 'The operations panel now leaves enough space at the bottom of long upgrade lists so completed sections remain reachable.',
        pt: 'O painel de operações passa agora a deixar espaço suficiente no fundo das listas longas de melhorias para que as secções concluídas continuem acessíveis.',
      },
    ],
  },
  {
    version: '0.6.0',
    releasedAt: '2026-04-04',
    title: {
      en: 'Deep Frontier Resources',
      pt: 'Recursos da Fronteira Profunda',
    },
    summary: {
      en: 'New planets, deeper resources, broader operations controls, and uranium-rich late-game progression now push the system deeper.',
      pt: 'Novos planetas, recursos mais profundos, controlos de operações mais amplos e progressão tardia rica em urânio empurram o sistema para mais longe.',
    },
    items: [
      {
        type: 'added',
        en: 'Six new raw resources: copper, silica, hydrogen, titanium, rare crystal, and uranium.',
        pt: 'Seis novos recursos brutos: cobre, sílica, hidrogénio, titânio, cristal raro e urânio.',
      },
      {
        type: 'added',
        en: 'New late-system planets with resource-specific extraction zones, ending in the uranium world Helion Breach.',
        pt: 'Novos planetas no sistema tardio com zonas de extração específicas por recurso, terminando no mundo de urânio Rutura Helion.',
      },
      {
        type: 'added',
        en: 'Tier 4 and tier 5 ships that open deeper routes and support heavier logistics chains.',
        pt: 'Naves de nível 4 e 5 que abrem rotas mais profundas e suportam cadeias logísticas mais pesadas.',
      },
      {
        type: 'added',
        en: 'Titanium Alloy and Reactor Cores as new advanced crafted materials for the top end of progression.',
        pt: 'Liga de Titânio e Núcleos de Reator como novos materiais avançados para o topo da progressão.',
      },
      {
        type: 'changed',
        en: 'Planets now explicitly control which raw resources can be mined there instead of exposing every resource everywhere.',
        pt: 'Os planetas passam agora a controlar explicitamente que recursos brutos podem ser minerados em cada local, em vez de expor tudo em todo o lado.',
      },
      {
        type: 'changed',
        en: 'Uranium gained special high-impact upgrade paths so the final mining chain pays off harder than standard resource loops.',
        pt: 'O urânio ganhou caminhos de melhoria de alto impacto para que a cadeia final de mineração compense mais do que os ciclos normais de recursos.',
      },
      {
        type: 'changed',
        en: 'Planet upgrade lists now stage only the next one or two active upgrade cards, while completed chains fade into a compact summary.',
        pt: 'As listas de melhorias planetárias passam agora a mostrar apenas uma ou duas cartas ativas de cada vez, enquanto as cadeias concluídas esbatem para um resumo compacto.',
      },
      {
        type: 'changed',
        en: 'Operations can now expand out of the side rail into a full systems workspace with a dedicated Resources tab for the local planet ledger.',
        pt: 'As operações podem agora expandir-se para fora da barra lateral e abrir um espaço completo de sistemas com um separador dedicado de Recursos para o registo local do planeta.',
      },
      {
        type: 'changed',
        en: 'The top command header can now be tucked away and recalled from a compact handle to free more vertical play space.',
        pt: 'A barra superior de comando pode agora ser recolhida e recuperada a partir de uma pega compacta para libertar mais espaço vertical de jogo.',
      },
      {
        type: 'changed',
        en: 'Header resource cards were moved into a dedicated Overview workspace that shows network totals and per-planet stock in one place.',
        pt: 'Os cartões de recursos do cabeçalho passaram para um espaço dedicado de Visão Geral que mostra os totais da rede e o stock por planeta num só local.',
      },
    ],
  },
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
