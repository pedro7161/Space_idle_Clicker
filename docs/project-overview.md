# Frontier Miner Project Overview

This document is the versioned project brief for the repository. It should stay aligned with the implemented game and the current product direction.

## Purpose

Frontier Miner is a desktop-first incremental mining and progression game built in Angular.

The player starts on a safe frontier world, manually gathers resources, unlocks refinement and automation, builds ship parts, and gradually grows into a broader multi-planet production game with local inventories, tiered ships, orbital logistics, and late-game frontier resources.

The design goal is not a generic idle game where everything scales passively from the beginning. The game should create bottlenecks, force prioritization, and make the player decide which resource chain matters most right now.

## Core Game Loop

1. Manually mine one resource at a time.
2. Upgrade that resource path.
3. Unlock crafting and convert raw materials into refined ones.
4. Build automation to reduce manual work.
5. Use crafted materials to support ship construction and first launch.
6. Open the operations workspace to manage local resources, upgrades, crafting, automation, and launch planning without the mining surface taking over the screen.
7. Move resources between planets through assigned ship routes.
8. Build orbital stations to improve logistics and prepare future hub systems.
9. Push into deeper-tier planets for advanced resources, stronger production chains, and uranium-heavy late-game scaling.

## Product Clarifications

These are current design decisions and should override older wording if there is a conflict:

- The starting world is safe, not hostile in the sense of active enemies.
- `Solara Basin` is the starter environment for learning the basics.
- Desktop/PC is the primary target layout.
- Mobile support is valuable, but it must not degrade the desktop experience.
- Planet inventories are local, not globally shared.
- The old cargo-hold area on the mining surface is now an orbital station module instead of a crafted-item storage panel.
- The ships menu unlocks after the player owns a ship and replaces the left-side mining workspace when opened.
- The operations panel can now expand into its own full workspace and replace the left-side mining workspace when opened.
- In the expanded operations workspace, the local planet ledger is accessed through a dedicated `Resources` tab instead of staying pinned above the other controls.
- Resource totals no longer live in the header; they are accessed through a dedicated Overview workspace.
- Orbital stations are per-planet logistics upgrades and should naturally evolve into future hub mechanics.
- The top command header can be collapsed upward to free more vertical play space.
- Upgrade lists should not dump every available card at once; they should stage the next active upgrades and fade completed chains.

## Current Progression Structure

The currently implemented progression is:

1. `Solara Basin`
   Starter world for carbon, ferrite, oxygen, early crafting, automation, and first-ship assembly.
2. First launch
   Unlocks ship ownership, fleet management, and interplanetary logistics.
3. Mid-system expansion
   Specialized worlds introduce copper, silica, hydrogen, and titanium as new bottleneck drivers.
4. Logistics layer
   Ship routes move planet-local inventory, while orbital stations improve dispatch and travel efficiency.
5. Deep frontier push
   Higher-tier ships open access to rare crystal and uranium planets, ending in `Helion Breach` as the current highest-tier destination.
6. Late-game payoff
   Uranium is meant to justify significantly stronger upgrades than the standard early-resource loop.

## Current Implemented Systems

The current project includes:

- one active manual mining mode at a time
- multiple raw resources and crafted materials
- specialized late-frontier raw resources including copper, silica, hydrogen, titanium, rare crystal, and uranium
- per-planet inventories for raw and crafted items
- per-resource upgrade paths with expanded mid/late-game scaling
- staged upgrade presentation that shows the next one or two active upgrade cards and fades completed chains
- per-resource automation
- planet-specific resource access and multipliers
- ship-part construction
- first-ship launch progression
- multiple ship tiers with different cargo and travel-speed profiles
- higher-tier ships for deeper planets
- dedicated overview workspace with network totals and per-planet inventory breakdowns
- dedicated ships workspace with route management, shipyard, and ship stats views
- dedicated operations workspace with resources, upgrades, crafting, automation, and launch views
- repeatable logistics routes between discovered planets
- orbital station construction with route-efficiency bonuses
- collapsible top header with a restore handle
- in-game changelog dialog
- save/load through local storage
- save import/export
- language catalogs for future localization
- responsive UI with desktop as the main target

## Current UX Direction

- The main mining surface should stay visually dominant.
- The right-side operations panel is a desktop sidebar and a mobile drawer by default.
- The header should stay focused on context and controls, not dense stock grids.
- Cross-planet stock visibility belongs in a dedicated overview page instead of the header.
- The operations panel can expand into a full systems workspace when the player wants to focus on management instead of mining.
- The expanded operations workspace should stay tab-driven, with the local ledger available in its own `Resources` view instead of permanently consuming vertical space.
- The ships workspace should feel like a true page swap, not a small embedded subsection.
- The operations workspace should follow the same page-swap logic as ships.
- Resource summaries can be collapsed on smaller screens.
- The top header can collapse to maximize vertical space, but it must always remain recoverable from a visible handle.
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
- `StatsHeaderComponent` — resource display, active resource stats, label generation, workspace button labels, and mobile toggle labels
- `PlanetViewComponent` — mineral node generation, mining click handling, floating text spawning, mine animation, orbital station panel state, item labels/colors, and planet multipliers
- `UpgradePanelComponent` — tab structure, staged upgrade presentation, inventory labels/colors, workspace toggle labels, upgrade/craft/automation delegation, ship part building, planet travel, and all label generators
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
