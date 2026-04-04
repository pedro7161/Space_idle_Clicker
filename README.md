# Frontier Miner

A browser-based incremental resource management game built with Angular. Start on a safe frontier world mining raw materials, unlock crafting and automation, then expand into a multi-planet production economy with orbital logistics and procedural frontier exploration.

## Overview

Frontier Miner combines incremental gameplay with strategic resource management. The core loop emphasizes bottlenecks and tradeoffs: you must prioritize which resource chains unlock progression, balance manual work with automation, and optimize logistics across multiple planets. Gameplay spans from intimate single-planet mining to managing a complex interplanetary trade network.

### Key Gameplay Pillars

- **Manual Mining**: Click to gather resources one at a time with upgrade scaling
- **Crafting & Automation**: Convert raw materials into refined goods; unlock automation to reduce manual grind
- **Multi-Planet Logistics**: Route ships between planetary surfaces and orbital stations to move resources
- **Progression Gates**: Each advancement unlocks new systems; designed to create meaningful decision points
- **Procedural Exploration**: After charting the main system, generate infinite frontier worlds through expeditions

## Features

### Core Game Systems

- **Resource Management**
  - Manual mining with active resource selection and click-based gathering
  - Multiple raw resources (carbon, ferrite, oxygen, copper, silica, hydrogen) and crafted materials
  - Per-planet inventories for local resource tracking
  - Staged upgrade presentation showing next 1–2 available cards to reduce cognitive load

- **Crafting & Automation**
  - Recipe-driven crafting to convert raw into refined materials
  - Per-resource automation with scaling efficiency improvements
  - Crafting chains that enable late-game progression

- **Ship Building & Logistics**
  - Ship-part construction as a progression gate
  - Multiple ship tiers with different cargo capacity and travel-speed profiles
  - Route-based logistics between planetary surfaces and orbital stations
  - Live ship cargo as a third inventory layer during transport
  - Route filtering by activity status, cargo state, and planet

- **Multi-Planet Exploration**
  - Handcrafted system including starter world (Solara Basin), mid-tier worlds with specialized resources, and deep-frontier planets
  - Orbital stations as per-planet upgrades that unlock separate orbital inventory and route efficiency bonuses
  - Deep-frontier resources (titanium, rare crystal, uranium) with higher-tier scaling
  - Explorer ship program with engine and fuel upgrade paths
  - Procedurally generated frontier planets seeded and persisted in save data

- **UI & User Experience**
  - Dedicated Overview workspace showing network totals and all inventory layers
  - Dedicated Ships workspace with route management, fleet activity, 2D orbital chart, and 3D star map
  - Expandable Operations panel with Resources, Upgrades, Crafting, Automation, and Launch tabs
  - Collapsible top header to maximize gameplay screen space
  - In-game Changelog viewer
  - Responsive design optimized for desktop; mobile drawer support

- **Localization**
  - Localized UI for English, Portuguese, Brazilian Portuguese, Spanish, and French
  - Language-driven message catalogs for future expansion

- **Persistence**
  - Automatic local storage save every 10 seconds
  - Manual save import/export via file or shareable save code
  - Game reset with confirmation dialog
  - Offline support for up to 4 hours of offline progression calculation

## Tech Stack

- **Framework**: Angular 17
- **Language**: TypeScript 5.2
- **Styling**: Tailwind CSS 3.4
- **State Management**: RxJS observables (no Redux/NgRx)
- **Testing**: Karma + Jasmine
- **Deployment**: GitHub Pages via GitHub Actions

## Installation

### Prerequisites

- Node.js (v18+) and npm

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd MyWebApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

### Local Development Server

Start the development server with hot-reload:

```bash
npm start
```

Then open `http://localhost:4200/` in your browser.

### Build for Production

```bash
npm run build
```

Output is placed in `dist/my-web-app/browser/`.

### Running Tests

Run the full test suite:

```bash
npm test
```

Run tests once in headless Firefox (CI mode):

```bash
npm run test:ci
```

Tests cover core game logic (GameService), UI components, pipes, and state management. See `docs/project-overview.md` for detailed test coverage information.

## Architecture Overview

### Directory Structure

```
src/app/game/
├── services/          # Core game logic (GameService)
├── models/            # TypeScript domain types and interfaces
├── constants/         # Data-driven game definitions
├── components/        # UI components (mining surface, panels, dialogs)
├── pipes/             # Presentation helpers (number formatting)
├── i18n/              # Localization catalogs and loaders
└── storage/           # Save/load and persistence logic
```

