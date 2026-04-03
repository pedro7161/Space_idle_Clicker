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
5. Use crafted materials to support ship construction and later expansion.
6. Grow into a stronger interplanetary resource network.

## Product Clarifications

These are current design decisions and should override older wording if there is a conflict:

- The starting world is safe, not hostile in the sense of active enemies.
- `Solara Basin` is the starter environment for learning the basics.
- Desktop/PC is the primary target layout.
- Mobile support is valuable, but it must not degrade the desktop experience.
- The shared cargo hold should feel anchored to the bottom of the playfield.
- The shared cargo hold should only appear after the player unlocks the crafting/shared inventory layer.

## Current Implemented Systems

The current project includes:

- one active manual mining mode at a time
- multiple raw resources and crafted materials
- per-resource upgrade paths
- per-resource automation
- planet-specific resource multipliers
- ship-part construction
- save/load through local storage
- save import/export
- language catalogs for future localization
- responsive UI with desktop as the main target

## Current UX Direction

- The main mining surface should stay visually dominant.
- The right-side operations panel is a desktop sidebar and a mobile drawer.
- Resource summaries can be collapsed on smaller screens.
- Dense progression controls should scroll inside their own panels instead of stretching the full layout.
- Important unlock-driven UI should only appear when it becomes relevant.

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
- `GameService` — core game logic: initialization, mining, upgrades, crafting, auto miners, ship parts, planet travel, save/load/export/import, reset, visibility checks, affordability, and progress scoring
- `AppComponent` — root component creation and router outlet rendering
- `GameComponent` — start screen flow, fresh start, reset dialog, settings dialog, mobile panel toggles, save import handling, and destroy lifecycle
- `StatsHeaderComponent` — resource display, active resource stats, label generation, and mobile toggle labels
- `PlanetViewComponent` — mineral node generation, mining click handling, floating text spawning, mine animation, cargo hold toggle, resource/crafted amounts, and planet multipliers
- `UpgradePanelComponent` — tab structure, inventory labels/colors, upgrade/craft/automation delegation, ship part building, planet travel, and all label generators
- `ResetDialogComponent` — confirm/cancel output emissions and backdrop click handling
- `SettingsDialogComponent` — input binding, feedback updates, import/export/locale change emissions, and file download
- `SaveTransferDialogComponent` — export value binding, import emission, clipboard copy success/failure feedback

## Deployment

The project is configured for GitHub Pages deployment.

Relevant scripts:

```bash
npm run build:pages
npm run deploy:pages
```

Base path:

- `/Space_idle_Clicker/`

## Roadmap Direction

Likely next areas of depth:

- stronger planet specialization
- deeper crafting chains
- logistics and shipping between planets
- space-station or shared routing systems
- richer mid-game and post-first-ship progression

## Notes For Future Changes

When gameplay or UX intent changes, this document should be updated with the new rule so the repository keeps a stable source of truth even though `.claude/game-context.md` stays local and ignored.
