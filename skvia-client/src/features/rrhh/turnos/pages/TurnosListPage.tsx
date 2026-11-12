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
  Switch,
  Spinner,
  Text,
  Badge,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  tokens,
  createTableColumn,
  type TableColumnDefinition,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  Clock20Regular,
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
import type { TurnoDto } from '../../types/recursosHumanos.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';
import { useAuthSession } from '../../../../services/authSession';

const filterFields: D365FilterField[] = [
  { id: 'codigo', label: 'Código', type: 'string' },
  { id: 'nombre', label: 'Nombre del Turno', type: 'string' },
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

export const TurnosListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const tableRef = useRef<D365EntityTableRef>(null);
  const { permisos } = useAuthSession();
  const canManage = permisos?.includes('rrhh.catalogos.gestionar') ?? true;

  const [turnos, setTurnos] = useState<TurnoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal Crear / Editar Turno
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingTurno, setEditingTurno] = useState<TurnoDto | null>(null);
  const [formCodigo, setFormCodigo] = useState<string>('');
  const [formNombre, setFormNombre] = useState<string>('');
  const [formHoraInicio, setFormHoraInicio] = useState<string>('08:00');
  const [formHoraFin, setFormHoraFin] = useState<string>('17:00');
  const [formRefrigerio, setFormRefrigerio] = useState<number>(60);
  const [formTolerancia, setFormTolerancia] = useState<number>(15);
  const [formActivo, setFormActivo] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const horasCalculadas = useMemo(() => {
    if (!formHoraInicio || !formHoraFin) return '---';
    const [hIni, mIni] = formHoraInicio.split(':').map(Number);
    const [hFin, mFin] = formHoraFin.split(':').map(Number);
    if (isNaN(hIni) || isNaN(mIni) || isNaN(hFin) || isNaN(mFin)) return '---';

    let totalMinutos = (hFin * 60 + mFin) - (hIni * 60 + mIni);
    if (totalMinutos < 0) totalMinutos += 24 * 60;

    const netMinutos = Math.max(0, totalMinutos - (formRefrigerio || 0));
    const horas = Math.floor(netMinutos / 60);
    const minutos = netMinutos % 60;
    return `${horas}h ${minutos > 0 ? `${minutos}m` : ''} netas`;
  }, [formHoraInicio, formHoraFin, formRefrigerio]);

  const cargarTurnos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await RecursosHumanosService.obtenerTurnos();
      setTurnos(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cargar los turnos de trabajo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTurnos();
  }, [cargarTurnos]);

  const handleOpenNuevo = () => {
    setEditingTurno(null);
    setFormCodigo('');
    setFormNombre('');
    setFormHoraInicio('08:00');
    setFormHoraFin('17:00');
    setFormRefrigerio(60);
    setFormTolerancia(15);
    setFormActivo(true);
    setModalOpen(true);
  };

  const handleOpenEditar = (t: TurnoDto) => {
    setEditingTurno(t);
    setFormCodigo(t.codigo);
    setFormNombre(t.nombre);
    setFormHoraInicio(t.horaInicio);
    setFormHoraFin(t.horaFin);
    setFormRefrigerio(t.minutosRefrigerio);
    setFormTolerancia(t.minutosToleranciaEntrada);
    setFormActivo(t.activo);
    setModalOpen(true);
  };

  const handleGuardar = async () => {
    if (!editingTurno && !formCodigo.trim()) {
      setErrorMessage('El código del turno es obligatorio (ej. T-ADM-01).');
      return;
    }
    if (!formNombre.trim()) {
      setErrorMessage('El nombre descriptivo del turno es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      if (editingTurno) {
        await RecursosHumanosService.actualizarTurno(editingTurno.id, {
          nombre: formNombre.trim(),
          horaInicio: formHoraInicio,
          horaFin: formHoraFin,
          minutosRefrigerio: formRefrigerio,
          minutosToleranciaEntrada: formTolerancia,
          minutosToleranciaRefrigerio: 5,
          activo: formActivo,
        });
        setSuccessMessage('Turno de trabajo actualizado correctamente.');
      } else {
        await RecursosHumanosService.crearTurno({
          codigo: formCodigo.trim(),
          nombre: formNombre.trim(),
          horaInicio: formHoraInicio,
          horaFin: formHoraFin,
          minutosRefrigerio: formRefrigerio,
          minutosToleranciaEntrada: formTolerancia,
        });
        setSuccessMessage('Turno de trabajo creado exitosamente.');
      }
      setModalOpen(false);
      await cargarTurnos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el turno');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async (t: TurnoDto) => {
    try {
      await RecursosHumanosService.cambiarEstadoTurno(t.id, !t.activo);
      setSuccessMessage(`Turno ${!t.activo ? 'activado' : 'desactivado'} exitosamente.`);
      await cargarTurnos();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cambiar estado');
    }
  };

  const handleEliminar = async (t: TurnoDto) => {
    if (!window.confirm(`¿Estás seguro de eliminar el turno "${t.nombre}"?`)) return;
    try {
      await RecursosHumanosService.eliminarTurno(t.id);
      setSuccessMessage('Turno eliminado correctamente.');
      await cargarTurnos();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se puede eliminar el turno si tiene colaboradores asignados.');
    }
  };

  const itemsFiltrados = useMemo(() => {
    return turnos.filter((t) => {
      if (activeView === 'activos' && !t.activo) return false;
      if (activeView === 'inactivos' && t.activo) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesNombre = t.nombre.toLowerCase().includes(q);
        const matchesCodigo = t.codigo.toLowerCase().includes(q);
        if (!matchesNombre && !matchesCodigo) return false;
      }
      return true;
    });
  }, [turnos, activeView, searchTerm]);

  const handleExport = () => {
    const columns: ExportColumn<TurnoDto>[] = [
      { header: 'Código', accessor: (t) => t.codigo },
      { header: 'Nombre del Turno', accessor: (t) => t.nombre },
      { header: 'Entrada', accessor: (t) => t.horaInicio },
      { header: 'Salida', accessor: (t) => t.horaFin },
      { header: 'Refrigerio (min)', accessor: (t) => t.minutosRefrigerio },
      { header: 'Tolerancia Entrada (min)', accessor: (t) => t.minutosToleranciaEntrada },
      { header: 'Horas Netas', accessor: (t) => t.horasJornada },
      { header: 'Estado', accessor: (t) => (t.activo ? 'Activo' : 'Inactivo') },
    ];
    exportToExcel(itemsFiltrados, columns, 'Turnos_Horarios_RRHH');
  };

  const columns: TableColumnDefinition<TurnoDto>[] = [
    createTableColumn<TurnoDto>({
      columnId: 'codigo',
      compare: (a, b) => a.codigo.localeCompare(b.codigo),
      renderHeaderCell: () => 'Código',
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock20Regular style={{ color: '#0078d4' }} />
          <Text weight="semibold">{item.codigo}</Text>
        </div>
      ),
    }),
    createTableColumn<TurnoDto>({
      columnId: 'nombre',
      compare: (a, b) => a.nombre.localeCompare(b.nombre),
      renderHeaderCell: () => 'Nombre del Turno',
      renderCell: (item) => <Text weight="medium">{item.nombre}</Text>,
    }),
    createTableColumn<TurnoDto>({
      columnId: 'horario',
      renderHeaderCell: () => 'Franja Horaria',
      renderCell: (item) => (
        <Badge appearance="tint" color="brand">
          {item.horaInicio} - {item.horaFin}
        </Badge>
      ),
    }),
    createTableColumn<TurnoDto>({
      columnId: 'refrigerio',
      renderHeaderCell: () => 'Refrigerio',
      renderCell: (item) => <Text size={200}>{item.minutosRefrigerio} min</Text>,
    }),
    createTableColumn<TurnoDto>({
      columnId: 'tolerancia',
      renderHeaderCell: () => 'Tolerancia',
      renderCell: (item) => (
        <Text size={200} style={{ color: '#107c41' }}>
          +{item.minutosToleranciaEntrada} min
        </Text>
      ),
    }),
    createTableColumn<TurnoDto>({
      columnId: 'horasJornada',
      renderHeaderCell: () => 'Jornada Neta',
      renderCell: (item) => <Text size={200}>{item.horasJornada} hrs</Text>,
    }),
    createTableColumn<TurnoDto>({
      columnId: 'activo',
      compare: (a, b) => Number(a.activo) - Number(b.activo),
      renderHeaderCell: () => 'Estado',
      renderCell: (item) => <D365StatusBadge status={item.activo ? 'Activo' : 'Inactivo'} />,
    }),
    createTableColumn<TurnoDto>({
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
                title="Editar Turno"
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
      <D365CommandBar ariaLabel="Comandos de Turnos y Horarios">
        {canManage && (
          <D365CommandButton icon={<Add16Regular />} tone="create" onClick={handleOpenNuevo}>
            Nuevo
          </D365CommandButton>
        )}
        <D365CommandButton icon={<ArrowClockwise16Regular />} onClick={cargarTurnos}>
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
                  ? 'Horarios y turnos activos'
                  : activeView === 'inactivos'
                  ? 'Horarios y turnos inactivos'
                  : 'Todos los turnos'}
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
                Horarios y turnos activos
              </MenuItem>
              <MenuItem
                icon={activeView === 'inactivos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('inactivos')}
              >
                Horarios y turnos inactivos
              </MenuItem>
              <MenuItem
                icon={activeView === 'todos' ? <Checkmark16Regular /> : undefined}
                onClick={() => setActiveView('todos')}
              >
                Todos los turnos
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

      <D365EntityTable<TurnoDto>
        ref={tableRef}
        columns={columns}
        items={itemsFiltrados}
        loading={loading}
        entityName="Turnos"
        filterFields={filterFields}
      />

      {/* MODAL CREAR / EDITAR TURNO */}
      <Dialog open={modalOpen} onOpenChange={(_, d) => setModalOpen(d.open)}>
        <DialogSurface style={{ width: '560px', maxWidth: '95vw' }}>
          <DialogBody>
            <DialogTitle>{editingTurno ? 'Editar Turno Laboral' : 'Nuevo Turno de Trabajo'}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              {!editingTurno && (
                <D365FormField label="Código de Turno" required>
                  <Input
                    style={{ width: '100%' }}
                    value={formCodigo}
                    onChange={(_, d) => setFormCodigo(d.value)}
                  />
                </D365FormField>
              )}

              <D365FormField label="Nombre del Turno" required>
                <Input
                  style={{ width: '100%' }}
                  value={formNombre}
                  onChange={(_, d) => setFormNombre(d.value)}
                />
              </D365FormField>

              <D365FormField label="Hora de Entrada" required>
                <Input
                  style={{ width: '100%' }}
                  type="time"
                  value={formHoraInicio}
                  onChange={(_, d) => setFormHoraInicio(d.value)}
                />
              </D365FormField>

              <D365FormField label="Hora de Salida" required>
                <Input
                  style={{ width: '100%' }}
                  type="time"
                  value={formHoraFin}
                  onChange={(_, d) => setFormHoraFin(d.value)}
                />
              </D365FormField>

              <D365FormField label="Refrigerio (Minutos)">
                <Input
                  style={{ width: '100%' }}
                  type="number"
                  value={String(formRefrigerio)}
                  onChange={(_, d) => setFormRefrigerio(Number(d.value) || 0)}
                />
              </D365FormField>

              <D365FormField label="Tolerancia Entrada (Min)">
                <Input
                  style={{ width: '100%' }}
                  type="number"
                  value={String(formTolerancia)}
                  onChange={(_, d) => setFormTolerancia(Number(d.value) || 0)}
                />
              </D365FormField>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 6,
                  backgroundColor: tokens.colorNeutralBackground3,
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  marginTop: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock20Regular style={{ color: tokens.colorBrandForeground1 }} />
                  <Text size={200} weight="semibold">
                    Jornada neta de trabajo:
                  </Text>
                </div>
                <Badge appearance="tint" color="informative" size="large">
                  {horasCalculadas}
                </Badge>
              </div>

              {editingTurno && (
                <div style={{ paddingTop: 6 }}>
                  <Switch
                    checked={formActivo}
                    onChange={(_, d) => setFormActivo(d.checked)}
                    label={formActivo ? 'Turno Activo' : 'Turno Inactivo'}
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
