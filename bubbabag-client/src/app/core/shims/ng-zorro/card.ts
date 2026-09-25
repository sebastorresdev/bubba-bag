import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nz-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden">
      <div *ngIf="nzTitle" class="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 font-semibold text-xs text-neutral-800 dark:text-neutral-200">
        {{ nzTitle }}
      </div>
      <div class="p-5">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class NzCardComponent {
  @Input() nzTitle?: any;
  @Input() nzBordered: boolean = true;
  @Input() nzHoverable: boolean = false;
  @Input() nzExtra?: any;
}

export const NzCardModule = [NzCardComponent];