### Key Architectural Patterns

- **Data-Driven Design**: Game rules live in `constants/` (resources, planets, recipes, upgrades, ships). Components render generic patterns.
- **Centralized State**: `GameService` holds game state and business logic. Components consume state via observables.
- **Service-First Logic**: Business logic stays in services, not scattered across templates.
- **Reactive Updates**: RxJS `BehaviorSubject` ensures all subscribers see consistent state.

### Core Services

- **GameService** (`src/app/game/services/game.service.ts`)
  - Manages game state (resources, planets, ships, routes, expeditions)
  - Handles mining, crafting, upgrades, automation, and ship logistics
  - Coordinates save/load and offline calculation
  - Exposes state and actions as RxJS observables

### Game State Structure

The `GameState` interface includes:

- `planetInventories`: Per-planet resource storage
- `stationInventories`: Per-orbital-station resource storage
- `ships`, `shipRoutes`: Fleet and logistics routes
- `spaceStations`: Orbital station definitions
- `generatedPlanets`: Seeded frontier planets
- `upgradeLevels`, `autoMinerCounts`: Progression tracking
- `discoveredPlanetIds`, `shipLaunched`: Unlock flags

See `src/app/game/models/game-state.model.ts` for the full type definition.

### Component Architecture

**Major Components:**

- `PlanetViewComponent`: Mining surface with clickable ore nodes and floating text feedback
- `UpgradePanelComponent`: Tabbed interface for upgrades, crafting, automation, and ship building
- `FleetManagerComponent`: Route management, 2D/3D map, and expedition interface
- `ResourceOverviewComponent`: Network-wide inventory visibility
- `StatsHeaderComponent`: Active resource stats and workspace toggles

**Dialog Components:**

- `SettingsDialogComponent`: Language, save/load, reset
- `SaveTransferDialogComponent`: Export/import via file or code
- `ChangelogDialogComponent`: In-game release notes
- `ResetDialogComponent`: Confirmation for full game reset

## Gameplay Progression

1. **Solara Basin**: Learn basics—mine, upgrade, craft, automate, build first ship.
2. **First Launch**: Unlock fleet management and interplanetary routes.
3. **Mid-System Expansion**: Discover specialized planets (copper, silica, hydrogen, titanium sources).
4. **Logistics Layer**: Use orbital stations and ship routes to move resources efficiently.
5. **Deep Frontier**: Access higher-tier planets and rare resources (uranium).
6. **Late-Game Scaling**: Uranium-driven upgrades significantly boost progression.
7. **Infinite Frontier**: Unlock explorer program and generate new procedural planets indefinitely.

See `docs/project-overview.md` for detailed design documentation.

## Contributing

### Code Style

- Use TypeScript with strict type checking
- Keep business logic in services, UI logic in components
- Follow Angular style guide (one component/service per file)
- Write tests for new features using Karma + Jasmine

### Before Submitting a PR

1. Run the test suite: `npm test` or `npm run test:ci`
2. Ensure no TypeScript errors: `npm run build`
3. Keep the project philosophy in mind: prefer data-driven systems over hardcoded logic
4. Update `docs/project-overview.md` if gameplay design changes

### GitHub Pages Deployment

Pushes to `main` trigger automated GitHub Actions:

1. Run tests (`npm run test:ci`)
2. Build for Pages: `npm run build:pages`
3. Deploy to `/Space_idle_Clicker/` on GitHub Pages

See `.github/workflows/deploy-pages.yml` for workflow details.

## Save Format & Storage

- **Storage Method**: Browser localStorage
- **Save Frequency**: Every 10 seconds automatically
- **Offline Calculation**: Up to 4 hours supported
- **Manual Control**: Import/export via file (.json) or shareable save code (compressed text)
- **Version Management**: Save format includes version field for future migrations

## Resources & Documentation

- **Project Overview**: `docs/project-overview.md` — Detailed design brief, progression structure, and architectural rules
- **GitHub Issues**: Feature requests, bug reports, and roadmap items
- **GitHub Pages**: Live deployment at https://space-miner.github.io/Space_idle_Clicker/

## Roadmap

Likely next areas of development:

- Stronger planet specialization and resource chains
- Deeper crafting chains with multi-step recipes
- Station-to-station hub systems for advanced logistics
- Multi-stop routing and order-based logistics
- Frontier anomalies and authored surprises in generated worlds
- Polish for 3D map while preserving clear 2D logistics readability

## License

See LICENSE file (if present).

---

**Questions?** Open an issue or check the project documentation in `docs/`.
