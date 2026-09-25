import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nz-spin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full">
      <div *ngIf="nzSpinning || nzSimple" class="py-6 flex flex-col items-center justify-center gap-2">
        <div class="w-6 h-6 rounded-full border-2 border-primary-600 border-t-transparent animate-spin"></div>
        <span *ngIf="nzTip" class="text-xs text-neutral-500">{{ nzTip }}</span>
      </div>
      <ng-content *ngIf="!nzSimple"></ng-content>
    </div>
  `,
})
export class NzSpinComponent {
  @Input() nzSpinning: boolean = false;
  @Input() nzSimple: boolean | string = false;
  @Input() nzSize: string = 'default';
  @Input() nzTip?: string;
  @Input() nzDelay?: number;
}

export const NzSpinModule = [NzSpinComponent];
