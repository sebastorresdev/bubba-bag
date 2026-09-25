import { Component, Input, ContentChildren, QueryList } from '@angular/core';

@Component({
  selector: 'nz-table',
  standalone: true,
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <ng-content></ng-content>
      </table>
    </div>
  `,
  exportAs: 'nzTable',
})
export class NzTableComponent {
  @Input() nzData: any[] = [];
  @Input() nzShowPagination: boolean = true;
  @Input() nzSize: string = 'default';
  @Input() nzLoading: boolean = false;
  @Input() nzScroll?: any;
  @Input() nzFrontPagination: boolean = true;
  @Input() nzPageSize: number = 10;
  @Input() nzPageIndex: number = 1;

  get data(): any[] {
    return this.nzData || [];
  }
}

export const NzTableModule = [NzTableComponent];
