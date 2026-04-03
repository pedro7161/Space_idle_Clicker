import { Component, output } from '@angular/core';
import { GameMessagesService } from '../../i18n/game-messages';

@Component({
  selector: 'app-reset-dialog',
  standalone: true,
  templateUrl: './reset-dialog.component.html',
})
export class ResetDialogComponent {
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  constructor(public copy: GameMessagesService) {}
}
