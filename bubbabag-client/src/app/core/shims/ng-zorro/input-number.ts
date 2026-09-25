import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'nz-input-number',
  standalone: true,
  imports: [FormsModule],
  template: `
    <input
      type="number"
      [ngModel]="value"
      (ngModelChange)="onModelChange($event)"
      [attr.min]="nzMin"
      [attr.max]="nzMax"
      [step]="nzStep"
      [placeholder]="nzPlaceHolder || ''"
      class="w-full px-3 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NzInputNumberComponent),
      multi: true,
    },
  ],
})
export class NzInputNumberComponent implements ControlValueAccessor {
  @Input() nzMin?: number;
  @Input() nzMax?: number;
  @Input() nzStep: number = 1;
  @Input() nzPrecision?: number;
  @Input() nzPlaceHolder?: string;

  value: any = 0;
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

export const NzInputNumberModule = [NzInputNumberComponent];
