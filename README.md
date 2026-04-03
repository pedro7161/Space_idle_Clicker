# Frontier Miner

Frontier Miner is a browser-based incremental resource game built with Angular.

The game starts on a safe frontier world where the player manually mines raw materials, unlocks crafting, builds automation, and works toward assembling a first ship. The current direction is now a multi-planet production game where each world has different resource strengths, inventories are planet-local, ships move cargo between worlds, and orbital stations begin to shape a broader logistics network.

## Game Idea

The core loop is:

1. Mine one resource at a time.
2. Upgrade the active resource path.
3. Unlock crafting and refine raw materials.
4. Build automation to reduce manual work.
5. Assemble and launch the first ship.
6. Expand into a broader interplanetary economy with route-based logistics.
7. Build orbital stations to improve cargo throughput and prepare future hub systems.

The design is meant to focus on bottlenecks and tradeoffs rather than passive growth from the start. The player is expected to switch focus often depending on which material is currently blocking progress.

## Current Scope

The current prototype includes:

- manual mining with one active resource at a time
- multiple raw and crafted resources
- planet-local resource inventories
- resource and planet-based upgrades
- automation unlocks
- crafting recipes
- ship-part construction and first-launch progression
- multiple ship tiers with different cargo and speed tradeoffs
- dedicated fleet management workspace
- repeatable ship logistics routes between planets
- orbital station construction on discovered planets
- in-game changelog viewer
- save/load through local storage
- import/export save support
- responsive UI with desktop as the primary target

Planned direction:

- deeper planet specialization
- stronger station and hub systems
- richer logistics and shipping systems
- stronger multi-planet production chains
- more progression depth beyond the first ship

## Tech Stack

- Angular 17
- TypeScript
- Tailwind CSS

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

This project is still evolving. The current codebase already reflects the mining, crafting, automation, ship-building, route logistics, and first orbital-station loop, but the broader hub systems and later-game economy are still in progress.
