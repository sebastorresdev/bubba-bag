import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Text,
  Badge,
  createTableColumn,
  type TableColumnDefinition,
  type SelectionItemId,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  PeopleCommunity20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { RecursosHumanosService } from '../../services/recursosHumanos.service';
import type { EmpleadoDto } from '../../types/recursosHumanos.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';
import { useAuthSession } from '../../../../services/authSession';

export type VistaEmpleados = 'activos' | 'vacaciones' | 'cesados' | 'todos';

const filterFields: D365FilterField[] = [
  { id: 'nombreCompleto', label: 'Nombre Completo', type: 'string' },
  { id: 'numeroDocumento', label: 'N° Documento', type: 'string' },
  { id: 'departamentoNombre', label: 'Departamento', type: 'string' },
  { id: 'cargoNombre', label: 'Cargo / Puesto', type: 'string' },
  { id: 'tipoContrato', label: 'Tipo de Contrato', type: 'string' },
  {
    id: 'estado',
    label: 'Estado Laboral',
    type: 'string',
    options: [
      { value: 'Activo', label: 'Activo' },
      { value: 'Inactivo', label: 'Inactivo' },
      { value: 'DeVacaciones', label: 'De Vacaciones' },
      { value: 'ConLicencia', label: 'Con Licencia' },
      { value: 'Suspendido', label: 'Suspendido' },
      { value: 'Cesado', label: 'Cesado' },
    ],
  },
  { id: 'fechaIngreso', label: 'Fecha de Ingreso', type: 'date' },
];

