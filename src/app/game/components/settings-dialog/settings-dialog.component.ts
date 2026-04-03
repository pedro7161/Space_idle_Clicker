import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameMessagesService, SupportedLocale } from '../../i18n/game-messages';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.css',
})
export class SettingsDialogComponent {
  @Input({ required: true }) exportCode = '';
  @Input({ required: true }) exportFileContents = '';
  @Input({ required: true }) currentLocale!: SupportedLocale;
  @Input({ required: true }) localeOptions: Array<{ id: SupportedLocale; label: string }> = [];
  @Output() closed = new EventEmitter<void>();
  @Output() importRequested = new EventEmitter<string>();
  @Output() localeChanged = new EventEmitter<SupportedLocale>();
  @Output() resetRequested = new EventEmitter<void>();

  importValue = '';
  feedbackMessage = '';
  feedbackTone: 'neutral' | 'success' | 'error' = 'neutral';

  constructor(public copy: GameMessagesService) {}

  async copyExportCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.exportCode);
      this.setFeedback(this.copy.messages.ui.saveTransferDialog.copySuccess, 'success');
    } catch {
      this.setFeedback(this.copy.messages.ui.saveTransferDialog.copyError, 'error');
    }
  }

  exportSaveFile(): void {
    const blob = new Blob([this.exportFileContents], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'frontier-miner-save.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  requestImportCode(): void {
    this.importRequested.emit(this.importValue);
  }

  async importSaveFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      const raw = await file.text();
      this.importRequested.emit(raw);
    } finally {
      input.value = '';
    }
  }

  onLocaleChange(locale: SupportedLocale): void {
    this.localeChanged.emit(locale);
  }

  updateFeedback(message: string, tone: 'success' | 'error'): void {
    this.setFeedback(message, tone);
  }

  private setFeedback(message: string, tone: 'neutral' | 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackTone = tone;
  }
}
