import { Directive, Input } from '@angular/core';

@Directive({
  selector: '[nz-tooltip]',
  standalone: true,
})
export class NzTooltipDirective {
  @Input() nzTooltipTitle?: any;
  @Input() nzTooltipPlacement?: string;
}

export const NzTooltipModule = [NzTooltipDirective];
