import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Link,
  TableCellLayout,
  Text,
  createTableColumn,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  SplitButton,
  type TableColumnDefinition,
  type SelectionItemId,
  type MenuButtonProps,
} from '@fluentui/react-components';
import {
  Add16Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  ChevronDown16Regular,
  Checkmark16Regular,
  DocumentTable20Regular,
  DocumentText20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../../components/common/D365CommandBar';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import { ClienteService } from '../services/cliente.service';
import type { ClienteListadoItemDto } from '../types/cliente.types';
import { exportToExcel, exportToCSV, type ExportColumn } from '../../../../utils/exportUtils';

type VistaClientes = 'todas' | 'activos' | 'servicio' | 'facturacion' | 'inactivos';

const nombresVistaClientes: Record<VistaClientes, string> = {
  todas: 'Todas las cuentas',
  activos: 'Cuentas activas',
  servicio: 'Abonados en servicio',
  facturacion: 'Clientes de facturación',
  inactivos: 'Cuentas inactivas',
};

const filterFields: D365FilterField[] = [
  { id: 'codigoCliente', label: 'Código de cuenta', type: 'string' },
  { id: 'nombreCompletoODenominacion', label: 'Nombre o Razón Social', type: 'string' },
  { id: 'documentoIdentidad', label: 'N° Documento', type: 'string' },
  { id: 'telefonoPrincipal', label: 'Teléfono', type: 'string' },
  { id: 'departamento', label: 'Departamento', type: 'string' },
  { id: 'distrito', label: 'Distrito', type: 'string' },
  {
    id: 'tipoPersona',
    label: 'Tipo de persona',
    type: 'string',
    options: [
      { value: 'NATURAL', label: 'Persona Natural' },
      { value: 'JURIDICA', label: 'Persona Jurídica' },
    ],
  },
];

export const ClientesListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);

  const [clientes, setClientes] = useState<ClienteListadoItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeView, setActiveView] = useState<VistaClientes>('activos');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ClienteService.obtenerClientes();
      setClientes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las cuentas de clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filteredClientes = useMemo(() => {
    let result = [...clientes];

    if (activeView === 'activos') {
      result = result.filter((c) => c.activo);
    } else if (activeView === 'servicio') {
      result = result.filter((c) => c.activo && c.esClienteServicio);
    } else if (activeView === 'facturacion') {
      result = result.filter((c) => c.activo && c.esClienteFacturacion);
    } else if (activeView === 'inactivos') {
      result = result.filter((c) => !c.activo);
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (c) =>
          c.codigoCliente.toLowerCase().includes(q) ||
          c.nombreCompletoODenominacion.toLowerCase().includes(q) ||
          c.documentoIdentidad.toLowerCase().includes(q) ||
          c.telefonoPrincipal.toLowerCase().includes(q) ||
          c.distrito.toLowerCase().includes(q) ||
          c.departamento.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return result;
  }, [clientes, activeView, searchKeyword]);

  const handleExportarExcel = () => {
    const cols: ExportColumn<ClienteListadoItemDto>[] = [
      { header: 'Código', accessor: (c) => c.codigoCliente },
      { header: 'Nombre / Razón Social', accessor: (c) => c.nombreCompletoODenominacion },
      { header: 'Tipo Persona', accessor: (c) => c.tipoPersona },
      { header: 'Tipo Doc.', accessor: (c) => c.tipoDocumento },
      { header: 'N° Documento', accessor: (c) => c.documentoIdentidad },
      { header: 'Teléfono', accessor: (c) => c.telefonoPrincipal },
      { header: 'Email', accessor: (c) => c.email || '' },
      { header: 'Dirección', accessor: (c) => c.direccion },
      { header: 'Distrito', accessor: (c) => c.distrito },
      { header: 'Departamento', accessor: (c) => c.departamento },
      { header: 'Estado', accessor: (c) => (c.activo ? 'Activo' : 'Inactivo') },
    ];
    exportToExcel(filteredClientes, cols, 'Cuentas_Clientes');
  };

  const handleExportarCSV = () => {
    const cols: ExportColumn<ClienteListadoItemDto>[] = [
      { header: 'Código', accessor: (c) => c.codigoCliente },
      { header: 'Nombre', accessor: (c) => c.nombreCompletoODenominacion },
      { header: 'Documento', accessor: (c) => c.documentoIdentidad },
      { header: 'Teléfono', accessor: (c) => c.telefonoPrincipal },
      { header: 'Dirección', accessor: (c) => c.direccion },
      { header: 'Distrito', accessor: (c) => c.distrito },
      { header: 'Departamento', accessor: (c) => c.departamento },
    ];
    exportToCSV(filteredClientes, cols, 'Cuentas_Clientes');
  };

  const columns: TableColumnDefinition<ClienteListadoItemDto>[] = useMemo(
    () => [
      createTableColumn<ClienteListadoItemDto>({
        columnId: 'codigoCliente',
        compare: (a, b) => a.codigoCliente.localeCompare(b.codigoCliente),
        renderHeaderCell: () => 'Código',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servicio-campo/clientes/${item.id}`);
              }}
              title={item.codigoCliente}
            >
              {item.codigoCliente}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ClienteListadoItemDto>({
        columnId: 'nombreCompletoODenominacion',
        compare: (a, b) =>
          a.nombreCompletoODenominacion.localeCompare(b.nombreCompletoODenominacion),
        renderHeaderCell: () => 'Nombre / Razón Social',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text weight="semibold">{item.nombreCompletoODenominacion}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ClienteListadoItemDto>({
        columnId: 'documentoIdentidad',
        compare: (a, b) => a.documentoIdentidad.localeCompare(b.documentoIdentidad),
        renderHeaderCell: () => 'Documento',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.tipoDocumento}: {item.documentoIdentidad}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ClienteListadoItemDto>({
        columnId: 'tipoPersona',
        compare: (a, b) => a.tipoPersona.localeCompare(b.tipoPersona),
        renderHeaderCell: () => 'Tipo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.tipoPersona === 'JURIDICA' ? 'Persona Jurídica' : 'Persona Natural'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ClienteListadoItemDto>({
        columnId: 'telefonoPrincipal',
        compare: (a, b) => a.telefonoPrincipal.localeCompare(b.telefonoPrincipal),
        renderHeaderCell: () => 'Teléfono',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.telefonoPrincipal || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ClienteListadoItemDto>({
        columnId: 'ubicacion',
        compare: (a, b) => a.distrito.localeCompare(b.distrito),
        renderHeaderCell: () => 'Ubicación',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text title={item.direccion}>
              {item.distrito ? `${item.distrito}, ${item.departamento}` : item.direccion}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ClienteListadoItemDto>({
        columnId: 'clasificacion',
        renderHeaderCell: () => 'Rol Comercial',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <D365StatusBadge
              status={
                item.esClienteFacturacion && item.esClienteServicio
                  ? 'Facturación y Servicio'
                  : item.esClienteFacturacion
                  ? 'Facturación'
                  : 'Servicio'
              }
              color={item.esClienteFacturacion ? 'brand' : 'informative'}
            />
          </TableCellLayout>
        ),
      }),
      createTableColumn<ClienteListadoItemDto>({
        columnId: 'estado',
        compare: (a, b) => Number(b.activo) - Number(a.activo),
        renderHeaderCell: () => 'Estado',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <D365StatusBadge status={item.activo} />
          </TableCellLayout>
        ),
      }),
    ],
    [navigate]
  );

  return (
    <div className={styles.root}>
      {/* 1. TOP COMMAND BAR */}
      <D365CommandBar ariaLabel="Comandos de cuentas y clientes">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/clientes/nuevo')}
          >
            Nuevo
          </D365CommandButton>
          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            onClick={() => void cargar()}
            disabled={loading}
          >
            Actualizar
          </D365CommandButton>
          <Menu positioning="below-start">
            <MenuTrigger disableButtonEnhancement>
              {(triggerProps: MenuButtonProps) => (
                <SplitButton
                  appearance="subtle"
                  size="small"
                  icon={<ArrowDownload16Regular />}
                  primaryActionButton={{ onClick: handleExportarExcel }}
                  menuButton={triggerProps}
                >
                  Exportar a Excel
                </SplitButton>
              )}
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<DocumentTable20Regular />} onClick={handleExportarExcel}>
                  Exportar a Excel (.xlsx)
                </MenuItem>
                <MenuItem icon={<DocumentText20Regular />} onClick={handleExportarCSV}>
                  Exportar a CSV (.csv)
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </D365CommandBar>

      {/* 2. VIEW HEADER ROW (Selector + Tools) */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} role="button" tabIndex={0}>
              <Text>{nombresVistaClientes[activeView]}</Text>
              <ChevronDown16Regular className={styles.iconChevronMargin} />
            </div>
          </MenuTrigger>
          <MenuPopover className={styles.viewMenuPopover}>
            <MenuList>
              {(Object.keys(nombresVistaClientes) as VistaClientes[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={activeView === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView(v)}
                >
                  {nombresVistaClientes[v]}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        <D365TableToolbarTools
          tableRef={tableRef}
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          searchPlaceholder="Buscar cuentas o clientes..."
        />
      </div>

      {/* 3. GRID PRINCIPAL */}
      <D365EntityTable<ClienteListadoItemDto>
        ref={tableRef}
        items={filteredClientes}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={cargar}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
        onRowDoubleClick={(item) => navigate(`/servicio-campo/clientes/${item.id}`)}
        filterFields={filterFields}
        entityName="clientes"
        tableId="clientes-grid"
      />

      {/* 4. FOOTER */}
      <div className={styles.footer}>
        <Text>
          {filteredClientes.length} {filteredClientes.length === 1 ? 'cuenta' : 'cuentas'}
        </Text>
      </div>
    </div>
  );
};

export default ClientesListPage;
