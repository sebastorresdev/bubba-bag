import { Directive, Component, Input } from '@angular/core';

@Directive({
  selector: 'nz-icon, [nz-icon], i[nz-icon]',
  standalone: true,
})
export class NzIconDirective {
  @Input() nzType: string = '';
  @Input() nzTheme: string = 'outline';
  @Input() nzSpin: boolean = false;
  @Input() nzRotate: number = 0;
}

export const NzIconModule = [NzIconDirective];
