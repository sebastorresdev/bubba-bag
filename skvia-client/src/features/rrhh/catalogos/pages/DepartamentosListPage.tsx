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
  Textarea,
  Switch,
  Spinner,
  Text,
  Badge,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  createTableColumn,
  type TableColumnDefinition,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Building20Regular,
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
import type { DepartamentoDto } from '../../types/recursosHumanos.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';
import { useAuthSession } from '../../../../services/authSession';

const filterFields: D365FilterField[] = [
  { id: 'nombre', label: 'Nombre del Departamento', type: 'string' },
  { id: 'descripcion', label: 'Descripción', type: 'string' },
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

export const DepartamentosListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const tableRef = useRef<D365EntityTableRef>(null);
  const { permisos } = useAuthSession();
  const canManage = permisos?.includes('rrhh.catalogos.gestionar') ?? true;

  const [departamentos, setDepartamentos] = useState<DepartamentoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal Crear/Editar
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingDept, setEditingDept] = useState<DepartamentoDto | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formDescripcion, setFormDescripcion] = useState<string>('');
  const [formActivo, setFormActivo] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const cargarDepartamentos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await RecursosHumanosService.obtenerDepartamentos();
      setDepartamentos(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar departamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDepartamentos();
  }, [cargarDepartamentos]);

  const handleOpenNuevo = () => {
    setEditingDept(null);
    setFormNombre('');
    setFormDescripcion('');
    setFormActivo(true);
    setModalOpen(true);
  };

  const handleOpenEditar = (dept: DepartamentoDto) => {
    setEditingDept(dept);
    setFormNombre(dept.nombre);
    setFormDescripcion(dept.descripcion || '');
    setFormActivo(dept.activo);
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!formNombre.trim()) {
      setErrorMessage('El nombre del departamento es requerido.');
      return;
    }
    try {
      setSaving(true);
      if (editingDept) {
        await RecursosHumanosService.actualizarDepartamento(
          editingDept.id,
          formNombre.trim(),
          formDescripcion.trim() || undefined,
          formActivo
        );
        setSuccessMessage('Departamento actualizado exitosamente.');
      } else {
        await RecursosHumanosService.crearDepartamento(
          formNombre.trim(),
          formDescripcion.trim() || undefined
        );
        setSuccessMessage('Departamento creado exitosamente.');
      }
      setModalOpen(false);
      await cargarDepartamentos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el departamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (dept: DepartamentoDto) => {
    try {
      await RecursosHumanosService.cambiarEstadoDepartamento(dept.id, !dept.activo);
      setSuccessMessage(`Departamento ${!dept.activo ? 'activado' : 'desactivado'} correctamente.`);
      await cargarDepartamentos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cambiar estado.');
    }
  };

  const handleEliminar = async (dept: DepartamentoDto) => {
    if (!window.confirm(`¿Estás seguro de eliminar el departamento "${dept.nombre}"?`)) return;
    try {
      await RecursosHumanosService.eliminarDepartamento(dept.id);
      setSuccessMessage('Departamento eliminado.');
      await cargarDepartamentos();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se puede eliminar el departamento si contiene cargos asignados.');
    }
  };

  // Filtrado por vista y buscador
  const itemsFiltrados = useMemo(() => {
    return departamentos.filter((d) => {
      if (activeView === 'activos' && !d.activo) return false;
      if (activeView === 'inactivos' && d.activo) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesNombre = d.nombre.toLowerCase().includes(q);
        const matchesDesc = d.descripcion && d.descripcion.toLowerCase().includes(q);
        if (!matchesNombre && !matchesDesc) return false;
      }
      return true;
    });
  }, [departamentos, activeView, searchTerm]);

  // Exportar a Excel
  const handleExport = () => {
    const columns: ExportColumn<DepartamentoDto>[] = [
      { header: 'Nombre del Departamento', accessor: (d) => d.nombre },
      { header: 'Descripción', accessor: (d) => d.descripcion || '' },
      { header: 'Total de Puestos / Cargos', accessor: (d) => d.totalCargos ?? 0 },
      { header: 'Estado', accessor: (d) => (d.activo ? 'Activo' : 'Inactivo') },
    ];
    exportToExcel(itemsFiltrados, columns, 'Departamentos_RRHH');
  };

  const columns: TableColumnDefinition<DepartamentoDto>[] = [
    createTableColumn<DepartamentoDto>({
      columnId: 'nombre',
      compare: (a, b) => a.nombre.localeCompare(b.nombre),
      renderHeaderCell: () => 'Nombre del Departamento',
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building20Regular style={{ color: '#0078d4' }} />
          <Text weight="semibold">{item.nombre}</Text>
        </div>
      ),
    }),
    createTableColumn<DepartamentoDto>({
      columnId: 'descripcion',
      compare: (a, b) => (a.descripcion || '').localeCompare(b.descripcion || ''),
      renderHeaderCell: () => 'Descripción',
      renderCell: (item) => (
        <Text size={200} style={{ color: '#605e5c' }}>
          {item.descripcion || '---'}
        </Text>
      ),
    }),
    createTableColumn<DepartamentoDto>({
      columnId: 'totalCargos',
      compare: (a, b) => (a.totalCargos ?? 0) - (b.totalCargos ?? 0),
      renderHeaderCell: () => 'Cargos Asociados',
      renderCell: (item) => (
        <Badge appearance="tint" color="informative">
          {item.totalCargos ?? 0} {item.totalCargos === 1 ? 'cargo' : 'cargos'}
        </Badge>
      ),
    }),
    createTableColumn<DepartamentoDto>({
      columnId: 'activo',
      compare: (a, b) => Number(a.activo) - Number(b.activo),
      renderHeaderCell: () => 'Estado',
      renderCell: (item) => <D365StatusBadge status={item.activo ? 'Activo' : 'Inactivo'} />,
    }),
    createTableColumn<DepartamentoDto>({
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
                title="Editar Departamento"
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
      <D365CommandBar ariaLabel="Comandos de Departamentos">
        {canManage && (
          <D365CommandButton icon={<Add16Regular />} tone="create" onClick={handleOpenNuevo}>
            Nuevo
          </D365CommandButton>
        )}
        <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={cargarDepartamentos}>
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
                {activeView === 'activos'
                  ? 'Departamentos activos'
                  : activeView === 'inactivos'
                  ? 'Departamentos inactivos'
                  : 'Todos los departamentos'}
              </Text>
              <ChevronDown16Regular />
            </div>
          </MenuTrigger>
          <MenuPopover>
            <MenuList className={styles.viewMenuPopover}>
              <MenuItem
                icon={activeView === 'activos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('activos')}
              >
                Departamentos activos
              </MenuItem>
              <MenuItem
                icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('inactivos')}
              >
                Departamentos inactivos
              </MenuItem>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todos los departamentos
              </MenuItem>
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

      <D365EntityTable<DepartamentoDto>
        ref={tableRef}
        columns={columns}
        items={itemsFiltrados}
        loading={loading}
        entityName="Departamentos"
        filterFields={filterFields}
      />

      {/* MODAL CREAR / EDITAR DEPARTAMENTO */}
      <Dialog open={modalOpen} onOpenChange={(_, d) => setModalOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}
            </DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <D365FormField label="Nombre del Departamento" required>
                <Input
                  value={formNombre}
                  onChange={(_, d) => setFormNombre(d.value)}
                  placeholder="Ej. Operaciones y Campo, Tecnología, Finanzas..."
                />
              </D365FormField>

              <D365FormField label="Descripción">
                <Textarea
                  value={formDescripcion}
                  onChange={(_, d) => setFormDescripcion(d.value)}
                  placeholder="Breve detalle de las funciones del área..."
                  rows={3}
                />
              </D365FormField>

              {editingDept && (
                <div style={{ paddingTop: 6 }}>
                  <Switch
                    checked={formActivo}
                    onChange={(_, d) => setFormActivo(d.checked)}
                    label={formActivo ? 'Área Activa' : 'Área Inactiva'}
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
