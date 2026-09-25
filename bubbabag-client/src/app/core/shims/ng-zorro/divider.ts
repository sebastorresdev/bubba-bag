import { Component, Input } from '@angular/core';

@Component({
  selector: 'nz-divider',
  standalone: true,
  template: `
    <div
      [class]="nzType === 'vertical' ? 'inline-block w-px h-4 mx-2 bg-neutral-200 dark:bg-neutral-800 align-middle' : 'w-full h-px my-4 bg-neutral-200 dark:bg-neutral-800'"
    ></div>
  `,
})
export class NzDividerComponent {
  @Input() nzType: 'horizontal' | 'vertical' = 'horizontal';
}

export const NzDividerModule = [NzDividerComponent];
