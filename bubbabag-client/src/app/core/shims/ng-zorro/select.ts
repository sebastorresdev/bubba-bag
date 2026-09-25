import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'nz-option',
  standalone: true,
  template: ``,
})
export class NzOptionComponent {
  @Input() nzValue: any;
  @Input() nzLabel: string = '';
}

@Component({
  selector: 'nz-select',
  standalone: true,
  imports: [FormsModule],
  template: `
    <select
      [ngModel]="value"
      (ngModelChange)="onModelChange($event)"
      class="w-full px-3 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
    >
      <ng-content></ng-content>
    </select>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NzSelectComponent),
      multi: true,
    },
  ],
})
export class NzSelectComponent implements ControlValueAccessor {
  @Input() nzPlaceHolder?: string;
  @Input() nzMode?: string;
  @Input() nzSize: string = 'default';
  @Input() nzDisabled: boolean = false;

  value: any = null;
  onChange = (val: any) => {};
  onTouched = () => {};

  writeValue(val: any): void {
    this.value = val;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  onModelChange(val: any): void {
    this.value = val;
    this.onChange(val);
  }
}

export const NzSelectModule = [NzSelectComponent, NzOptionComponent];
