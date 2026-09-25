import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'nz-date-picker',
  standalone: true,
  imports: [FormsModule],
  template: `
    <input
      type="date"
      [ngModel]="value"
      (ngModelChange)="onModelChange($event)"
      class="w-full px-3 py-1.5 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
    />
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NzDatePickerComponent),
      multi: true,
    },
  ],
})
export class NzDatePickerComponent implements ControlValueAccessor {
  @Input() nzPlaceHolder?: string;
  @Input() nzFormat?: string;

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

export const NzDatePickerModule = [NzDatePickerComponent];
