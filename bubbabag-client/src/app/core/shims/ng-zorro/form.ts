import { Component, Directive, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Directive({
  selector: '[nz-form]',
  standalone: true,
})
export class NzFormDirective {
  @Input() nzLayout: string = 'horizontal';
  @Input() nzNoColon: boolean = false;
}

@Component({
  selector: 'nz-form-item',
  standalone: true,
  template: `<div class="mb-3"><ng-content></ng-content></div>`,
})
export class NzFormItemComponent {}

@Component({
  selector: 'nz-form-label',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
      <ng-content></ng-content>
      <span *ngIf="nzRequired" class="text-rose-500 ml-0.5">*</span>
    </label>
  `,
})
export class NzFormLabelComponent {
  @Input() nzRequired: boolean | string = false;
  @Input() nzSpan?: number;
  @Input() nzFor?: string;
}

@Component({
  selector: 'nz-form-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <ng-content></ng-content>
      <div *ngIf="nzErrorTip" class="text-[11px] text-rose-500 mt-1 hidden">
        {{ nzErrorTip }}
      </div>
    </div>
  `,
})
export class NzFormControlComponent {
  @Input() nzErrorTip?: any;
  @Input() nzSpan?: number;
}

export const NzFormModule = [
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent,
  NzFormControlComponent,
];
