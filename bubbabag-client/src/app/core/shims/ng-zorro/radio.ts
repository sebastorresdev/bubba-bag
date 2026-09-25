import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'nz-radio-group',
  standalone: true,
  imports: [FormsModule],
  template: `<div class="inline-flex items-center gap-3"><ng-content></ng-content></div>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NzRadioGroupComponent),
      multi: true,
    },
  ],
})
export class NzRadioGroupComponent implements ControlValueAccessor {
  value: any;
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
}

@Component({
  selector: 'label[nz-radio], nz-radio',
  standalone: true,
  template: `
    <span class="inline-flex items-center gap-1.5 cursor-pointer text-xs">
      <input type="radio" [value]="nzValue" class="h-4 w-4 text-primary-600 focus:ring-primary-500 cursor-pointer" />
      <ng-content></ng-content>
    </span>
  `,
})
export class NzRadioComponent {
  @Input() nzValue: any;
}

export const NzRadioModule = [NzRadioGroupComponent, NzRadioComponent];
