import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnDestroy,
  NgZone,
  input,
  output,
} from '@angular/core';
import { GameService } from '../../services/game.service';

interface P3D { x: number; y: number; z: number; }
interface Proj { sx: number; sy: number; scale: number; }

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('mapCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly isOpen = input(false);
  readonly closeMap = output<void>();

  azimuth = 0.5;
  elevation = 0.45;
  zoom = 1;
  isDragging = false;

  private lastMx = 0;
  private lastMy = 0;
  private now = Date.now();
  private readonly nowTimer: ReturnType<typeof setInterval>;
  private animFrame = 0;
  private renderingActive = false;
  private readonly pos3D = new Map<string, P3D>();
  private stars: { p: P3D; r: number; bright: number }[] = [];

  constructor(public game: GameService, private zone: NgZone) {
    this.nowTimer = setInterval(() => { this.now = Date.now(); }, 100);
    this.initStars();
  }

  ngAfterViewChecked(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (this.isOpen() && !this.renderingActive && canvas) {
      this.renderingActive = true;
      this.zone.runOutsideAngular(() => this.render());
    }
    if (!this.isOpen() && this.renderingActive) {
      this.renderingActive = false;
      cancelAnimationFrame(this.animFrame);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.nowTimer);
    cancelAnimationFrame(this.animFrame);
  }

  onPointerDown(e: PointerEvent): void {
    this.isDragging = true;
    this.lastMx = e.clientX;
    this.lastMy = e.clientY;
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMx;
    const dy = e.clientY - this.lastMy;
    this.azimuth -= dx * 0.007;
    this.elevation = Math.max(-1.1, Math.min(1.1, this.elevation + dy * 0.007));
    this.lastMx = e.clientX;
    this.lastMy = e.clientY;
  }

  onPointerUp(): void {
    this.isDragging = false;
  }

  onWheel(e: WheelEvent): void {
    this.zoom = Math.max(0.3, Math.min(3, this.zoom * (1 - e.deltaY * 0.001)));
    e.preventDefault();
  }

  private initStars(): void {
    for (let i = 0; i < 320; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 420 + Math.random() * 180;
      this.stars.push({
        p: {
          x: r * Math.sin(phi) * Math.cos(theta),
          y: r * Math.sin(phi) * Math.sin(theta),
          z: r * Math.cos(phi),
        },
        r: 0.5 + Math.random() * 1.3,
        bright: 0.25 + Math.random() * 0.75,
      });
    }
  }

  private hashId(id: string): number {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) {
      h ^= id.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  private getPos3D(id: string, kind: 'planet' | 'enemy'): P3D {
    const key = kind + id;
    const cached = this.pos3D.get(key);
    if (cached) return cached;

    const h = this.hashId(id);
    let p: P3D;
    if (kind === 'planet') {
      const angle = (h & 0x3ff) / 1024 * Math.PI * 2;
      const radius = 80 + ((h >> 10) & 0x1ff) / 512 * 120;
      p = {
        x: Math.cos(angle) * radius,
        y: ((h >> 19) & 0x7f) / 127 * 60 - 30,
        z: Math.sin(angle) * radius,
      };
    } else {
      const angle = (h & 0x3ff) / 1024 * Math.PI * 0.9 - 0.45;
      const radius = 60 + ((h >> 10) & 0x1ff) / 512 * 80;
      p = {
        x: 280 + Math.cos(angle) * radius,
        y: ((h >> 19) & 0x7f) / 127 * 80 - 40,
        z: 60 + Math.sin(angle) * radius,
      };
    }
    this.pos3D.set(key, p);
    return p;
  }

  private project(p: P3D, W: number, H: number): Proj | null {
    const ca = Math.cos(this.azimuth), sa = Math.sin(this.azimuth);
    const rx = p.x * ca + p.z * sa;
    let rz = -p.x * sa + p.z * ca;

    const ce = Math.cos(this.elevation), se = Math.sin(this.elevation);
    const ry = p.y * ce - rz * se;
    rz = p.y * se + rz * ce;

    const camDist = 520 / this.zoom;
    const dz = rz + camDist;
    if (dz < 1) return null;
    const scale = camDist / dz;
    return { sx: W * 0.5 + rx * scale, sy: H * 0.5 + ry * scale, scale };
  }

  private render(): void {
    if (!this.renderingActive) return;
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      this.animFrame = requestAnimationFrame(() => this.render());
      return;
    }

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    if (W < 4 || H < 4) {
      this.animFrame = requestAnimationFrame(() => this.render());
      return;
    }
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }

    const ctx = canvas.getContext('2d')!;
    this.now = Date.now();
    const state = this.game.getState();

    // Background
    ctx.fillStyle = '#010b16';
    ctx.fillRect(0, 0, W, H);

    const nebula = ctx.createRadialGradient(W * 0.35, H * 0.38, 0, W * 0.35, H * 0.38, W * 0.65);
    nebula.addColorStop(0, 'rgba(8,24,52,0.55)');
    nebula.addColorStop(0.5, 'rgba(4,14,30,0.25)');
    nebula.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, W, H);

    // Stars
    for (const star of this.stars) {
      const proj = this.project(star.p, W, H);
      if (!proj) continue;
      const a = star.bright * Math.min(1, proj.scale * 2.5) * 0.85;
      if (a < 0.04) continue;
      ctx.beginPath();
      ctx.arc(proj.sx, proj.sy, Math.min(2.5, star.r * proj.scale * 5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,215,255,${a.toFixed(2)})`;
      ctx.fill();
    }

    // Grid plane
    this.drawGrid(ctx, W, H);

    // Gather entities
    const planets = this.game.getDiscoveredPlanets();
    const enemies = this.game.enemySystems.filter(s =>
      state.discoveredEnemySystemIds.includes(s.id)
    );

    type Item =
      | { kind: 'planet'; data: typeof planets[0]; proj: Proj }
      | { kind: 'enemy'; data: typeof enemies[0]; proj: Proj };

    const items: Item[] = [];
    for (const p of planets) {
      const proj = this.project(this.getPos3D(p.id, 'planet'), W, H);
      if (proj) items.push({ kind: 'planet', data: p, proj });
    }
    for (const s of enemies) {
      const proj = this.project(this.getPos3D(s.id, 'enemy'), W, H);
      if (proj) items.push({ kind: 'enemy', data: s, proj });
    }
    items.sort((a, b) => a.proj.scale - b.proj.scale);

    // Attack route lines + moving fleets
    for (const attack of state.activeAttacks) {
      const src = this.getPos3D(attack.originPlanetId, 'planet');
      const dst = this.getPos3D(attack.targetSystemId, 'enemy');
      this.drawAttackLine(ctx, W, H, src, dst);

      const total = attack.arriveAt - attack.launchedAt;
      const t = total > 0 ? Math.min(1, (this.now - attack.launchedAt) / total) : 1;
      const fp: P3D = {
        x: src.x + (dst.x - src.x) * t,
        y: src.y + (dst.y - src.y) * t,
        z: src.z + (dst.z - src.z) * t,
      };
      const fproj = this.project(fp, W, H);
      if (fproj) this.drawFleet(ctx, fproj);
    }

    // Unit transit lines + moving unit icons (planet → planet)
    for (const transit of state.unitsInTransit) {
      const src = this.getPos3D(transit.fromPlanetId, 'planet');
      const dst = this.getPos3D(transit.toPlanetId, 'planet');
      this.drawTransitLine(ctx, W, H, src, dst);

      const total = transit.arriveAt - transit.departAt;
      const t = total > 0 ? Math.min(1, (this.now - transit.departAt) / total) : 1;
      const tp: P3D = {
        x: src.x + (dst.x - src.x) * t,
        y: src.y + (dst.y - src.y) * t,
        z: src.z + (dst.z - src.z) * t,
      };
      const tproj = this.project(tp, W, H);
      if (tproj) this.drawUnitTransit(ctx, tproj, transit.count);
    }

    // Invasion fleets — lines to their current attack targets then icons
    const invasionFleets = this.game.getInvasionFleets();
    for (const fleet of invasionFleets) {
      const fp3 = this.getInvasionPos3D(fleet.id);
      // Dashed red line to every non-solara discovered planet (threat lines)
      for (const planet of planets.filter(p => p.id !== 'solara')) {
        const dst = this.getPos3D(planet.id, 'planet');
        this.drawInvasionThreatLine(ctx, W, H, fp3, dst);
      }
    }

    // Draw nodes (far → near for painter's algorithm)
    for (const item of items) {
      if (item.kind === 'planet') this.drawPlanet(ctx, item.data.color, item.proj);
      else this.drawEnemy(ctx, item.proj);
    }

    // Invasion fleet nodes (drawn after planets so they appear on top if overlapping)
    for (const fleet of invasionFleets) {
      const fp3 = this.getInvasionPos3D(fleet.id);
      const fproj = this.project(fp3, W, H);
      if (fproj) this.drawInvasionFleet(ctx, fproj, fleet);
    }

    // Labels on top
    for (const item of items) {
      if (item.kind === 'planet') {
        this.drawPlanetLabel(ctx, item.data, item.proj);
        this.drawGarrisonBadge(ctx, item.data.id, item.proj);
      } else {
        this.drawEnemyLabel(ctx, item.data, item.proj);
      }
    }
    for (const fleet of invasionFleets) {
      const fp3 = this.getInvasionPos3D(fleet.id);
      const fproj = this.project(fp3, W, H);
      if (fproj) this.drawInvasionLabel(ctx, fproj, fleet);
    }

    // HUD hint
    ctx.save();
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText('drag to rotate  ·  scroll to zoom', 14, H - 14);
    ctx.restore();

    this.animFrame = requestAnimationFrame(() => this.render());
  }

  private drawGrid(ctx: CanvasRenderingContext2D, W: number, H: number): void {
    const step = 70;
    const range = 350;
    ctx.save();
    ctx.strokeStyle = 'rgba(20,50,80,0.4)';
    ctx.lineWidth = 0.6;
    for (let x = -range; x <= range; x += step) {
      const a = this.project({ x, y: 90, z: -range }, W, H);
      const b = this.project({ x, y: 90, z: range }, W, H);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    for (let z = -range; z <= range; z += step) {
      const a = this.project({ x: -range, y: 90, z }, W, H);
      const b = this.project({ x: range, y: 90, z }, W, H);
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawPlanet(ctx: CanvasRenderingContext2D, color: string, proj: Proj): void {
    const r = Math.max(6, 16 * proj.scale);
    const { sx, sy } = proj;

    const grad = ctx.createRadialGradient(sx - r * 0.32, sy - r * 0.32, r * 0.04, sx, sy, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.18, color);
    grad.addColorStop(0.75, this.darken(color, 0.35));
    grad.addColorStop(1, '#000000');

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 22 * proj.scale;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // Orbit ring
    ctx.save();
    ctx.strokeStyle = color + '55';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.ellipse(sx, sy, r * 1.75, r * 0.42, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, proj: Proj): void {
    const r = Math.max(5, 13 * proj.scale);
    const { sx, sy } = proj;

    const grad = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, r * 0.05, sx, sy, r);
    grad.addColorStop(0, '#ddd6fe');
    grad.addColorStop(0.35, '#8b5cf6');
    grad.addColorStop(0.8, '#3b0764');
    grad.addColorStop(1, '#000000');

    ctx.save();
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 18 * proj.scale;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#ec4899aa';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(sx, sy, r + 5 * proj.scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawFleet(ctx: CanvasRenderingContext2D, proj: Proj): void {
    const r = Math.max(5, 9 * proj.scale);
    const { sx, sy } = proj;

    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, '#fda4af');
    grad.addColorStop(0.5, '#ec4899');
    grad.addColorStop(1, '#831843');

    ctx.save();
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = `bold ${Math.round(r * 1.1)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('⚔', sx, sy + 1);
    ctx.restore();
  }

  private drawAttackLine(ctx: CanvasRenderingContext2D, W: number, H: number, src: P3D, dst: P3D): void {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ec489966';
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const mp: P3D = {
        x: src.x + (dst.x - src.x) * t,
        y: src.y + (dst.y - src.y) * t,
        z: src.z + (dst.z - src.z) * t,
      };
      const p = this.project(mp, W, H);
      if (!p) continue;
      if (!started) { ctx.moveTo(p.sx, p.sy); started = true; }
      else ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawTransitLine(ctx: CanvasRenderingContext2D, W: number, H: number, src: P3D, dst: P3D): void {
    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#22d3ee55';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const mp: P3D = {
        x: src.x + (dst.x - src.x) * t,
        y: src.y + (dst.y - src.y) * t,
        z: src.z + (dst.z - src.z) * t,
      };
      const p = this.project(mp, W, H);
      if (!p) continue;
      if (!started) { ctx.moveTo(p.sx, p.sy); started = true; }
      else ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawUnitTransit(ctx: CanvasRenderingContext2D, proj: Proj, count: number): void {
    const r = Math.max(4, 8 * proj.scale);
    const { sx, sy } = proj;

    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(0.45, '#22d3ee');
    grad.addColorStop(1, '#0e7490');

    ctx.save();
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Shield icon
    ctx.font = `bold ${Math.round(r * 1.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('🛡', sx, sy + 1);

    // Count badge above the icon
    if (count > 1) {
      const badgeR = Math.max(6, r * 0.75);
      const bx = sx + r * 0.8;
      const by = sy - r * 0.8;
      ctx.beginPath();
      ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = '#0e7490';
      ctx.fill();
      ctx.font = `bold ${Math.round(badgeR * 1.1)}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.fillText(String(count), bx, by + 1);
    }
    ctx.restore();
  }

  private getInvasionPos3D(fleetId: string): P3D {
    const key = 'invasion' + fleetId;
    const cached = this.pos3D.get(key);
    if (cached) return cached;
    const h = this.hashId(fleetId);
    const angle = (h & 0x3ff) / 1024 * Math.PI * 2;
    const radius = 175 + ((h >> 10) & 0xff) / 255 * 50;
    const p: P3D = {
      x: Math.cos(angle) * radius,
      y: ((h >> 18) & 0x7f) / 127 * 30 - 15,
      z: Math.sin(angle) * radius,
    };
    this.pos3D.set(key, p);
    return p;
  }

  private drawInvasionThreatLine(ctx: CanvasRenderingContext2D, W: number, H: number, src: P3D, dst: P3D): void {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(251,146,60,0.25)';
    ctx.setLineDash([3, 8]);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const mp: P3D = { x: src.x + (dst.x - src.x) * t, y: src.y + (dst.y - src.y) * t, z: src.z + (dst.z - src.z) * t };
      const p = this.project(mp, W, H);
      if (!p) continue;
      if (!started) { ctx.moveTo(p.sx, p.sy); started = true; }
      else ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawInvasionFleet(ctx: CanvasRenderingContext2D, proj: Proj, fleet: { tier: number; hp: number; maxHp: number }): void {
    const r = Math.max(7, 14 * proj.scale);
    const { sx, sy } = proj;
    const pulse = 0.7 + 0.3 * Math.sin(this.now / 400);

    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, `rgba(255,220,100,${pulse})`);
    grad.addColorStop(0.4, `rgba(249,115,22,${pulse * 0.9})`);
    grad.addColorStop(1, 'rgba(127,29,29,0)');

    ctx.save();
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 20 * proj.scale * pulse;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Skull/threat icon
    ctx.font = `bold ${Math.round(r * 1.1)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('☠', sx, sy + 1);

    // HP arc
    const hpFrac = fleet.hp / fleet.maxHp;
    ctx.strokeStyle = hpFrac > 0.5 ? '#fbbf24' : '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpFrac);
    ctx.stroke();
    ctx.restore();
  }

  private drawInvasionLabel(ctx: CanvasRenderingContext2D, proj: Proj, fleet: { name: string; tier: number; hp: number; maxHp: number }): void {
    const r = Math.max(7, 14 * proj.scale);
    const alpha = Math.min(1, proj.scale * 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    const fontSize = Math.round(Math.min(12, 7 + 5 * proj.scale));
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const lw = ctx.measureText(fleet.name).width + 12;
    const lh = fontSize + 6;
    const lx = proj.sx - lw / 2;
    const ly = proj.sy + r + 6;
    ctx.fillStyle = 'rgba(30,10,5,0.85)';
    this.fillRoundRect(ctx, lx, ly, lw, lh, 3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(fleet.name, proj.sx, ly + lh - 4);
    ctx.font = `${Math.round(fontSize - 2)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = `rgba(239,68,68,0.9)`;
    ctx.fillText(`HP ${fleet.hp}/${fleet.maxHp}`, proj.sx, ly + lh + fontSize + 1);
    ctx.restore();
  }

  private drawGarrisonBadge(ctx: CanvasRenderingContext2D, planetId: string, proj: Proj): void {
    if (planetId === 'solara') return;
    const totalStrength = this.game.getDefensePoints(planetId);
    if (totalStrength <= 0) return;

    const r = Math.max(6, 16 * proj.scale);
    const bx = proj.sx + r + 2;
    const by = proj.sy - r - 2;
    const br = Math.max(7, 9 * proj.scale);
    const alpha = Math.min(1, proj.scale * 3);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = '#14532d';
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = `bold ${Math.round(br * 1.0)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#86efac';
    ctx.fillText(String(totalStrength), bx, by + 1);
    ctx.restore();
  }

  private drawPlanetLabel(ctx: CanvasRenderingContext2D, planet: { name: string; id: string; requiredShipTier: number }, proj: Proj): void {
    const r = Math.max(6, 16 * proj.scale);
    const alpha = Math.min(1, proj.scale * 3.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    const fontSize = Math.round(Math.min(13, 8 + 5 * proj.scale));
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const lw = ctx.measureText(planet.name).width + 12;
    const lh = fontSize + 6;
    const lx = proj.sx - lw / 2;
    const ly = proj.sy + r + 6;
    ctx.fillStyle = 'rgba(1,11,22,0.8)';
    this.fillRoundRect(ctx, lx, ly, lw, lh, 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(planet.name, proj.sx, ly + lh - 4);
    if (planet.id !== 'solara') {
      ctx.font = `${Math.round(fontSize - 2)}px Inter, system-ui, sans-serif`;
      ctx.fillStyle = '#fb923c';
      ctx.fillText(`⚠ ${planet.requiredShipTier}`, proj.sx, ly + lh + fontSize + 1);
    }
    ctx.restore();
  }

  private drawEnemyLabel(ctx: CanvasRenderingContext2D, sys: { name: string; tier: number }, proj: Proj): void {
    const r = Math.max(5, 13 * proj.scale);
    const alpha = Math.min(1, proj.scale * 3.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    const fontSize = Math.round(Math.min(12, 7 + 5 * proj.scale));
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    const lw = ctx.measureText(sys.name).width + 12;
    const lh = fontSize + 6;
    const lx = proj.sx - lw / 2;
    const ly = proj.sy + r + 6;
    ctx.fillStyle = 'rgba(8,2,18,0.85)';
    this.fillRoundRect(ctx, lx, ly, lw, lh, 3);
    ctx.fillStyle = '#c4b5fd';
    ctx.fillText(sys.name, proj.sx, ly + lh - 4);
    ctx.font = `${Math.round(fontSize - 2)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = '#a78bfa80';
    ctx.fillText(`Tier ${sys.tier}`, proj.sx, ly + lh + fontSize + 1);
    ctx.restore();
  }

  private fillRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    if ('roundRect' in ctx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).roundRect(x, y, w, h, r);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx as any).rect(x, y, w, h);
    }
    ctx.fill();
  }

  private darken(hex: string, factor: number): string {
    const c = hex.replace('#', '');
    if (c.length !== 6) return hex;
    const r = Math.round(parseInt(c.slice(0, 2), 16) * factor);
    const g = Math.round(parseInt(c.slice(2, 4), 16) * factor);
    const b = Math.round(parseInt(c.slice(4, 6), 16) * factor);
    return `rgb(${r},${g},${b})`;
  }
}
