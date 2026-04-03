import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-reset-dialog',
  standalone: true,
  templateUrl: './reset-dialog.component.html',
  styleUrl: './reset-dialog.component.css',
})
export class ResetDialogComponent {
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
