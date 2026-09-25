import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nz-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative inline-flex items-center">
      <ng-content></ng-content>
      <span *ngIf="nzCount" class="ml-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-primary-600 text-white">
        {{ nzCount }}
      </span>
      <span *ngIf="nzDot" class="w-2 h-2 rounded-full bg-emerald-500"></span>
    </div>
  `,
})
export class NzBadgeComponent {
  @Input() nzCount?: number;
  @Input() nzDot: boolean = false;
  @Input() nzStatus?: string;
  @Input() nzText?: string;
}

export const NzBadgeModule = [NzBadgeComponent];
