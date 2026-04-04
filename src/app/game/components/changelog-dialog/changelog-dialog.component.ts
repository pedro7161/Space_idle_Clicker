import { CommonModule } from '@angular/common';
import { Component, output } from '@angular/core';
import { CHANGELOG_ENTRIES, ChangelogEntry, ChangelogItem } from '../../constants/changelog.data';
import { GameMessagesService } from '../../i18n/game-messages';

@Component({
  selector: 'app-changelog-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './changelog-dialog.component.html',
})
export class ChangelogDialogComponent {
  readonly closed = output<void>();
  readonly entries = CHANGELOG_ENTRIES;

  constructor(public copy: GameMessagesService) {}

  getLocalizedTitle(entry: ChangelogEntry): string {
    return this.copy.currentLocale.startsWith('pt') ? entry.title.pt : entry.title.en;
  }

  getLocalizedSummary(entry: ChangelogEntry): string {
    return this.copy.currentLocale.startsWith('pt') ? entry.summary.pt : entry.summary.en;
  }

  getLocalizedItem(item: ChangelogItem): string {
    return this.copy.currentLocale.startsWith('pt') ? item.pt : item.en;
  }

  getTypeLabel(type: ChangelogItem['type']): string {
    return this.copy.messages.ui.changelogDialog[type];
  }

  getTypeClasses(type: ChangelogItem['type']): string {
    switch (type) {
      case 'added':
        return 'border-emerald-400/30 bg-emerald-500/12 text-emerald-200';
      case 'changed':
        return 'border-sky-400/30 bg-sky-500/12 text-sky-200';
      case 'fixed':
        return 'border-amber-400/30 bg-amber-500/12 text-amber-200';
    }
  }
}
