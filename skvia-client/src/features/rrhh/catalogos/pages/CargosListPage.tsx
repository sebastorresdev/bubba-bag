import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Select,
  Switch,
  Spinner,
  Text,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  createTableColumn,
  type TableColumnDefinition,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Briefcase20Regular,
  Edit16Regular,
  Delete16Regular,
  CheckmarkCircle16Regular,
  DismissCircle16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { RecursosHumanosService } from '../../services/recursosHumanos.service';
import type { CargoDto, DepartamentoDto } from '../../types/recursosHumanos.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';
import { useAuthSession } from '../../../../services/authSession';

const filterFields: D365FilterField[] = [
  { id: 'nombre', label: 'Nombre del Cargo', type: 'string' },
  { id: 'departamentoNombre', label: 'Departamento / Área', type: 'string' },
  {
    id: 'activo',
    label: 'Estado',
    type: 'string',
    options: [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' },
    ],
  },
];

export const CargosListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const tableRef = useRef<D365EntityTableRef>(null);
  const { permisos } = useAuthSession();
  const canManage = permisos?.includes('rrhh.catalogos.gestionar') ?? true;
  const canViewSalarios = permisos?.includes('rrhh.salarios.confidencial') ?? false;

  const [cargos, setCargos] = useState<CargoDto[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('activos');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const currentViewLabel = useMemo(() => {
    if (activeView === 'activos') return 'Puestos y cargos activos';
    if (activeView === 'inactivos') return 'Puestos y cargos inactivos';
    if (activeView === 'todos') return 'Todos los puestos y cargos';
    if (activeView.startsWith('depto_')) {
      const dId = activeView.replace('depto_', '');
      const d = departamentos.find((dept) => dept.id === dId);
      return d ? `Cargos: ${d.nombre}` : 'Puestos y cargos';
    }
    return 'Puestos y cargos';
  }, [activeView, departamentos]);

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCargo, setEditingCargo] = useState<CargoDto | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formDeptoId, setFormDeptoId] = useState<string>('');
  const [formSalarioRef, setFormSalarioRef] = useState<string>('');
  const [formActivo, setFormActivo] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const [cargosData, deptosData] = await Promise.all([
        RecursosHumanosService.obtenerCargos(),
        RecursosHumanosService.obtenerDepartamentos(),
      ]);
      setCargos(cargosData);
      setDepartamentos(deptosData);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar los cargos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleOpenNuevo = () => {
    setEditingCargo(null);
    setFormNombre('');
    setFormDeptoId(departamentos.length > 0 ? departamentos[0].id : '');
    setFormSalarioRef('');
    setFormActivo(true);
    setModalOpen(true);
  };

  const handleOpenEditar = (cargo: CargoDto) => {
    setEditingCargo(cargo);
    setFormNombre(cargo.nombre);
    setFormDeptoId(cargo.departamentoId);
    setFormSalarioRef(cargo.salarioReferencial != null ? String(cargo.salarioReferencial) : '');
    setFormActivo(cargo.activo);
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!formNombre.trim()) {
      setErrorMessage('El nombre del puesto/cargo es requerido.');
      return;
    }
    if (!formDeptoId) {
      setErrorMessage('Debe seleccionar el departamento al que pertenece el cargo.');
      return;
    }

    try {
      setSaving(true);
      const salarioNum = formSalarioRef.trim() ? Number(formSalarioRef) : null;

      if (editingCargo) {
        await RecursosHumanosService.actualizarCargo(
          editingCargo.id,
          formNombre.trim(),
          formDeptoId,
          salarioNum,
          formActivo
        );
        setSuccessMessage('Cargo actualizado exitosamente.');
      } else {
        await RecursosHumanosService.crearCargo(
          formNombre.trim(),
          formDeptoId,
          salarioNum
        );
        setSuccessMessage('Cargo creado exitosamente.');
      }
      setModalOpen(false);
      await cargarDatos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el cargo.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (cargo: CargoDto) => {
    try {
      await RecursosHumanosService.cambiarEstadoCargo(cargo.id, !cargo.activo);
      setSuccessMessage(`Cargo ${!cargo.activo ? 'activado' : 'desactivado'} correctamente.`);
      await cargarDatos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cambiar estado.');
    }
  };

  const handleEliminar = async (cargo: CargoDto) => {
    if (!window.confirm(`¿Estás seguro de eliminar el cargo "${cargo.nombre}"?`)) return;
    try {
      await RecursosHumanosService.eliminarCargo(cargo.id);
      setSuccessMessage('Cargo eliminado.');
      await cargarDatos();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se puede eliminar el cargo si hay colaboradores asignados.');
    }
  };

  // Filtrado
  const itemsFiltrados = useMemo(() => {
    return cargos.filter((c) => {
      if (activeView === 'activos' && !c.activo) return false;
      if (activeView === 'inactivos' && c.activo) return false;
      if (activeView.startsWith('depto_')) {
        const dId = activeView.replace('depto_', '');
        if (c.departamentoId !== dId) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesNombre = c.nombre.toLowerCase().includes(q);
        const matchesDepto = (c.departamentoNombre || '').toLowerCase().includes(q);
        if (!matchesNombre && !matchesDepto) return false;
      }
      return true;
    });
  }, [cargos, activeView, searchTerm]);

  // Exportar a Excel
  const handleExport = () => {
    const columns: ExportColumn<CargoDto>[] = [
      { header: 'Puesto / Cargo', accessor: (c) => c.nombre },
      { header: 'Departamento', accessor: (c) => c.departamentoNombre || '' },
      ...(canViewSalarios
        ? [{ header: 'Salario Referencial (PEN)', accessor: (c: CargoDto) => c.salarioReferencial ?? 0 }]
        : []),
      { header: 'Estado', accessor: (c) => (c.activo ? 'Activo' : 'Inactivo') },
    ];
    exportToExcel(itemsFiltrados, columns, 'Cargos_RRHH');
  };

  const columns: TableColumnDefinition<CargoDto>[] = [
    createTableColumn<CargoDto>({
      columnId: 'nombre',
      compare: (a, b) => a.nombre.localeCompare(b.nombre),
      renderHeaderCell: () => 'Puesto / Cargo',
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Briefcase20Regular style={{ color: '#0078d4' }} />
          <Text weight="semibold">{item.nombre}</Text>
        </div>
      ),
    }),
    createTableColumn<CargoDto>({
      columnId: 'departamentoNombre',
      compare: (a, b) => (a.departamentoNombre || '').localeCompare(b.departamentoNombre || ''),
      renderHeaderCell: () => 'Departamento / Área',
      renderCell: (item) => (
        <Text size={200} weight="medium">
          {item.departamentoNombre || '---'}
        </Text>
      ),
    }),
    ...(canViewSalarios
      ? [
          createTableColumn<CargoDto>({
            columnId: 'salarioReferencial',
            compare: (a, b) => (a.salarioReferencial ?? 0) - (b.salarioReferencial ?? 0),
            renderHeaderCell: () => 'Salario Referencial',
            renderCell: (item: CargoDto) => (
              <Text size={200} style={{ color: item.salarioReferencial ? '#107c41' : '#605e5c' }}>
                {item.salarioReferencial != null
                  ? `S/ ${item.salarioReferencial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                  : 'No definido'}
              </Text>
            ),
          }),
        ]
      : []),
    createTableColumn<CargoDto>({
      columnId: 'activo',
      compare: (a, b) => Number(a.activo) - Number(b.activo),
      renderHeaderCell: () => 'Estado',
      renderCell: (item) => <D365StatusBadge status={item.activo ? 'Activo' : 'Inactivo'} />,
    }),
    createTableColumn<CargoDto>({
      columnId: 'acciones',
      renderHeaderCell: () => 'Acciones',
      renderCell: (item) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {canManage && (
            <>
              <Button
                size="small"
                appearance="subtle"
                icon={<Edit16Regular />}
                onClick={() => handleOpenEditar(item)}
                title="Editar Cargo"
              />
              <Button
                size="small"
                appearance="subtle"
                icon={item.activo ? <DismissCircle16Regular /> : <CheckmarkCircle16Regular />}
                onClick={() => handleToggleEstado(item)}
                title={item.activo ? 'Desactivar' : 'Activar'}
              />
              <Button
                size="small"
                appearance="subtle"
                icon={<Delete16Regular />}
                onClick={() => handleEliminar(item)}
                title="Eliminar"
              />
            </>
          )}
        </div>
      ),
    }),
  ];

  return (
    <div className={styles.root}>
      <D365CommandBar ariaLabel="Comandos de Cargos">
        {canManage && (
          <D365CommandButton icon={<Add16Regular />} tone="create" onClick={handleOpenNuevo}>
            Nuevo
          </D365CommandButton>
        )}
        <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={cargarDatos}>
          Actualizar
        </D365CommandButton>
        <D365CommandDivider />
        <D365CommandButton icon={<ArrowDownload16Regular />} onClick={handleExport}>
          Exportar a Excel
        </D365CommandButton>
      </D365CommandBar>

      {/* 2. Header & Search Row (Selector de Vista D365) */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} title="Seleccionar vista">
              <Text weight="semibold" size={400}>
                {currentViewLabel}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              <MenuGroup>
                <MenuGroupHeader>Vistas del sistema</MenuGroupHeader>
                <MenuItem
                  icon={activeView === 'activos' ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView('activos')}
                >
                  Puestos y cargos activos
                </MenuItem>
                <MenuItem
                  icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView('inactivos')}
                >
                  Puestos y cargos inactivos
                </MenuItem>
                <MenuItem
                  icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView('todos')}
                >
                  Todos los puestos y cargos
                </MenuItem>
              </MenuGroup>
              {departamentos.length > 0 && (
                <>
                  <MenuDivider />
                  <MenuGroup>
                    <MenuGroupHeader>Por departamento</MenuGroupHeader>
                    {departamentos.map((d) => (
                      <MenuItem
                        key={d.id}
                        icon={activeView === `depto_${d.id}` ? <Checkmark16Regular /> : undefined}
                        onClick={() => setActiveView(`depto_${d.id}`)}
                      >
                        {d.nombre}
                      </MenuItem>
                    ))}
                  </MenuGroup>
                </>
              )}
            </MenuList>
          </MenuPopover>
        </Menu>
        <D365TableToolbarTools
          tableRef={tableRef}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar"
        />
      </div>

      {errorMessage && (
        <div style={{ padding: '8px 24px' }}>
          <D365MessageBar intent="error" onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </D365MessageBar>
        </div>
      )}
      {successMessage && (
        <div style={{ padding: '8px 24px' }}>
          <D365MessageBar intent="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </D365MessageBar>
        </div>
      )}

      <D365EntityTable<CargoDto>
        ref={tableRef}
        columns={columns}
        items={itemsFiltrados}
        loading={loading}
        entityName="Cargos"
        filterFields={filterFields}
      />

      {/* MODAL CREAR / EDITAR CARGO */}
      <Dialog open={modalOpen} onOpenChange={(_, d) => setModalOpen(d.open)}>
        <DialogSurface style={{ width: '540px', maxWidth: '95vw' }}>
          <DialogBody>
            <DialogTitle>{editingCargo ? 'Editar Cargo' : 'Nuevo Puesto / Cargo'}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <D365FormField label="Nombre del Puesto / Cargo" required>
                <Input
                  style={{ width: '100%' }}
                  value={formNombre}
                  onChange={(_, d) => setFormNombre(d.value)}
                />
              </D365FormField>

              <D365FormField label="Departamento / Área" required>
                <Select
                  style={{ width: '100%' }}
                  value={formDeptoId}
                  onChange={(_, d) => setFormDeptoId(d.value)}
                >
                  <option value="">-- Seleccionar Área --</option>
                  {departamentos.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                  ))}
                </Select>
              </D365FormField>

              {canViewSalarios && (
                <D365FormField label="Salario Referencial (PEN)">
                  <Input
                    style={{ width: '100%' }}
                    type="number"
                    value={formSalarioRef}
                    onChange={(_, d) => setFormSalarioRef(d.value)}
                  />
                </D365FormField>
              )}

              {editingCargo && (
                <div style={{ paddingTop: 6 }}>
                  <Switch
                    checked={formActivo}
                    onChange={(_, d) => setFormActivo(d.checked)}
                    label={formActivo ? 'Cargo Activo' : 'Cargo Inactivo'}
                  />
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button appearance="primary" onClick={handleGuardar} disabled={saving}>
                {saving ? <Spinner size="tiny" /> : 'Guardar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
