import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'label[nz-checkbox], nz-checkbox',
  standalone: true,
  imports: [FormsModule],
  template: `
    <span class="inline-flex items-center gap-1.5 cursor-pointer">
      <input
        type="checkbox"
        [ngModel]="checked"
        (ngModelChange)="onModelChange($event)"
        [disabled]="nzDisabled"
        [indeterminate]="nzIndeterminate"
        class="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-primary-500 cursor-pointer"
      />
      <ng-content></ng-content>
    </span>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NzCheckboxComponent),
      multi: true,
    },
  ],
})
export class NzCheckboxComponent implements ControlValueAccessor {
  @Input() nzDisabled: boolean = false;
  @Input() nzIndeterminate: boolean = false;

  checked: boolean = false;
  onChange = (val: any) => {};
  onTouched = () => {};

  writeValue(val: any): void {
    this.checked = !!val;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  onModelChange(val: any): void {
    this.checked = val;
    this.onChange(val);
  }
}

export const NzCheckboxModule = [NzCheckboxComponent];
