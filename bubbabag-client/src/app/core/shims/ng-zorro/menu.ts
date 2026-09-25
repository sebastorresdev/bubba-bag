import { Component, Directive, Input } from '@angular/core';

@Directive({
  selector: '[nz-menu]',
  standalone: true,
})
export class NzMenuDirective {
  @Input() nzMode: string = 'vertical';
  @Input() nzTheme: string = 'light';
}

@Directive({
  selector: '[nz-menu-item]',
  standalone: true,
})
export class NzMenuItemDirective {
  @Input() nzSelected: boolean = false;
  @Input() nzDisabled: boolean = false;
}

@Directive({
  selector: '[nz-submenu]',
  standalone: true,
})
export class NzSubMenuDirective {
  @Input() nzTitle?: any;
}

@Directive({
  selector: '[nz-menu-divider]',
  standalone: true,
})
export class NzMenuDividerDirective {}

export const NzMenuModule = [
  NzMenuDirective,
  NzMenuItemDirective,
  NzSubMenuDirective,
  NzMenuDividerDirective,
];
