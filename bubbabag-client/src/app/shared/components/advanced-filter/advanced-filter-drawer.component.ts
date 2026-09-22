import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import {
  FilterGroup,
  FilterCondition,
  FilterOperator,
  ColumnDataType,
  OPERATORS_BY_TYPE,
  OperatorOption,
} from './advanced-filter.models';
import { ColumnDef } from '../entity-table/entity-table.models';

@Component({
  selector: 'app-advanced-filter-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzDrawerModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzInputModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzRadioModule,
    NzTagModule,
    NzEmptyModule,
  ],
  templateUrl: './advanced-filter-drawer.component.html',
  styleUrl: './advanced-filter-drawer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedFilterDrawerComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() entidad: string = '';
  @Input() columns: ColumnDef[] = [];
  @Input() currentFilter: FilterGroup | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() applyFilter = new EventEmitter<FilterGroup | null>();
  @Output() clearFilter = new EventEmitter<void>();

  localGroup: FilterGroup = {
    id: 'root',
    logic: 'AND',
    conditions: [],
  };

  ngOnInit(): void {
    this.sincronizarFiltro();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentFilter'] || (changes['visible'] && this.visible)) {
      this.sincronizarFiltro();
    }
  }

  private sincronizarFiltro(): void {
    if (this.currentFilter && this.currentFilter.conditions) {
      // Clon profundo para edición
      this.localGroup = JSON.parse(JSON.stringify(this.currentFilter));
    } else {
      this.localGroup = {
        id: 'root',
        logic: 'AND',
        conditions: [],
      };
    }
  }

  get availableColumns(): ColumnDef[] {
    return this.columns.filter((c) => c.key && c.title);
  }

  getColumnDef(fieldKey: string): ColumnDef | undefined {
    return this.columns.find((c) => c.key === fieldKey);
  }

  getColumnDataType(fieldKey: string): ColumnDataType {
    const col = this.getColumnDef(fieldKey);
    return col?.dataType || 'text';
  }

  getOperatorsForField(fieldKey: string): OperatorOption[] {
    const dataType = this.getColumnDataType(fieldKey);
    return OPERATORS_BY_TYPE[dataType] || OPERATORS_BY_TYPE['text'];
  }

  isUnaryOperator(fieldKey: string, operator: FilterOperator): boolean {
    const ops = this.getOperatorsForField(fieldKey);
    const match = ops.find((o) => o.value === operator);
    return !!match?.unary;
  }

  isRangeOperator(fieldKey: string, operator: FilterOperator): boolean {
    const ops = this.getOperatorsForField(fieldKey);
    const match = ops.find((o) => o.value === operator);
    return !!match?.requiresRange;
  }

  addCondition(): void {
    const firstCol = this.availableColumns[0];
    const fieldKey = firstCol ? firstCol.key : '';
    const initialOperators = this.getOperatorsForField(fieldKey);

    const newCond: FilterCondition = {
      id: 'cond_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      field: fieldKey,
      operator: initialOperators[0]?.value || 'contains',
      value: null,
    };

    this.localGroup.conditions.push(newCond);
  }

  removeCondition(index: number): void {
    this.localGroup.conditions.splice(index, 1);
  }

  onFieldChange(cond: FilterCondition): void {
    const ops = this.getOperatorsForField(cond.field);
    cond.operator = ops[0]?.value || 'contains';
    cond.value = null;
    cond.secondValue = null;
  }

  onOperatorChange(cond: FilterCondition): void {
    if (this.isUnaryOperator(cond.field, cond.operator)) {
      cond.value = null;
      cond.secondValue = null;
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onLimpiarTodo(): void {
    this.localGroup.conditions = [];
    this.applyFilter.emit(null);
    this.clearFilter.emit();
    this.close();
  }

  onAplicar(): void {
    // Filtrar condiciones que tengan campo seleccionado
    const validConditions = this.localGroup.conditions.filter((c) => !!c.field);

    if (validConditions.length === 0) {
      this.applyFilter.emit(null);
    } else {
      const resultGroup: FilterGroup = {
        id: this.localGroup.id,
        logic: this.localGroup.logic,
        conditions: validConditions,
      };
      this.applyFilter.emit(resultGroup);
    }
    this.close();
  }
}
