import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GameMessagesService } from '../../i18n/game-messages';

@Component({
  selector: 'app-save-transfer-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './save-transfer-dialog.component.html',
  styleUrl: './save-transfer-dialog.component.css',
})
export class SaveTransferDialogComponent {
  readonly exportValue = input.required<string>();
  readonly importRequested = output<string>();
  readonly closed = output<void>();

  importValue = '';
  feedbackMessage = '';
  feedbackTone: 'neutral' | 'success' | 'error' = 'neutral';

  constructor(public copy: GameMessagesService) {}

  async copyExport(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.exportValue());
      this.setFeedback(this.copy.messages.ui.saveTransferDialog.copySuccess, 'success');
    } catch {
      this.setFeedback(this.copy.messages.ui.saveTransferDialog.copyError, 'error');
    }
  }

  requestImport(): void {
    this.importRequested.emit(this.importValue);
  }

  updateFeedback(message: string, tone: 'success' | 'error'): void {
    this.setFeedback(message, tone);
  }

  private setFeedback(message: string, tone: 'neutral' | 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackTone = tone;
  }
}
