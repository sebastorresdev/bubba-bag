import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import {
  ClienteDetalleDto,
  CrearClienteCommand,
  ActualizarClienteRequest,
  UbigeoItemDto,
} from '../../models/cliente.model';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CommandBarComponent, CommandBarItem } from '../../../../shared/components/command-bar';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzSwitchModule,
    NzIconModule,
    NzTagModule,
    NzCardModule,
    NzTooltipModule,
    NzAvatarModule,
    NzTabsModule,
    NzRadioModule,
    NzInputNumberModule,
    NzDividerModule,
    NzSpinModule,
    CommandBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.component.css',
})
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  form!: FormGroup;
  clienteId: string | null = null;
  clienteActual?: ClienteDetalleDto;
  isEdit = false;
  loading = false;
  saving = false;
  selectedTabIndex = 0;
  capturandoUbicacion = false;

  get loadingTip(): string {
    if (this.saving) return 'Guardando información del cliente...';
    if (this.loading) return 'Cargando datos del cliente...';
    return 'Procesando...';
  }

  tiposDocumento = [
    { label: 'DNI (Documento Nacional de Identidad)', value: 'DNI' },
    { label: 'Carnet de Extranjería (CE)', value: 'CE' },
    { label: 'Pasaporte', value: 'PASAPORTE' },
  ];

  // Catálogo oficial de Ubigeo Perú (cargado desde BD / API)
  departamentosLista: string[] = [];
  provinciasLista: string[] = [];
  distritosLista: string[] = [];
  ubigeosCatalogo: UbigeoItemDto[] = [];

  get emailCliente(): string {
    return this.clienteActual?.email || '';
  }

  get telefonoCliente(): string {
    return this.clienteActual?.telefonoPrincipal || '';
  }

  get nombreClienteEnFormulario(): string {
    if (!this.isEdit || !this.clienteActual) {
      return 'Nuevo Cliente';
    }
    if (this.clienteActual.tipoPersona === 'JURIDICA') {
      return this.clienteActual.razonSocial?.trim() || 'Empresa';
    }
    const nombres = this.clienteActual.nombres?.trim() || '';
    const apellidos = this.clienteActual.apellidos?.trim() || '';
    const completo = `${nombres} ${apellidos}`.trim();
    return completo || 'Cliente';
  }

  commandBarItems: CommandBarItem[] = [];
  commandBarFarItems: CommandBarItem[] = [];

  ngOnInit(): void {
    this.initForm();
    this.clienteId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.clienteId;

    this.updateCommandBar();
    this.cargarCatalogoUbigeos();

    if (this.isEdit && this.clienteId) {
      this.cargarCliente(this.clienteId);
    } else {
      this.asignarUbigeoCodigo('Lima', 'Lima', 'Lima');
    }

    // Escuchar cambios en tipoPersona para adaptar validaciones
    this.form.get('tipoPersona')?.valueChanges.subscribe((tipo) => {
      this.actualizarValidacionesPorTipo(tipo);
    });
  }

  private cargarCatalogoUbigeos(): void {
    this.clienteService.getUbigeos().subscribe({
      next: (ubigeos) => {
        if (ubigeos && ubigeos.length > 0) {
          this.ubigeosCatalogo = ubigeos;
          const depts = Array.from(new Set(ubigeos.map((u) => u.departamento))).sort();
          this.departamentosLista = depts;

          if (this.clienteActual?.ubigeoCodigo) {
            this.sincronizarUbigeoPorCodigo(this.clienteActual.ubigeoCodigo);
          } else {
            const currentDep = this.form.get('departamento')?.value || (depts.includes('Lima') ? 'Lima' : depts[0]);
            this.form.patchValue({ departamento: currentDep });

            const provs = Array.from(
              new Set(
                ubigeos
                  .filter((u) => u.departamento.toUpperCase() === currentDep.toUpperCase())
                  .map((u) => u.provincia)
              )
            ).sort();
            this.provinciasLista = provs;
            const currentProv = this.form.get('provincia')?.value || (provs.includes('Lima') ? 'Lima' : provs[0]);
            this.form.patchValue({ provincia: currentProv });

            const dists = ubigeos
              .filter(
                (u) =>
                  u.departamento.toUpperCase() === currentDep.toUpperCase() &&
                  u.provincia.toUpperCase() === currentProv.toUpperCase()
              )
              .map((u) => u.distrito)
              .sort();
            this.distritosLista = dists;
            const currentDist = this.form.get('distrito')?.value || (dists.includes('Lima') ? 'Lima' : dists[0]);
            this.form.patchValue({ distrito: currentDist });
            this.asignarUbigeoCodigo(currentDep, currentProv, currentDist);
          }
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.message.warning('No se pudo cargar el catálogo de ubigeos desde el servidor.');
      },
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      codigoCliente: [{ value: '', disabled: true }],
      tipoPersona: ['NATURAL', [Validators.required]],
      tipoDocumento: ['DNI', [Validators.required]],
      documentoIdentidad: ['', [Validators.required, Validators.maxLength(20)]],
      nombres: ['', [Validators.required, Validators.maxLength(100)]],
      apellidos: ['', [Validators.required, Validators.maxLength(100)]],
      razonSocial: ['', [Validators.maxLength(150)]],
      telefonoPrincipal: ['', [Validators.required, Validators.maxLength(20)]],
      telefonoSecundario: ['', [Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.maxLength(100)]],
      direccion: ['', [Validators.required, Validators.maxLength(250)]],
      ubigeoCodigo: ['150101', [Validators.required, Validators.maxLength(10)]],
      distrito: ['Lima', [Validators.required, Validators.maxLength(80)]],
      provincia: ['Lima', [Validators.required, Validators.maxLength(80)]],
      departamento: ['Lima', [Validators.required, Validators.maxLength(80)]],
      referenciaUbicacion: ['', [Validators.maxLength(250)]],
      coordenadaLat: [null],
      coordenadaLng: [null],
      esClienteFacturacion: [true],
      esClienteServicio: [true],
      activo: [true],
    });

    this.form.valueChanges.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  private actualizarValidacionesPorTipo(tipo: 'NATURAL' | 'JURIDICA'): void {
    const nombresCtrl = this.form.get('nombres');
    const apellidosCtrl = this.form.get('apellidos');
    const razonSocialCtrl = this.form.get('razonSocial');
    const tipoDocCtrl = this.form.get('tipoDocumento');
    const docCtrl = this.form.get('documentoIdentidad');

    if (tipo === 'JURIDICA') {
      tipoDocCtrl?.setValue('RUC', { emitEvent: false });
      if (!this.isEdit) {
        this.form.patchValue({ esClienteFacturacion: true });
      }
      razonSocialCtrl?.setValidators([Validators.required, Validators.maxLength(150)]);
      // Persona de contacto en la empresa: nombres es requerido para contacto comercial y por BD
      nombresCtrl?.setValidators([Validators.required, Validators.maxLength(100)]);
      apellidosCtrl?.setValidators([Validators.maxLength(100)]);
      docCtrl?.setValidators([
        Validators.required,
        Validators.minLength(11),
        Validators.maxLength(11),
        Validators.pattern(/^[0-9]{11}$/),
      ]);
    } else {
      if (tipoDocCtrl?.value === 'RUC') {
        tipoDocCtrl.setValue('DNI', { emitEvent: false });
      }
      razonSocialCtrl?.clearValidators();
      nombresCtrl?.setValidators([Validators.required, Validators.maxLength(100)]);
      apellidosCtrl?.setValidators([Validators.required, Validators.maxLength(100)]);
      docCtrl?.setValidators([Validators.required, Validators.maxLength(20)]);
    }

    nombresCtrl?.updateValueAndValidity();
    apellidosCtrl?.updateValueAndValidity();
    razonSocialCtrl?.updateValueAndValidity();
    docCtrl?.updateValueAndValidity();
  }

  onDepartamentoChange(dept: string): void {
    if (this.ubigeosCatalogo.length > 0) {
      const provs = Array.from(
        new Set(
          this.ubigeosCatalogo
            .filter((u) => u.departamento.toUpperCase() === dept.toUpperCase())
            .map((u) => u.provincia)
        )
      ).sort();
      this.provinciasLista = provs;
      const defaultProv = provs[0] || '';
      this.form.patchValue({ provincia: defaultProv });

      const dists = this.ubigeosCatalogo
        .filter(
          (u) =>
            u.departamento.toUpperCase() === dept.toUpperCase() &&
            u.provincia.toUpperCase() === defaultProv.toUpperCase()
        )
        .map((u) => u.distrito)
        .sort();
      this.distritosLista = dists;
      const defaultDist = dists[0] || '';
      this.form.patchValue({ distrito: defaultDist });
      this.asignarUbigeoCodigo(dept, defaultProv, defaultDist);
    }
    this.cdr.markForCheck();
  }

  onProvinciaChange(prov: string): void {
    const dept = this.form.get('departamento')?.value || 'Lima';
    if (this.ubigeosCatalogo.length > 0) {
      const dists = this.ubigeosCatalogo
        .filter(
          (u) =>
            u.departamento.toUpperCase() === dept.toUpperCase() &&
            u.provincia.toUpperCase() === prov.toUpperCase()
        )
        .map((u) => u.distrito)
        .sort();
      this.distritosLista = dists;
      const defaultDist = dists[0] || '';
      this.form.patchValue({ distrito: defaultDist });
      this.asignarUbigeoCodigo(dept, prov, defaultDist);
    }
    this.cdr.markForCheck();
  }

  onDistritoChange(dist: string): void {
    const dept = this.form.get('departamento')?.value || 'Lima';
    const prov = this.form.get('provincia')?.value || 'Lima';
    this.asignarUbigeoCodigo(dept, prov, dist);
  }

  private asignarUbigeoCodigo(dept: string, prov: string, dist: string): void {
    if (!dept || !prov || !dist) return;

    if (this.ubigeosCatalogo.length > 0) {
      const match = this.ubigeosCatalogo.find(
        (u) =>
          u.departamento.toUpperCase() === dept.toUpperCase() &&
          u.provincia.toUpperCase() === prov.toUpperCase() &&
          u.distrito.toUpperCase() === dist.toUpperCase()
      );
      if (match) {
        this.form.patchValue({ ubigeoCodigo: match.codigo });
        return;
      }
    }

    // Default fallback estándar para pruebas locales
    this.form.patchValue({ ubigeoCodigo: '150101' });
  }

  private sincronizarUbigeoPorCodigo(codigo: string): void {
    if (!codigo || this.ubigeosCatalogo.length === 0) return;
    const match = this.ubigeosCatalogo.find((u) => u.codigo === codigo);
    if (match) {
      this.form.patchValue({
        departamento: match.departamento,
        provincia: match.provincia,
        distrito: match.distrito,
        ubigeoCodigo: match.codigo,
      });
      this.provinciasLista = Array.from(
        new Set(
          this.ubigeosCatalogo
            .filter((u) => u.departamento.toUpperCase() === match.departamento.toUpperCase())
            .map((u) => u.provincia)
        )
      ).sort();
      this.distritosLista = this.ubigeosCatalogo
        .filter(
          (u) =>
            u.departamento.toUpperCase() === match.departamento.toUpperCase() &&
            u.provincia.toUpperCase() === match.provincia.toUpperCase()
        )
        .map((u) => u.distrito)
        .sort();
    }
  }

  capturarUbicacionActual(): void {
    if (!navigator.geolocation) {
      this.message.warning('La geolocalización no está soportada en este navegador.');
      return;
    }
    this.capturandoUbicacion = true;
    this.cdr.markForCheck();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.capturandoUbicacion = false;
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        this.form.patchValue({
          coordenadaLat: lat,
          coordenadaLng: lng,
        });
        this.message.success(`Ubicación GPS capturada: ${lat}, ${lng}`);
        this.cdr.markForCheck();
      },
      () => {
        this.capturandoUbicacion = false;
        this.message.warning('No se pudo obtener la ubicación GPS actual.');
        this.cdr.markForCheck();
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  abrirEnMapa(): void {
    const lat = this.form.get('coordenadaLat')?.value;
    const lng = this.form.get('coordenadaLng')?.value;
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else {
      const dir = this.form.get('direccion')?.value || '';
      const dist = this.form.get('distrito')?.value || '';
      const prov = this.form.get('provincia')?.value || '';
      const query = encodeURIComponent(`${dir}, ${dist}, ${prov}, Perú`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  }

  recargar(): void {
    if (this.clienteId) {
      this.cargarCliente(this.clienteId);
    } else {
      this.initForm();
      this.asignarUbigeoCodigo('Lima', 'Lima', 'Lima');
    }
  }

  private updateCommandBar(): void {
    this.commandBarItems = [
      {
        key: 'save',
        label: 'Guardar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar cambios del cliente',
        disabled: this.saving,
        execute: () => this.guardar(false),
      },
      {
        key: 'saveAndClose',
        label: 'Guardar y cerrar',
        icon: 'save',
        iconColor: 'purple',
        tooltip: 'Guardar cambios y volver a la lista',
        disabled: this.saving,
        execute: () => this.guardar(true),
      },
      {
        key: 'discard',
        label: 'Descartar',
        icon: 'close',
        iconColor: 'neutral',
        tooltip: 'Descartar cambios y volver',
        execute: () => this.volver(),
      },
      {
        key: 'refresh',
        label: 'Actualizar',
        icon: 'reload',
        iconColor: 'neutral',
        tooltip: 'Recargar datos del formulario',
        disabled: this.loading,
        execute: () => this.recargar(),
      },
    ];

    this.commandBarFarItems = [
      {
        key: 'share',
        label: 'Compartir',
        icon: 'export',
        appearance: 'primary',
        tooltip: 'Compartir ficha del cliente',
        execute: () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            this.message.success('Enlace del cliente copiado al portapapeles');
          }
        },
      },
    ];

    if (this.isEdit && this.clienteActual) {
      this.commandBarFarItems.unshift({
        key: 'toggle-estado',
        label: this.clienteActual.activo ? 'Dar de baja' : 'Activar cliente',
        icon: this.clienteActual.activo ? 'user-delete' : 'check-circle',
        danger: this.clienteActual.activo,
        iconColor: this.clienteActual.activo ? 'danger' : 'success',
        tooltip: this.clienteActual.activo ? 'Desactivar cliente' : 'Reactivar cliente',
        execute: () => this.toggleEstado(),
      });
    }
  }

  private cargarCliente(id: string): void {
    this.loading = true;
    this.clienteService.getClientePorId(id).subscribe({
      next: (c) => {
        this.clienteActual = c;
        this.form.patchValue({
          codigoCliente: c.codigoCliente,
          tipoPersona: c.tipoPersona,
          tipoDocumento: c.tipoDocumento,
          documentoIdentidad: c.documentoIdentidad,
          nombres: c.nombres,
          apellidos: c.apellidos,
          razonSocial: c.razonSocial,
          telefonoPrincipal: c.telefonoPrincipal,
          telefonoSecundario: c.telefonoSecundario,
          email: c.email,
          direccion: c.direccion,
          ubigeoCodigo: c.ubigeoCodigo || '150101',
          distrito: c.distrito,
          provincia: c.provincia,
          departamento: c.departamento,
          referenciaUbicacion: c.referenciaUbicacion,
          coordenadaLat: c.coordenadaLat,
          coordenadaLng: c.coordenadaLng,
          esClienteFacturacion: c.esClienteFacturacion,
          esClienteServicio: c.esClienteServicio,
          activo: c.activo,
        });

        if (c.ubigeoCodigo) {
          this.sincronizarUbigeoPorCodigo(c.ubigeoCodigo);
        } else if (c.departamento && this.ubigeosCatalogo.length > 0) {
          this.provinciasLista = Array.from(
            new Set(
              this.ubigeosCatalogo
                .filter((u) => u.departamento.toUpperCase() === c.departamento.toUpperCase())
                .map((u) => u.provincia)
            )
          ).sort();
          if (c.provincia) {
            this.distritosLista = this.ubigeosCatalogo
              .filter(
                (u) =>
                  u.departamento.toUpperCase() === c.departamento.toUpperCase() &&
                  u.provincia.toUpperCase() === c.provincia.toUpperCase()
              )
              .map((u) => u.distrito)
              .sort();
          }
        }
        this.actualizarValidacionesPorTipo(c.tipoPersona);

        // En edición, el código y documento no deben alterarse para mantener integridad fiscal
        this.form.get('codigoCliente')?.disable();
        this.form.get('tipoPersona')?.disable();
        this.form.get('tipoDocumento')?.disable();
        this.form.get('documentoIdentidad')?.disable();

        this.loading = false;
        this.updateCommandBar();
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.message.error('No se pudo cargar la información del cliente.');
        this.volver();
      },
    });
  }

  guardar(cerrarAlFinal: boolean = true): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((ctrl) => {
        if (ctrl.invalid) {
          ctrl.markAsDirty();
          ctrl.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Por favor completa los campos obligatorios del formulario.');
      return;
    }

    this.saving = true;
    this.updateCommandBar();

    const formVal = this.form.getRawValue();

    if (this.isEdit && this.clienteId) {
      const updateReq: ActualizarClienteRequest = {
        telefonoPrincipal: formVal.telefonoPrincipal,
        direccion: formVal.direccion,
        ubigeoCodigo: formVal.ubigeoCodigo || '150101',
        referenciaUbicacion: formVal.referenciaUbicacion,
        coordenadaLat: formVal.coordenadaLat,
        coordenadaLng: formVal.coordenadaLng,
        esClienteFacturacion: formVal.esClienteFacturacion ?? true,
        esClienteServicio: formVal.esClienteServicio ?? true,
      };

      this.clienteService.actualizarCliente(this.clienteId, updateReq).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success(res.message || 'Cliente actualizado correctamente.');
          if (cerrarAlFinal) {
            this.volver();
          } else {
            this.cargarCliente(this.clienteId!);
          }
        },
        error: (err) => {
          this.saving = false;
          this.updateCommandBar();
          const errorMsg = err?.error?.message || 'Error al actualizar cliente.';
          this.message.error(errorMsg);
        },
      });
    } else {
      const createCmd: CrearClienteCommand = {
        documentoIdentidad: formVal.documentoIdentidad,
        nombres: formVal.nombres || '',
        apellidos: formVal.apellidos,
        telefonoPrincipal: formVal.telefonoPrincipal,
        direccion: formVal.direccion,
        ubigeoCodigo: formVal.ubigeoCodigo || '150101',
        distrito: formVal.distrito,
        provincia: formVal.provincia,
        departamento: formVal.departamento,
        esClienteFacturacion: formVal.esClienteFacturacion ?? false,
        esClienteServicio: formVal.esClienteServicio ?? true,
        tipoDocumento: formVal.tipoPersona === 'JURIDICA' ? 'RUC' : formVal.tipoDocumento,
        tipoPersona: formVal.tipoPersona,
        razonSocial: formVal.tipoPersona === 'JURIDICA' ? formVal.razonSocial?.trim() : undefined,
        telefonoSecundario: formVal.telefonoSecundario,
        email: formVal.email,
        referenciaUbicacion: formVal.referenciaUbicacion,
        coordenadaLat: formVal.coordenadaLat,
        coordenadaLng: formVal.coordenadaLng,
      };

      this.clienteService.crearCliente(createCmd).subscribe({
        next: (res) => {
          this.saving = false;
          this.message.success(res.message || 'Cliente creado exitosamente.');
          if (cerrarAlFinal) {
            this.volver();
          } else if (res.id) {
            this.router.navigate(['/crm/clientes/editar', res.id]);
          }
        },
        error: (err) => {
          this.saving = false;
          this.updateCommandBar();
          const errorMsg = err?.error?.message || 'Error al registrar cliente.';
          this.message.error(errorMsg);
        },
      });
    }
  }

  toggleEstado(): void {
    if (!this.clienteId || !this.clienteActual) return;
    const nuevo = !this.clienteActual.activo;
    this.clienteService.cambiarEstado(this.clienteId, nuevo).subscribe({
      next: (res) => {
        this.clienteActual!.activo = nuevo;
        this.message.success(res.message || 'Estado actualizado.');
        this.updateCommandBar();
        this.cdr.markForCheck();
      },
      error: () => {
        this.message.error('No se pudo cambiar el estado.');
      },
    });
  }

  volver(): void {
    this.router.navigate(['/crm/clientes']);
  }

  getIniciales(nombre?: string): string {
    if (!nombre) return 'CL';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }
}
