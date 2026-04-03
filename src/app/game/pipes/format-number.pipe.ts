import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatNumber',
  standalone: true,
})
export class FormatNumberPipe implements PipeTransform {
  transform(value: number): string {
    if (value < 1000) return Math.floor(value).toString();
    if (value < 1_000_000) return (value / 1_000).toFixed(1) + 'K';
    if (value < 1_000_000_000) return (value / 1_000_000).toFixed(2) + 'M';
    if (value < 1_000_000_000_000) return (value / 1_000_000_000).toFixed(2) + 'B';
    return (value / 1_000_000_000_000).toFixed(2) + 'T';
  }
}
