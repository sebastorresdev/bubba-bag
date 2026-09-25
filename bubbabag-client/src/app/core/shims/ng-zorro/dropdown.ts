import { Directive, Component, Input, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[nz-dropdown]',
  standalone: true,
})
export class NzDropDownDirective {
  @Input() nzDropdownMenu?: any;
  @Input() nzTrigger: string = 'hover';
  @Input() nzPlacement: string = 'bottomLeft';
  @Input() nzVisible: boolean = false;
  @Output() nzVisibleChange = new EventEmitter<boolean>();
}

@Component({
  selector: 'nz-dropdown-menu',
  standalone: true,
  template: `<ng-content></ng-content>`,
  exportAs: 'nzDropdownMenu',
})
export class NzDropdownMenuComponent {}

export const NzDropdownModule = [NzDropDownDirective, NzDropdownMenuComponent];
