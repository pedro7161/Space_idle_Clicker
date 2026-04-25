import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TutorialService } from '../../services/tutorial.service';

type Rect = { left: number; top: number; width: number; height: number; right: number; bottom: number };

@Component({
  selector: 'app-tutorial-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutorial-overlay.component.html',
})
export class TutorialOverlayComponent {
  private readonly destroyRef = inject(DestroyRef);

  step = this.tutorial.activeStep$.value;
  targetRect: Rect | null = null;
  tooltipStyle: Record<string, string> = this.centeredTooltipStyle();
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;

  private rafId: number | null = null;
  private userDragPos: { left: number; top: number } | null = null;

  constructor(public tutorial: TutorialService) {
    this.tutorial.activeStep$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(step => {
        this.step = step;
        this.startTracking();
      });
  }

  next(): void {
    this.tutorial.next();
  }

  skip(): void {
    this.tutorial.skip();
  }

  onDragStart(e: PointerEvent): void {
    e.preventDefault();
    const startLeft = parseInt(this.tooltipStyle['left'] ?? '0', 10);
    const startTop = parseInt(this.tooltipStyle['top'] ?? '0', 10);
    const startX = e.clientX;
    const startY = e.clientY;

    const onMove = (ev: PointerEvent) => {
      const newLeft = Math.max(0, Math.min(window.innerWidth - 332, startLeft + ev.clientX - startX));
      const newTop = Math.max(0, Math.min(window.innerHeight - 60, startTop + ev.clientY - startY));
      this.userDragPos = { left: newLeft, top: newTop };
      this.tooltipStyle = { ...this.tooltipStyle, left: `${newLeft}px`, top: `${newTop}px` };
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }

  private startTracking(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.userDragPos = null;

    if (!this.step) {
      this.targetRect = null;
      this.tooltipStyle = {};
      return;
    }

    const tick = () => {
      this.updateTargetRect();
      this.rafId = requestAnimationFrame(tick);
    };

    tick();
  }

  private updateTargetRect(): void {
    this.computeLayout();
    if (this.userDragPos !== null) {
      this.tooltipStyle = {
        ...this.tooltipStyle,
        left: `${this.userDragPos.left}px`,
        top: `${this.userDragPos.top}px`,
      };
    }
  }

  private computeLayout(): void {
    if (!this.step) {
      this.targetRect = null;
      this.tooltipStyle = this.centeredTooltipStyle();
      return;
    }

    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    const el = document.querySelector(`[data-tutorial-id="${this.step.anchorId}"]`) as HTMLElement | null;
    if (!el) {
      this.targetRect = null;
      this.tooltipStyle = this.centeredTooltipStyle();
      return;
    }

    const rect = el.getBoundingClientRect();

    // Element has no size or is fully outside the viewport — show without anchor highlight
    const isOffscreen =
      rect.width <= 0 || rect.height <= 0 ||
      rect.right <= 0 || rect.bottom <= 0 ||
      rect.left >= this.viewportWidth || rect.top >= this.viewportHeight;

    if (isOffscreen) {
      this.targetRect = null;
      this.tooltipStyle = this.centeredTooltipStyle();
      return;
    }

    const padding = 10;
    const left = Math.max(0, rect.left - padding);
    const top = Math.max(0, rect.top - padding);
    const right = Math.min(this.viewportWidth, rect.right + padding);
    const bottom = Math.min(this.viewportHeight, rect.bottom + padding);

    this.targetRect = { left, top, width: right - left, height: bottom - top, right, bottom };

    const cardWidth = 320;
    const cardPadding = 12;
    const preferredLeft = Math.min(this.viewportWidth - cardWidth - 12, this.targetRect.left);
    const preferredTop = this.targetRect.bottom + 12;
    const fitsBelow = preferredTop + 160 < this.viewportHeight;

    const tooltipLeft = Math.max(12, preferredLeft);
    const tooltipTop = fitsBelow ? preferredTop : Math.max(12, this.targetRect.top - 12 - 160);

    this.tooltipStyle = {
      left: `${tooltipLeft}px`,
      top: `${tooltipTop}px`,
      width: `${cardWidth}px`,
      padding: `${cardPadding}px`,
    };
  }

  private centeredTooltipStyle(): Record<string, string> {
    const cardWidth = 320;
    return {
      left: `${Math.max(12, Math.round((window.innerWidth - cardWidth) / 2))}px`,
      top: `${Math.max(12, Math.round(window.innerHeight * 0.35))}px`,
      width: `${cardWidth}px`,
      padding: '12px',
    };
  }
}
