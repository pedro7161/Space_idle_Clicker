# Graph Report - .  (2026-07-22)

## Corpus Check
- 119 files · ~65,583 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1083 nodes · 2675 edges · 61 communities (44 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Upgrade Panel Component
- Planets & Save Data
- Game Service Core (military/combat)
- Map Rendering
- Game Data Definitions
- Fleet Manager Component
- Tutorial Overlay
- Fleet & Expedition Labels
- Ship Route Config
- Planet View Component
- Data Models & Constants
- TypeScript Config
- Fleet Manager Logic
- Upgrade Panel Actions
- Game Component Shell
- Combat & Invasion Models
- Angular Dependencies
- Space Stations & Logistics
- Dev Dependencies (Karma/build)
- Project Docs & i18n
- Reset Dialog & Messages
- Game Component Actions
- Inventory & Persistence
- Settings Dialog
- Frontier Planet Generation
- Karma/Build Options
- Map Planets & Routes
- Automation Unlocks
- Resource Overview Component
- Changelog Dialog
- Logistics & Ship Models
- Angular Workspace Config
- System Map Projection
- Resource Upgrades
- Pipes & Header Components
- App Bootstrap
- Save Transfer Dialog
- Build Config
- npm Scripts
- Military Buildings
- Community 47
- Community 48
- Auto Miners
- Community 50
- Enemy Systems
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 59

## God Nodes (most connected - your core abstractions)
1. `GameService` - 213 edges
2. `FleetManagerComponent` - 118 edges
3. `UpgradePanelComponent` - 112 edges
4. `ItemId` - 47 edges
5. `OwnedShip` - 45 edges
6. `Planet` - 36 edges
7. `ItemCost` - 36 edges
8. `GameState` - 35 edges
9. `PlanetViewComponent` - 34 edges
10. `MapComponent` - 32 edges

## Surprising Connections (you probably didn't know these)
- `README (Frontier Miner)` --references--> `Data-Driven Design architectural pattern (game rules in constants/, generic rendering)`  [EXTRACTED]
  README.md → docs/project-overview.md
- `Frontier Miner Project Overview` --references--> `Localization / i18n message catalogs (EN, PT, PT-BR, ES, FR)`  [EXTRACTED]
  docs/project-overview.md → README.md
- `RouteDraft` --references--> `ItemId`  [EXTRACTED]
  src/app/game/components/fleet-manager/fleet-manager.component.ts → src/app/game/models/resource.model.ts
- `ProjectedTransitMarker` --references--> `OwnedShip`  [EXTRACTED]
  src/app/game/components/fleet-manager/fleet-manager.component.ts → src/app/game/models/ship.model.ts
- `OverviewItem` --references--> `ItemId`  [EXTRACTED]
  src/app/game/components/resource-overview/resource-overview.component.ts → src/app/game/models/resource.model.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Workspace toggle flow: GameComponent coordinates surface/overview/operations/ships workspace switches across sibling components** — src_app_game_game_component, src_app_game_components_stats_header_stats_header_component, src_app_game_components_upgrade_panel_upgrade_panel_component, src_app_game_components_resource_overview_resource_overview_component, src_app_game_components_fleet_manager_fleet_manager_component [INFERRED 0.80]
- **Save import/export flow spans two independent dialog implementations plus GameComponent's file/code handlers** — src_app_game_components_settings_dialog_settings_dialog_component, src_app_game_components_save_transfer_dialog_save_transfer_dialog_component, src_app_game_game_component [INFERRED 0.75]
- **Military/combat subsystem (units, garrisons, invasions, offensive strikes) spans UpgradePanelComponent template, GameService state mutation methods, and the GameState model** — src_app_game_components_upgrade_panel_upgrade_panel_component, src_app_game_services_game_service, src_app_game_models_game_state_model [INFERRED 0.75]

## Communities (61 total, 17 thin omitted)

### Community 1 - "Planets & Save Data"
Cohesion: 0.10
Nodes (32): PLANETS, createPlanetLocation(), isSameLogisticsLocation(), buildDefaultGameState(), buildKnownPlanetIds(), buildNumberRecord(), buildPlanetItemMatrix(), createShipInstance() (+24 more)

### Community 2 - "Game Service Core (military/combat)"
Cohesion: 0.10
Nodes (3): MILITARY_UNIT_DEFS, GameService, Injectable

### Community 3 - "Map Rendering"
Cohesion: 0.09
Nodes (8): MapComponent, onPointerDown(event), onPointerMove(event), onWheel(event), P3D, Proj, Component, ViewChild

### Community 4 - "Game Data Definitions"
Cohesion: 0.08
Nodes (24): AUTO_MINERS, MINER_TEMPLATES, MinerTemplate, RESOURCE_IDS, RESOURCE_LABELS, INVASION_FLEET_NAMES, getMilitaryBuildingDef(), MILITARY_BUILDINGS (+16 more)

### Community 5 - "Fleet Manager Component"
Cohesion: 0.08
Nodes (3): FleetManagerComponent, Component, Ship

### Community 6 - "Tutorial Overlay"
Cohesion: 0.08
Nodes (6): onDragStart(event), Rect, Component, TutorialOverlayComponent, Injectable, TutorialService

### Community 10 - "Planet View Component"
Cohesion: 0.09
Nodes (7): MineralNode, onMineClick(event), PlanetViewComponent, setActiveResource(resourceId), Component, FloatingText, createStationLocation()

### Community 11 - "Data Models & Constants"
Cohesion: 0.17
Nodes (16): INITIAL_MULTIPLIERS, INITIAL_TOOLS, Automation, ExpeditionMission, GeneratedPlanetSeed, Multiplier, MultiplierType, Recipe (+8 more)

### Community 12 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, ES2022, angularCompilerOptions, enableI18nLegacyMessageIdFormat, strictInjectionParameters, strictInputAccessModifiers, strictTemplates, compileOnSave (+20 more)

### Community 13 - "Fleet Manager Logic"
Cohesion: 0.07
Nodes (21): buildShip(definition), clearRoute(ship), FleetActivityFilter, FleetPlanetTrafficFilter, FleetSection, FleetSectionDef, onSystemMapPan(event), ProjectedOrbitPath (+13 more)

### Community 14 - "Upgrade Panel Actions"
Cohesion: 0.07
Nodes (23): addInvasionUnit(unitId), addUnitToAttack(unitId), buildShipPart(part), buyAutoMiner(miner), buyMilitaryBuilding(building), buyUpgrade(upgrade), craft(recipe), launchAttack(systemId) (+15 more)

### Community 16 - "Combat & Invasion Models"
Cohesion: 0.20
Nodes (17): ActiveInvasionRaid, ActiveInvasionStrike, FactionAngerEvent, InvasionFleet, PlanetThreatState, RaidEvent, ActiveAttack, AttackResult (+9 more)

### Community 17 - "Angular Dependencies"
Cohesion: 0.09
Nodes (23): @angular/animations, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/platform-browser-dynamic, @angular/router (+15 more)

### Community 19 - "Dev Dependencies (Karma/build)"
Cohesion: 0.10
Nodes (21): @angular-devkit/build-angular, gh-pages, karma, karma-coverage, karma-firefox-launcher, karma-jasmine, devDependencies, @angular/cli (+13 more)

### Community 20 - "Project Docs & i18n"
Cohesion: 0.12
Nodes (13): Design rationale: avoid a generic passively-scaling idle game, force bottlenecks and prioritization, Core Game Loop (mine -> upgrade -> craft -> automate -> launch -> logistics -> frontier), Data-Driven Design architectural pattern (game rules in constants/, generic rendering), Frontier Miner Project Overview, Deploy Pages Workflow, npm run build:pages script, Tests Workflow, npm run test:ci script (+5 more)

### Community 21 - "Reset Dialog & Messages"
Cohesion: 0.12
Nodes (8): ResetDialogComponent, Component, formatMessage(), GameMessages, GameMessagesService, MESSAGE_CATALOGS, MessageValue, Injectable

### Community 23 - "Game Component Actions"
Cohesion: 0.11
Nodes (5): changeLanguage(dialog, event), grantDevResources(dialog, event), handleImport(dialog, event), importSaveFile(event), environment

### Community 25 - "Settings Dialog"
Cohesion: 0.16
Nodes (5): SettingsDialogComponent, TestHostComponent, Component, Component, SupportedLocale

### Community 27 - "Frontier Planet Generation"
Cohesion: 0.15
Nodes (13): MilitaryBuildingId, TutorialStepId, buildGeneratedPlanet(), buildGeneratedPlanetName(), FRONTIER_BG_GRADIENTS, FRONTIER_NAME_PREFIXES, FRONTIER_NAME_SUFFIXES, FRONTIER_ORBIT_GAPS (+5 more)

### Community 28 - "Karma/Build Options"
Cohesion: 0.16
Nodes (16): options, assets, browser, index, karmaConfig, outputPath, polyfills, scripts (+8 more)

### Community 29 - "Map Planets & Routes"
Cohesion: 0.16
Nodes (4): MapSegment, ProjectedPlanetMarker, RouteLocationOption, Planet

### Community 32 - "Changelog Dialog"
Cohesion: 0.26
Nodes (5): ChangelogDialogComponent, Component, CHANGELOG_ENTRIES, ChangelogEntry, ChangelogItem

### Community 34 - "Logistics & Ship Models"
Cohesion: 0.24
Nodes (8): encodeLogisticsLocation(), LogisticsLocationKind, parseLogisticsLocation(), ItemId, ShipCargo, ShipRoute, ShipStatus, ShipTransit

### Community 36 - "Angular Workspace Config"
Cohesion: 0.17
Nodes (11): analytics, cli, prefix, projectType, root, sourceRoot, newProjectRoot, projects (+3 more)

### Community 40 - "Pipes & Header Components"
Cohesion: 0.25
Nodes (4): Pipe, OverviewItem, i18n Copy/Message Service (copy.messages catalog), FormatNumberPipe

### Community 42 - "App Bootstrap"
Cohesion: 0.29
Nodes (5): AppComponent, Component, appConfig, routes, index.html (app shell)

### Community 43 - "Save Transfer Dialog"
Cohesion: 0.24
Nodes (4): SaveTransferDialogComponent, TestHostComponent, Component, Component

### Community 44 - "Build Config"
Cohesion: 0.22
Nodes (9): build, builder, configurations, defaultConfiguration, production, budgets, buildTarget, fileReplacements (+1 more)

### Community 45 - "npm Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, build:pages, deploy:pages, ng, start, test, test:ci (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.25
Nodes (8): schematics, standalone, style, standalone, standalone, @schematics/angular:component, @schematics/angular:directive, @schematics/angular:pipe

### Community 48 - "Community 48"
Cohesion: 0.29
Nodes (7): serve, test, architect, builder, configurations, defaultConfiguration, builder

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (5): development, buildTarget, extractLicenses, optimization, sourceMap

### Community 52 - "Enemy Systems"
Cohesion: 0.60
Nodes (3): ENEMY_SYSTEMS, getEnemySystemDef(), EnemySystem

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (3): name, private, version

## Knowledge Gaps
- **174 isolated node(s):** `$schema`, `version`, `newProjectRoot`, `projectType`, `style` (+169 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GameService` connect `Game Service Core (military/combat)` to `Upgrade Panel Component`, `Planets & Save Data`, `Map Rendering`, `Game Data Definitions`, `Fleet Manager Component`, `Tutorial Overlay`, `Fleet & Expedition Labels`, `Ship Route Config`, `Build & Purchase Actions`, `Planet View Component`, `Fleet Manager Logic`, `Upgrade Panel Actions`, `Game Component Shell`, `Combat & Invasion Models`, `Space Stations & Logistics`, `Reset Dialog & Messages`, `Resource Production`, `Game Component Actions`, `Inventory & Persistence`, `Planet Actions & Travel`, `Frontier Planet Generation`, `Map Planets & Routes`, `Automation Unlocks`, `Resource Overview Component`, `Expeditions`, `Logistics & Ship Models`, `Unit Deployment`, `Resource Upgrades`, `Crafting & Military Unlocks`, `Pipes & Header Components`, `Route Labels`, `Military Buildings`, `Community 51`, `Enemy Systems`, `Community 58`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **Why does `UpgradePanelComponent` connect `Upgrade Panel Component` to `Game Data Definitions`, `Tutorial Overlay`, `Fleet & Expedition Labels`, `Build & Purchase Actions`, `Upgrade Panel Actions`, `Combat & Invasion Models`, `Reset Dialog & Messages`, `Resource Production`, `Game Component Actions`, `Planet Actions & Travel`, `Map Planets & Routes`, `Automation Unlocks`, `Logistics & Ship Models`, `Unit Deployment`, `Resource Upgrades`, `Crafting & Military Unlocks`, `Military Buildings`, `Auto Miners`, `Community 58`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `FleetManagerComponent` connect `Fleet Manager Component` to `Expeditions`, `Planets & Save Data`, `System Map Projection`, `Fleet & Expedition Labels`, `Ship Route Config`, `Route Labels`, `Build & Purchase Actions`, `Fleet Manager Logic`, `Community 51`, `Reset Dialog & Messages`, `Game Component Actions`, `Map Planets & Routes`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `newProjectRoot` to the rest of the system?**
  _174 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Upgrade Panel Component` be split into smaller, more focused modules?**
  _Cohesion score 0.05087881591119334 - nodes in this community are weakly interconnected._
- **Should `Planets & Save Data` be split into smaller, more focused modules?**
  _Cohesion score 0.10220673635307782 - nodes in this community are weakly interconnected._
- **Should `Game Service Core (military/combat)` be split into smaller, more focused modules?**
  _Cohesion score 0.09988385598141696 - nodes in this community are weakly interconnected._