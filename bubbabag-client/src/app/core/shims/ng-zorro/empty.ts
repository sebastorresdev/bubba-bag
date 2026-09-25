import { Component, Input } from '@angular/core';

@Component({
  selector: 'nz-empty',
  standalone: true,
  template: `
    <div class="py-6 text-center text-xs text-neutral-400">
      <p>{{ nzNotFoundContent || 'No hay datos' }}</p>
    </div>
  `,
})
export class NzEmptyComponent {
  @Input() nzNotFoundContent?: string;
  @Input() nzNotFoundImage?: string;
}

export const NzEmptyModule = [NzEmptyComponent];
