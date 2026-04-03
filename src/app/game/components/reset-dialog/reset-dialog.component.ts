import { Component, EventEmitter, Output } from '@angular/core';
import { GameMessagesService } from '../../i18n/game-messages';

@Component({
  selector: 'app-reset-dialog',
  standalone: true,
  templateUrl: './reset-dialog.component.html',
  styleUrl: './reset-dialog.component.css',
})
export class ResetDialogComponent {
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  constructor(public copy: GameMessagesService) {}
}
