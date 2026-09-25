import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[nz-button], button[nz-button], a[nz-button]',
  standalone: true,
  host: {
    'class': 'inline-flex items-center justify-center font-medium rounded transition-colors disabled:opacity-50 cursor-pointer',
  },
})
export class NzButtonDirective {
  @Input() nzType: string = 'default';
  @Input() nzSize: string = 'default';
  @Input() nzLoading: boolean | string = false;
  @Input() nzDanger: boolean | string = false;
  @Input() nzBlock: boolean | string = false;
}

export const NzButtonModule = [NzButtonDirective];
