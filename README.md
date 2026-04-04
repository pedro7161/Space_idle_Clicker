# Frontier Miner

Frontier Miner is a browser-based incremental resource game built with Angular.

The game starts on a safe frontier world where the player manually mines raw materials, unlocks crafting, builds automation, and works toward assembling a first ship. It now pushes into a broader multi-planet production game where worlds have local surface inventories, orbital stations hold their own stock, ships carry live cargo between endpoints, late-frontier planets drive the uranium-tier economy, and a dedicated explorer program can keep generating new worlds beyond the handcrafted system.

## Game Idea

The core loop is:

1. Mine one resource at a time.
2. Upgrade the active resource path.
3. Unlock crafting and refine raw materials.
4. Build automation to reduce manual work.
5. Assemble and launch the first ship.
6. Open the operations deck to manage local resources, upgrades, crafting, automation, and launch planning in a larger workspace.
7. Expand into a broader interplanetary economy with route-based logistics.
8. Build orbital stations to create new logistics destinations, separate orbital storage, and improve cargo throughput.
9. Push into deeper planets for titanium, rare crystal, and uranium to drive late-game scaling.
10. Finish charting the handcrafted system, commission an explorer skiff, and run repeatable expeditions that discover generated frontier planets with rising fuel and time costs.

The design is meant to focus on bottlenecks and tradeoffs rather than passive growth from the start. The player is expected to switch focus often depending on which material is currently blocking progress.

## Current Scope

The current prototype includes:

- manual mining with one active resource at a time
- multiple raw and crafted resources
- specialized deep-frontier resources including copper, silica, hydrogen, titanium, rare crystal, and uranium
- planet-local resource inventories
- orbital-station inventories and ship cargo that hold live network stock outside the planet surface
- staged resource upgrades that only surface the next active one or two cards at a time
- resource and planet-based upgrades with stronger late-game scaling
- automation unlocks
- crafting recipes
- ship-part construction and first-launch progression
- multiple ship tiers with different cargo and speed tradeoffs
- higher-tier ships required for deeper planets
- dedicated overview workspace for network totals plus per-planet, per-station, and fleet-cargo stock
- dedicated fleet management workspace with route filters, an expedition deck, and a system map
- expandable operations workspace with dedicated resources, upgrades, crafting, automation, and launch tabs
- repeatable ship logistics routes between planetary surfaces and orbital stations
- orbital station construction on discovered planets with separate orbital storage
- dedicated explorer ship with engine and fuel upgrade paths
- repeatable frontier expeditions that generate additional planets and persist them in the save state
- expandable, draggable, horizontally scrollable system map for larger frontier layouts
- collapsible top command header to free vertical space
- in-game changelog viewer
- save/load through local storage
- import/export save support
- responsive UI with desktop as the primary target

## Current Progression Snapshot

The current playable structure looks like this:

1. `Solara Basin` teaches the basic loop with local mining, early crafting, automation, and first-ship assembly.
2. The first launch unlocks fleet management and lets the player move materials between discovered planets and orbital stations.
3. Mid-system worlds specialize into chains such as copper, silica, hydrogen, and titanium.
4. Orbital stations split surface stock from orbital stock, open new route targets, and improve shipping efficiency.
5. Deep frontier progression ends in `Helion Breach`, a highest-tier uranium world meant to justify much stronger upgrade returns.
6. Once every handcrafted world is charted, the explorer program unlocks with its own ship build, speed upgrades, and fuel upgrades.
7. Successful expeditions keep adding generated frontier planets, with each search taking longer and demanding more fuel than the last.

Planned direction:

- deeper planet specialization
- stronger station and hub systems
- richer logistics and shipping systems
- stronger multi-planet production chains
- richer late-game systems layered on top of the infinite frontier

## Tech Stack

- Angular 17
- TypeScript 5.2
- Tailwind CSS 3.4

## Run Locally

```bash
npm install
npm start
```

Then open `http://localhost:4200/`.

## Build

```bash
npm run build
```

## GitHub Pages

This repository deploys to GitHub Pages through GitHub Actions after the `Tests`
workflow succeeds on pushes to `main`.

Relevant local scripts:

```bash
npm run build:pages
npm run deploy:pages
```

The Pages build uses the repository base path:

- `/Space_idle_Clicker/`
- GitHub workflow: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)

## Project Docs

Repo-level project documentation lives here:

- [docs/project-overview.md](docs/project-overview.md)

## Status

This project is still evolving. The current codebase already reflects the mining, overview, crafting, automation, ship-building, filtered fleet command, surface-and-station route logistics, deep-resource planets, explorer expeditions, generated frontier planets, and expandable system-map loop, but broader hub automation and later-game economy layers are still in progress.
