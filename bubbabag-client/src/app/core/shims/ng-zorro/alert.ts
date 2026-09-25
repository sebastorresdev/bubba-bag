import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nz-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs">
      <div *ngIf="nzMessage" class="font-medium mb-0.5">{{ nzMessage }}</div>
      <div *ngIf="nzDescription" class="text-neutral-500">{{ nzDescription }}</div>
      <ng-content></ng-content>
    </div>
  `,
})
export class NzAlertComponent {
  @Input() nzType: string = 'info';
  @Input() nzMessage?: any;
  @Input() nzDescription?: any;
  @Input() nzShowIcon: boolean | string = false;
  @Input() nzCloseable: boolean = false;
  @Input() nzAction?: any;
}

export const NzAlertModule = [NzAlertComponent];
