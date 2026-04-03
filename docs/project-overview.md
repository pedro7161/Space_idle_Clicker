# Frontier Miner Project Overview

This document is the versioned project brief for the repository. It should stay aligned with the implemented game and the current product direction.

## Purpose

Frontier Miner is a desktop-first incremental mining and progression game built in Angular.

The player starts on a safe frontier world, manually gathers resources, unlocks refinement and automation, builds ship parts, and gradually grows into a broader multi-planet production game.

The design goal is not a generic idle game where everything scales passively from the beginning. The game should create bottlenecks, force prioritization, and make the player decide which resource chain matters most right now.

## Core Game Loop

1. Manually mine one resource at a time.
2. Upgrade that resource path.
3. Unlock crafting and convert raw materials into refined ones.
4. Build automation to reduce manual work.
5. Use crafted materials to support ship construction and first launch.
6. Move resources between planets through assigned ship routes.
7. Build orbital stations to improve logistics and prepare future hub systems.

## Product Clarifications

These are current design decisions and should override older wording if there is a conflict:

- The starting world is safe, not hostile in the sense of active enemies.
- `Solara Basin` is the starter environment for learning the basics.
- Desktop/PC is the primary target layout.
- Mobile support is valuable, but it must not degrade the desktop experience.
- Planet inventories are local, not globally shared.
- The old cargo-hold area on the mining surface is now an orbital station module instead of a crafted-item storage panel.
- The ships menu unlocks after the player owns a ship and replaces the left-side mining workspace when opened.
- Orbital stations are per-planet logistics upgrades and should naturally evolve into future hub mechanics.

## Current Implemented Systems

The current project includes:

- one active manual mining mode at a time
- multiple raw resources and crafted materials
- per-planet inventories for raw and crafted items
- per-resource upgrade paths
- per-resource automation
- planet-specific resource multipliers
- ship-part construction
- first-ship launch progression
- multiple ship tiers with different cargo and travel-speed profiles
- dedicated ships workspace with route management, shipyard, and ship stats views
- repeatable logistics routes between discovered planets
- orbital station construction with route-efficiency bonuses
- in-game changelog dialog
- save/load through local storage
- save import/export
- language catalogs for future localization
- responsive UI with desktop as the main target

## Current UX Direction

- The main mining surface should stay visually dominant.
- The right-side operations panel is a desktop sidebar and a mobile drawer.
- The ships workspace should feel like a true page swap, not a small embedded subsection.
- Resource summaries can be collapsed on smaller screens.
- Dense progression controls should scroll inside their own panels instead of stretching the full layout.
- Important unlock-driven UI should only appear when it becomes relevant.
- Planet-surface support UI should reinforce local-planet management rather than duplicate the fleet screen.

## Technical Structure

The main game code lives under `src/app/game`.

Key areas:

- `services/`
  Central game logic and state handling.
- `constants/`
  Data-driven game definitions such as resources, planets, recipes, upgrades, and automations.
- `components/`
  Main gameplay UI including the mining surface, header, settings, dialogs, and progression panels.
- `i18n/`
  Localized message catalogs and message-loading helpers.
- `models/`
  Shared domain types.
- `pipes/`
  Presentation helpers such as number formatting.

## Important Architectural Rules

- Prefer data-driven systems over hardcoded one-off logic.
- Keep business logic centralized in services instead of scattering it across templates.
- Reuse generic rendering patterns for resources, upgrades, recipes, and automation where possible.
- Keep the code DRY and avoid duplicating gameplay rules in multiple UI components.
- Treat localization strings as data, not inline template copy.

## Save Model

The game currently uses browser local storage as the main persistence layer.

Supported persistence features:

- automatic local save
- import from file or save code
- export to file or save code

There is no backend database at the moment.

## Testing

The project uses Karma with Jasmine for unit testing. Tests run in Firefox Headless by default (configured in `karma.conf.js`).

To run the full test suite:

```bash
npm test
```

Test coverage includes:

- `FormatNumberPipe` — number formatting thresholds (K, M, B, T suffixes)
- `GameService` — core game logic: initialization, mining, upgrades, crafting, auto miners, ship parts, planet travel, fleet routes, space stations, save/load/export/import, reset, visibility checks, affordability, and progress scoring
- `AppComponent` — root component creation and router outlet rendering
- `GameComponent` — start screen flow, fresh start, reset dialog, settings dialog, ships workspace toggles, mobile panel toggles, save import handling, and destroy lifecycle
- `StatsHeaderComponent` — resource display, active resource stats, label generation, ships button labels, and mobile toggle labels
- `PlanetViewComponent` — mineral node generation, mining click handling, floating text spawning, mine animation, orbital station panel state, item labels/colors, and planet multipliers
- `UpgradePanelComponent` — tab structure, inventory labels/colors, upgrade/craft/automation delegation, ship part building, planet travel, and all label generators
- `ResetDialogComponent` — confirm/cancel output emissions and backdrop click handling
- `SettingsDialogComponent` — input binding, feedback updates, import/export/locale change emissions, and file download
- `SaveTransferDialogComponent` — export value binding, import emission, clipboard copy success/failure feedback

## Deployment

The project is configured for GitHub Pages deployment through GitHub Actions.
The Pages workflow runs after the `Tests` workflow succeeds on pushes to `main`.

Relevant scripts:

```bash
npm run build:pages
npm run deploy:pages
```

Base path:

- `/Space_idle_Clicker/`
- Workflow: `.github/workflows/deploy-pages.yml`

## Roadmap Direction

Likely next areas of depth:

- stronger planet specialization
- deeper crafting chains
- station-to-station hub systems
- richer routing controls and multi-stop logistics
- richer mid-game and post-first-ship progression

## Notes For Future Changes

When gameplay or UX intent changes, this document should be updated with the new rule so the repository keeps a stable source of truth even though `.claude/game-context.md` stays local and ignored.
