import { Directive, Component, Input } from '@angular/core';

@Directive({
  selector: 'input[nz-input], textarea[nz-input]',
  standalone: true,
  host: {
    'class': 'w-full px-3 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500',
  },
})
export class NzInputDirective {
  @Input() nzSize: string = 'default';
  @Input() nzBorderless: boolean = false;
}

@Component({
  selector: 'nz-input-group',
  standalone: true,
  template: `<div class="relative flex items-center w-full"><ng-content></ng-content></div>`,
})
export class NzInputGroupComponent {
  @Input() nzPrefixIcon?: string;
  @Input() nzSuffix?: any;
  @Input() nzPrefix?: any;
  @Input() nzSize: string = 'default';
}

@Component({
  selector: 'nz-input-password',
  standalone: true,
  template: `<div class="relative w-full"><ng-content></ng-content></div>`,
})
export class NzInputPasswordComponent {}

@Component({
  selector: 'nz-input-wrapper',
  standalone: true,
  template: `<div class="relative w-full"><ng-content></ng-content></div>`,
})
export class NzInputWrapperComponent {}

export const NzInputModule = [
  NzInputDirective,
  NzInputGroupComponent,
  NzInputPasswordComponent,
  NzInputWrapperComponent,
];

