import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { EmpleadoService } from '../../services/empleado.service';
import { EmpleadoDto } from '../../models/empleado.model';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormsModule } from '@angular/forms';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-empleados-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzPopconfirmModule,
    NzInputModule,
    FormsModule,
    NzTagModule
  ],
  templateUrl: './empleados-list.html'
})
export class EmpleadosListComponent implements OnInit {
  private empleadoService = inject(EmpleadoService);
  private message = inject(NzMessageService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  empleados: EmpleadoDto[] = [];
  loading = false;
  searchTerm = '';

  ngOnInit() {
    this.cargarEmpleados();
  }

  cargarEmpleados() {
    this.loading = true;
    this.empleadoService.getEmpleados(this.searchTerm).subscribe({
      next: (data) => {
        this.empleados = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.message.error('Error al cargar empleados');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  buscar() {
    this.cargarEmpleados();
  }

  editar(id: string) {
    this.router.navigate(['/rrhh/empleados/editar', id]);
  }

  eliminar(id: string) {
    this.empleadoService.eliminarEmpleado(id).subscribe({
      next: () => {
        this.message.success('Empleado eliminado correctamente');
        this.cargarEmpleados();
      },
      error: () => {
        // Manejado por el interceptor global
      }
    });
  }
}
