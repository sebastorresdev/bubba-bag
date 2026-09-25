import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'nz-switch',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        [ngModel]="checked"
        (ngModelChange)="onModelChange($event)"
        [disabled]="nzDisabled"
        class="sr-only peer"
      />
      <div class="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
    </label>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NzSwitchComponent),
      multi: true,
    },
  ],
})
export class NzSwitchComponent implements ControlValueAccessor {
  @Input() nzDisabled: boolean = false;
  @Input() nzCheckedChildren?: any;
  @Input() nzUnCheckedChildren?: any;

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

export const NzSwitchModule = [NzSwitchComponent];
