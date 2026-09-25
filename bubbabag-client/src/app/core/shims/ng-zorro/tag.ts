import { Component, Input } from '@angular/core';

@Component({
  selector: 'nz-tag',
  standalone: true,
  template: `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"><ng-content></ng-content></span>`,
})
export class NzTagComponent {
  @Input() nzColor: string = 'default';
  @Input() nzMode: string = 'default';
  @Input() nzChecked: boolean = false;
}

export const NzTagModule = [NzTagComponent];
