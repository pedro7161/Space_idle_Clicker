import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameMessagesService, SupportedLocale } from '../../i18n/game-messages';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-dialog.component.html',
})
export class SettingsDialogComponent {
  readonly exportCode = input.required<string>();
  readonly exportFileContents = input.required<string>();
  readonly currentLocale = input.required<SupportedLocale>();
  readonly localeOptions = input.required<Array<{ id: SupportedLocale; label: string }>>();
  readonly closed = output<void>();
  readonly importRequested = output<string>();
  readonly localeChanged = output<SupportedLocale>();
  readonly resetRequested = output<void>();

  importValue = '';
  feedbackMessage = '';
  feedbackTone: 'neutral' | 'success' | 'error' = 'neutral';

  constructor(public copy: GameMessagesService) {}

  async copyExportCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.exportCode());
      this.setFeedback(this.copy.messages.ui.saveTransferDialog.copySuccess, 'success');
    } catch {
      this.setFeedback(this.copy.messages.ui.saveTransferDialog.copyError, 'error');
    }
  }

  exportSaveFile(): void {
    const blob = new Blob([this.exportFileContents()], { type: 'application/json' });
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