export const EmpleadosListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const { permisos } = useAuthSession();
  const tableRef = useRef<D365EntityTableRef>(null);

  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeView, setActiveView] = useState<VistaEmpleados>('activos');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RecursosHumanosService.obtenerEmpleados({
        searchTerm: searchKeyword.trim() || undefined,
        pageSize: 500,
      });
      setEmpleados(data);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar la lista de colaboradores.');
    } finally {
      setLoading(false);
    }
  }, [searchKeyword]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Filtrado por vista de sistema
  const filteredEmpleados = useMemo(() => {
    let result = [...empleados];

    if (activeView === 'activos') {
      result = result.filter((e) => e.estado === 'Activo');
    } else if (activeView === 'vacaciones') {
      result = result.filter((e) => e.estado === 'DeVacaciones' || e.estado === 'ConLicencia');
    } else if (activeView === 'cesados') {
      result = result.filter((e) => e.estado === 'Cesado');
    }
    // 'todos' muestra todos sin filtrar

    return result;
  }, [empleados, activeView]);

  const canManage = permisos?.includes('rrhh.colaboradores.gestionar') ?? true;
  const canViewSalarios = permisos?.includes('rrhh.salarios.confidencial') ?? false;

  const columns: TableColumnDefinition<EmpleadoDto>[] = useMemo(
    () => [
      createTableColumn<EmpleadoDto>({
        columnId: 'nombreCompleto',
        compare: (a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`),
        renderHeaderCell: () => 'Colaborador',
        renderCell: (e) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar
              name={`${e.nombres} ${e.apellidos}`}
              image={e.fotoUrl ? { src: e.fotoUrl } : undefined}
              size={28}
              color="colorful"
            />
            <div>
              <Text weight="semibold" size={200} block style={{ color: 'inherit' }}>
                {e.apellidos}, {e.nombres}
              </Text>
              <Text size={100} style={{ color: 'var(--colorNeutralForeground3)' }}>
                {e.email || 'Sin correo registrado'}
              </Text>
            </div>
          </div>
        ),
      }),
      createTableColumn<EmpleadoDto>({
        columnId: 'documento',
        compare: (a, b) => a.numeroDocumento.localeCompare(b.numeroDocumento),
        renderHeaderCell: () => 'N° Documento',
        renderCell: (e) => (
          <div>
            <Text size={200} weight="medium" style={{ fontFamily: 'monospace' }}>
              {e.numeroDocumento}
            </Text>
            <Text size={100} block style={{ color: 'var(--colorNeutralForeground3)' }}>
              {e.tipoDocumento}
            </Text>
          </div>
        ),
      }),
      createTableColumn<EmpleadoDto>({
        columnId: 'departamento',
        compare: (a, b) => (a.departamentoNombre || '').localeCompare(b.departamentoNombre || ''),
        renderHeaderCell: () => 'Departamento',
        renderCell: (e) => (
          <Text size={200}>{e.departamentoNombre || 'Sin departamento'}</Text>
        ),
      }),
      createTableColumn<EmpleadoDto>({
        columnId: 'cargo',
        compare: (a, b) => (a.cargoNombre || '').localeCompare(b.cargoNombre || ''),
        renderHeaderCell: () => 'Cargo / Puesto',
        renderCell: (e) => (
          <Text size={200} weight="medium">{e.cargoNombre || 'Sin cargo asignado'}</Text>
        ),
      }),
      createTableColumn<EmpleadoDto>({
        columnId: 'tipoContrato',
        compare: (a, b) => (a.tipoContrato || '').localeCompare(b.tipoContrato || ''),
        renderHeaderCell: () => 'Contrato',
        renderCell: (e) => (
          <Badge appearance="tint" color="subtle">
            {e.tipoContrato || 'No especificado'}
          </Badge>
        ),
      }),
      createTableColumn<EmpleadoDto>({
        columnId: 'fechaIngreso',
        compare: (a, b) => (a.fechaIngreso || '').localeCompare(b.fechaIngreso || ''),
        renderHeaderCell: () => 'Fecha Ingreso',
        renderCell: (e) => (
          <Text size={200}>{e.fechaIngreso || '---'}</Text>
        ),
      }),
      createTableColumn<EmpleadoDto>({
        columnId: 'estado',
        compare: (a, b) => String(a.estado).localeCompare(String(b.estado)),
        renderHeaderCell: () => 'Estado Laboral',
        renderCell: (e) => (
          <D365StatusBadge
            status={e.estado}
            appearance="tint"
          />
        ),
      }),
      ...(canViewSalarios
        ? [
            createTableColumn<EmpleadoDto>({
              columnId: 'salarioBase',
              compare: (a: EmpleadoDto, b: EmpleadoDto) => (a.salarioBase || 0) - (b.salarioBase || 0),
              renderHeaderCell: () => 'Remuneración',
              renderCell: (e: EmpleadoDto) => (
                <Text size={200} weight="semibold">
                  {e.salarioBase !== null && e.salarioBase !== undefined
                    ? `${e.monedaSalario || 'PEN'} ${e.salarioBase.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                    : '---'}
                </Text>
              ),
            }),
          ]
        : []),
    ],
    [canViewSalarios]
  );

  const handleExportarExcel = () => {
    const cols: ExportColumn<EmpleadoDto>[] = [
      { header: 'Apellidos', accessor: (e) => e.apellidos },
      { header: 'Nombres', accessor: (e) => e.nombres },
      { header: 'Tipo Doc.', accessor: (e) => e.tipoDocumento },
      { header: 'N° Documento', accessor: (e) => e.numeroDocumento },
      { header: 'Email', accessor: (e) => e.email || '-' },
      { header: 'Teléfono', accessor: (e) => e.telefono || '-' },
      { header: 'Departamento', accessor: (e) => e.departamentoNombre || '-' },
      { header: 'Cargo', accessor: (e) => e.cargoNombre || '-' },
      { header: 'Tipo Contrato', accessor: (e) => e.tipoContrato || '-' },
      { header: 'Fecha Ingreso', accessor: (e) => e.fechaIngreso || '-' },
      { header: 'Estado', accessor: (e) => String(e.estado) },
      ...(canViewSalarios
        ? [
            {
              header: 'Remuneración',
              accessor: (e: EmpleadoDto) =>
                e.salarioBase !== null && e.salarioBase !== undefined
                  ? `${e.monedaSalario || 'PEN'} ${e.salarioBase}`
                  : '-',
            },
          ]
        : []),
    ];
    exportToExcel(filteredEmpleados, cols, `Colaboradores_${activeView}`);
  };

  return (
    <div className={styles.root}>
      {/* 1. Command Bar */}
      <D365CommandBar ariaLabel="Comandos de Colaboradores">
        {canManage && (
          <D365CommandButton
            icon={<Add16Regular />}
            onClick={() => navigate('/rrhh/empleados/nuevo')}
          >
            Nuevo Colaborador
          </D365CommandButton>
        )}
        <D365CommandButton
          icon={<ArrowClockwise16Regular />}
          onClick={() => void cargar()}
          disabled={loading}
        >
          Actualizar
        </D365CommandButton>
        <D365CommandButton
          icon={<ArrowDownload16Regular />}
          onClick={handleExportarExcel}
          disabled={loading}
        >
          Exportar a Excel
        </D365CommandButton>
      </D365CommandBar>

      {/* 2. Header & Search Row */}
      <div className={styles.viewHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PeopleCommunity20Regular style={{ color: 'var(--colorBrandForeground1)' }} />
          <Text size={400} weight="semibold">
            Colaboradores de la Empresa
          </Text>
          <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
            <Badge
              appearance={activeView === 'activos' ? 'filled' : 'tint'}
              color={activeView === 'activos' ? 'brand' : 'subtle'}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveView('activos')}
            >
              Activos
            </Badge>
            <Badge
              appearance={activeView === 'vacaciones' ? 'filled' : 'tint'}
              color={activeView === 'vacaciones' ? 'brand' : 'subtle'}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveView('vacaciones')}
            >
              Vacaciones / Licencia
            </Badge>
            <Badge
              appearance={activeView === 'cesados' ? 'filled' : 'tint'}
              color={activeView === 'cesados' ? 'brand' : 'subtle'}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveView('cesados')}
            >
              Cesados
            </Badge>
            <Badge
              appearance={activeView === 'todos' ? 'filled' : 'tint'}
              color={activeView === 'todos' ? 'brand' : 'subtle'}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveView('todos')}
            >
              Todos ({empleados.length})
            </Badge>
          </div>
        </div>

        <D365TableToolbarTools
          tableRef={tableRef}
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          searchPlaceholder="Buscar por nombres, DNI o cargo..."
        />
      </div>

      {/* 3. Tabla con Paginación Integrada */}
      <D365EntityTable<EmpleadoDto>
        ref={tableRef}
        items={filteredEmpleados}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={cargar}
        entityName="Colaboradores"
        filterFields={filterFields}
        selectionMode="single"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
        onRowDoubleClick={(item) => navigate(`/rrhh/empleados/${item.id}`)}
      />
    </div>
  );
};
