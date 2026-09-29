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
    version: '0.8.0',
    releasedAt: '2026-04-26',
    title: {
      en: 'The Void Syndicate',
      pt: 'O Sindicato do Vazio',
    },
    summary: {
      en: 'Enemies are now a living faction that remembers your attacks, escalates in response, and targets your weakest planets. A smarter tutorial, affordable-upgrade highlights, and cleaner combat controls round out the update.',
      pt: 'Os inimigos são agora uma fação viva que recorda os teus ataques, escala em resposta e ataca os teus planetas mais vulneráveis. Um tutorial mais inteligente, indicadores de melhorias acessíveis e controlos de combate mais limpos completam a atualização.',
    },
    items: [
      {
        type: 'added',
        en: 'Faction Anger system: launching attacks raises Void Syndicate anger, which decays over time. At Alert (30+) fleets spawn faster and target weaker planets; at Enraged (60+) fleets spawn at double rate and retaliate against the planet you attacked from.',
        pt: 'Sistema de Fúria da Fação: lançar ataques aumenta a fúria do Sindicato do Vazio, que decai com o tempo. Em Alerta (30+) as frotas aparecem mais depressa e visam planetas mais fracos; em Enfurecido (60+) as frotas aparecem ao dobro da velocidade e retaliam contra o planeta de onde atacaste.',
      },
      {
        type: 'added',
        en: 'Dynamic planet threat levels: undefended raids escalate a planet\'s danger level (up to 2 tiers above its base), while 6 consecutive defended raids de-escalate it. Garrison defense targets scale with the current danger level.',
        pt: 'Níveis de ameaça planetária dinâmicos: raids sem defesa aumentam o nível de perigo de um planeta (até 2 níveis acima da base), enquanto 6 raids defendidas consecutivas o reduzem. Os alvos de defesa da guarnição escalam com o nível de perigo atual.',
      },
      {
        type: 'added',
        en: 'Garrison attrition: raids that overwhelm a garrison destroy a portion of the weakest units based on how much the defense was outmatched.',
        pt: 'Desgaste da guarnição: raids que ultrapassam a guarnição destroem parte das unidades mais fracas com base em quanto a defesa foi superada.',
      },
      {
        type: 'added',
        en: 'Attack strength ratio: offensive strikes now succeed only when total strength meets the required threshold. Casualties are lower at higher overkill ratios, and loot scales up to 1.5× at 3× the required strength.',
        pt: 'Rácio de força de ataque: os ataques ofensivos só têm sucesso quando a força total cumpre o limiar necessário. As baixas são menores com rácios de overkill mais altos, e o saque escala até 1,5× com o triplo da força necessária.',
      },
      {
        type: 'added',
        en: 'Attack result popup: when a strike resolves, a modal shows the outcome, strength ratio, loot received, and unit casualties. Dismiss it to continue.',
        pt: 'Popup de resultado do ataque: quando um ataque é resolvido, um modal mostra o resultado, o rácio de força, o saque obtido e as baixas de unidades. Descarta-o para continuar.',
      },
      {
        type: 'added',
        en: 'Faction Anger widget in the Military tab: a color-coded bar shows current anger (calm/alert/enraged) with a description of the active threat state.',
        pt: 'Widget de Fúria da Fação no separador Militar: uma barra codificada por cores mostra a fúria atual (calmo/alerta/enfurecido) com uma descrição do estado de ameaça ativo.',
      },
      {
        type: 'added',
        en: 'Build quantity buttons (×1, ×5, ×10, Max) in Unit Production to speed up garrison reinforcement.',
        pt: 'Botões de quantidade de construção (×1, ×5, ×10, Máx) na Produção de Unidades para acelerar o reforço da guarnição.',
      },
      {
        type: 'added',
        en: 'All six Military tab sections are now collapsible, and Garrisons, Infrastructure, and Enemy Systems use a two-column grid layout.',
        pt: 'As seis secções do separador Militar são agora recolhíveis, e Guarnições, Infraestrutura e Sistemas Inimigos usam um layout em grelha de duas colunas.',
      },
      {
        type: 'added',
        en: 'Combat log now tracks all event types: enemy raids, player strike results, and Void Syndicate tier changes, color-coded and showing time elapsed.',
        pt: 'O registo de combate acompanha agora todos os tipos de eventos: raids inimigas, resultados de ataques do jogador e mudanças de nível do Sindicato do Vazio, codificados por cores e com o tempo decorrido.',
      },
      {
        type: 'added',
        en: 'Tutorial overhaul: a new mining-until-affordable step prevents the upgrade tutorial from appearing before the player can buy anything. The tutorial popup is now draggable.',
        pt: 'Revisão do tutorial: um novo passo de mineração-até-acessível impede que o tutorial de melhorias apareça antes de o jogador poder comprar alguma coisa. O popup do tutorial é agora arrastável.',
      },
      {
        type: 'changed',
        en: 'Upgrade cards and the Upgrade button light up with a cyan glow when the player can afford them. The Upgrades tab also glows when affordable upgrades are available or when the tutorial is directing the player there.',
        pt: 'Os cartões de melhoria e o botão Melhorar iluminam-se com um brilho ciano quando o jogador os pode pagar. O separador Melhorias também brilha quando há melhorias acessíveis ou quando o tutorial está a direcionar o jogador para lá.',
      },
      {
        type: 'changed',
        en: 'Ship parts in the Launch tab disappear once built. Planet Routes are hidden until the ship is launched.',
        pt: 'As peças da nave no separador Lançamento desaparecem depois de construídas. As Rotas Planetárias ficam ocultas até a nave ser lançada.',
      },
      {
        type: 'changed',
        en: 'The Unlock (All Planets) recipe button is now hidden until the player has launched a ship, and shows the resource cost directly on the button.',
        pt: 'O botão de Desbloquear (Todos os Planetas) nas receitas fica agora oculto até o jogador ter lançado uma nave, e mostra o custo de recursos diretamente no botão.',
      },
      {
        type: 'fixed',
        en: 'Tutorial overlay now shows even when the target element is off-screen (e.g. on a closed mobile panel), falling back to a centered tooltip with a full-screen dim.',
        pt: 'O overlay do tutorial aparece agora mesmo quando o elemento alvo está fora do ecrã (por exemplo, num painel móvel fechado), recorrendo a um tooltip centrado com um esbatimento de ecrã inteiro.',
      },
    ],
  },
  {
    version: '0.7.1',
    releasedAt: '2026-04-04',
    title: {
      en: 'Expanded Locale Support',
      pt: 'Suporte de Idiomas Expandido',
    },
    summary: {
      en: 'Frontier Miner now supports English, Portuguese, Brazilian Portuguese, Spanish, and French across the main interface and settings selector.',
      pt: 'O Frontier Miner passa agora a suportar inglês, português, português do Brasil, espanhol e francês na interface principal e no seletor de idioma.',
    },
    items: [
      {
        type: 'added',
        en: 'New locale catalogs for Spanish, French, and Brazilian Portuguese.',
        pt: 'Novos catálogos de idioma para espanhol, francês e português do Brasil.',
      },
      {
        type: 'changed',
        en: 'The settings dialog locale picker now exposes all supported languages with clearer region labels for Portuguese variants.',
        pt: 'O seletor de idioma nas definições passa agora a expor todos os idiomas suportados com rótulos regionais mais claros para as variantes do português.',
      },
      {
        type: 'changed',
        en: 'Browser language detection now recognizes pt-BR, es, and fr in addition to the existing English and Portuguese defaults.',
        pt: 'A deteção do idioma do browser passa agora a reconhecer pt-BR, es e fr além dos padrões existentes de inglês e português.',
      },
    ],
  },
  {
    version: '0.7.0',
    releasedAt: '2026-04-04',
    title: {
      en: 'Infinite Frontier Expeditions',
      pt: 'Expedições da Fronteira Infinita',
    },
    summary: {
      en: 'Charting the full handcrafted system now unlocks a dedicated explorer program that can keep discovering generated planets, while Fleet Command grows into both a wide 2D logistics chart and a rotatable 3D star view.',
      pt: 'Cartografar todo o sistema artesanal passa agora a desbloquear um programa explorador dedicado que pode continuar a descobrir planetas gerados, enquanto o Comando da Frota cresce para um gráfico logístico 2D largo e uma vista estelar 3D rotativa.',
    },
    items: [
      {
        type: 'added',
        en: 'A dedicated explorer ship with separate engine and fuel upgrades that unlocks after every handcrafted planet has been discovered.',
        pt: 'Uma nave exploradora dedicada com melhorias separadas de motor e combustível que desbloqueia depois de todos os planetas artesanais terem sido descobertos.',
      },
      {
        type: 'added',
        en: 'Repeatable expeditions that generate and permanently save new frontier planets, with each new survey costing more fuel and taking longer than the last.',
        pt: 'Expedições repetíveis que geram e guardam permanentemente novos planetas da fronteira, com cada nova prospeção a custar mais combustível e a demorar mais do que a anterior.',
      },
      {
        type: 'changed',
        en: 'Fleet Command now includes an expedition deck plus switchable 2D and 3D system-map views, with the 2D chart staying draggable and the 3D map supporting click-drag rotation.',
        pt: 'O Comando da Frota passa agora a incluir um painel de expedições e vistas 2D e 3D alternáveis do mapa do sistema, com o gráfico 2D a manter o arrasto e o mapa 3D a suportar rotação ao clicar e arrastar.',
      },
      {
        type: 'changed',
        en: 'Save data now persists generated planets and expedition progress so the infinite frontier survives reloads, exports, and imports.',
        pt: 'Os dados de save passam agora a persistir os planetas gerados e o progresso das expedições para que a fronteira infinita sobreviva a recarregamentos, exportações e importações.',
      },
    ],
  },
  {
    version: '0.6.4',
    releasedAt: '2026-04-04',
    title: {
      en: 'Production Settings Guardrails',
      pt: 'Proteções das Definições em Produção',
    },
    summary: {
      en: 'Production builds now hide dev-only settings correctly while keeping the tools available in local non-production builds.',
      pt: 'As builds de produção passam agora a esconder corretamente as definições apenas para dev, mantendo as ferramentas disponíveis em builds locais não produtivas.',
    },
    items: [
      {
        type: 'fixed',
        en: 'Production build configuration now swaps in the production environment file, so dev-only settings tools no longer appear in deployed builds.',
        pt: 'A configuração da build de produção passa agora a trocar para o ficheiro de ambiente de produção, para que as ferramentas de definições apenas para dev deixem de aparecer nas builds publicadas.',
      },
    ],
  },
  {
    version: '0.6.3',
    releasedAt: '2026-04-04',
    title: {
      en: 'Fleet Filters and Orbital Route Targets',
      pt: 'Filtros da Frota e Alvos de Rota Orbitais',
    },
    summary: {
      en: 'Fleet Command now filters ships by activity and planet traffic, stations can act as route endpoints, and orbit spacing reads less uniformly on the map.',
      pt: 'O Comando da Frota passa agora a filtrar naves por atividade e tráfego planetário, as estações podem servir como destinos de rota, e o espaçamento orbital fica menos uniforme no mapa.',
    },
    items: [
      {
        type: 'added',
        en: 'Route filters in Fleet Command for working ships, idle ships, docked ships, in-transit ships, and planet-specific sending or receiving traffic.',
        pt: 'Filtros de rotas no Comando da Frota para naves em trabalho, paradas, atracadas, em trânsito, e tráfego específico de envio ou receção por planeta.',
      },
      {
        type: 'added',
        en: 'Orbital stations now act as selectable logistics endpoints with their own inventory layer, and the overview tracks stock on surfaces, stations, and ships.',
        pt: 'As estações orbitais passam agora a servir como destinos logísticos selecionáveis com a sua própria camada de inventário, e a visão geral acompanha o stock nas superfícies, nas estações e nas naves.',
      },
      {
        type: 'changed',
        en: 'System map orbit spacing now uses uneven orbital positions so route distance labels and world spacing read less like a perfect ladder.',
        pt: 'O espaçamento orbital no mapa do sistema passa agora a usar posições orbitais desiguais para que as distâncias das rotas e o espaçamento dos mundos pareçam menos uma escada perfeita.',
      },
    ],
  },
  {
    version: '0.6.2',
    releasedAt: '2026-04-04',
    title: {
      en: 'Fleet Maps and Route Stability',
      pt: 'Mapas da Frota e Estabilidade das Rotas',
    },
    summary: {
      en: 'Fleet Command now includes an orbit map, the ships workspace uses the full screen width, and route setup behaves reliably.',
      pt: 'O Comando da Frota passa agora a incluir um mapa orbital, o espaço de naves usa toda a largura do ecrã, e a configuração de rotas comporta-se de forma fiável.',
    },
    items: [
      {
        type: 'added',
        en: 'A system map in Fleet Command that plots discovered planets by orbit, shows route corridors, and tracks ships in transit.',
        pt: 'Um mapa do sistema no Comando da Frota que coloca os planetas descobertos por órbita, mostra os corredores de rota e acompanha as naves em trânsito.',
      },
      {
        type: 'changed',
        en: 'The ships workspace now expands across the full desktop layout instead of staying constrained to the left content column.',
        pt: 'O espaço de naves passa agora a expandir-se por toda a largura do layout em desktop em vez de ficar limitado à coluna de conteúdo da esquerda.',
      },
      {
        type: 'fixed',
        en: 'Route destination dropdowns now keep the selected planet correctly and only list planets that the current ship tier can actually reach.',
        pt: 'Os menus de destino das rotas passam agora a manter corretamente o planeta escolhido e a listar apenas os planetas que o nível atual da nave consegue realmente alcançar.',
      },
    ],
  },
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
