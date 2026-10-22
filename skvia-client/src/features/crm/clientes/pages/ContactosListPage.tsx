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
import type { ContactoDto } from '../types/cliente.types';
import { exportToExcel, exportToCSV, type ExportColumn } from '../../../../utils/exportUtils';

type VistaContactos = 'todos' | 'activos' | 'inactivos';

const nombresVistaContactos: Record<VistaContactos, string> = {
  todos: 'Todos los contactos',
  activos: 'Contactos activos',
  inactivos: 'Contactos inactivos',
};

const filterFields: D365FilterField[] = [
  { id: 'nombreCompleto', label: 'Nombre Completo', type: 'string' },
  { id: 'cargo', label: 'Cargo / Puesto', type: 'string' },
  { id: 'cuentaNombre', label: 'Cuenta', type: 'string' },
  { id: 'telefonoMovil', label: 'Teléfono Móvil', type: 'string' },
  { id: 'email', label: 'Correo Electrónico', type: 'string' },
];

export const ContactosListPage: React.FC = () => {
  const styles = useD365ListStyles();
  const navigate = useNavigate();
  const tableRef = useRef<D365EntityTableRef>(null);

  const [contactos, setContactos] = useState<ContactoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeView, setActiveView] = useState<VistaContactos>('activos');
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ClienteService.obtenerContactos();
      setContactos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los contactos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filteredContactos = useMemo(() => {
    let result = [...contactos];

    if (activeView === 'activos') {
      result = result.filter((c) => c.activo);
    } else if (activeView === 'inactivos') {
      result = result.filter((c) => !c.activo);
    }

    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(
        (c) =>
          c.nombreCompleto.toLowerCase().includes(q) ||
          c.telefonoMovil.toLowerCase().includes(q) ||
          (c.cargo && c.cargo.toLowerCase().includes(q)) ||
          (c.cuentaNombre && c.cuentaNombre.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }

    return result;
  }, [contactos, activeView, searchKeyword]);

  const handleExportarExcel = () => {
    const cols: ExportColumn<ContactoDto>[] = [
      { header: 'Nombre Completo', accessor: (c) => c.nombreCompleto },
      { header: 'Cargo / Puesto', accessor: (c) => c.cargo || '' },
      { header: 'Cuenta', accessor: (c) => c.cuentaNombre || '' },
      { header: 'Teléfono Móvil', accessor: (c) => c.telefonoMovil },
      { header: 'Teléfono Trabajo', accessor: (c) => c.telefonoTrabajo || '' },
      { header: 'Email', accessor: (c) => c.email || '' },
      { header: 'Estado', accessor: (c) => (c.activo ? 'Activo' : 'Inactivo') },
    ];
    exportToExcel(filteredContactos, cols, 'Contactos');
  };

  const handleExportarCSV = () => {
    const cols: ExportColumn<ContactoDto>[] = [
      { header: 'Nombre Completo', accessor: (c) => c.nombreCompleto },
      { header: 'Cargo / Puesto', accessor: (c) => c.cargo || '' },
      { header: 'Cuenta', accessor: (c) => c.cuentaNombre || '' },
      { header: 'Teléfono Móvil', accessor: (c) => c.telefonoMovil },
      { header: 'Email', accessor: (c) => c.email || '' },
    ];
    exportToCSV(filteredContactos, cols, 'Contactos');
  };

  const columns: TableColumnDefinition<ContactoDto>[] = useMemo(
    () => [
      createTableColumn<ContactoDto>({
        columnId: 'nombreCompleto',
        compare: (a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto),
        renderHeaderCell: () => 'Nombre Completo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servicio-campo/contactos/${item.id}`);
              }}
              title={item.nombreCompleto}
            >
              {item.nombreCompleto}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ContactoDto>({
        columnId: 'cargo',
        compare: (a, b) => (a.cargo || '').localeCompare(b.cargo || ''),
        renderHeaderCell: () => 'Cargo / Puesto',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.cargo || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ContactoDto>({
        columnId: 'cuentaNombre',
        compare: (a, b) => (a.cuentaNombre || '').localeCompare(b.cuentaNombre || ''),
        renderHeaderCell: () => 'Cuenta',
        renderCell: (item) => (
          <TableCellLayout truncate>
            {item.cuentaId && item.cuentaNombre ? (
              <Link
                as="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/servicio-campo/cuentas/${item.cuentaId}`);
                }}
              >
                {item.cuentaNombre}
              </Link>
            ) : (
              <Text>—</Text>
            )}
          </TableCellLayout>
        ),
      }),
      createTableColumn<ContactoDto>({
        columnId: 'telefonoMovil',
        compare: (a, b) => a.telefonoMovil.localeCompare(b.telefonoMovil),
        renderHeaderCell: () => 'Teléfono Móvil',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.telefonoMovil || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ContactoDto>({
        columnId: 'email',
        compare: (a, b) => (a.email || '').localeCompare(b.email || ''),
        renderHeaderCell: () => 'Correo Electrónico',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.email || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ContactoDto>({
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
      <D365CommandBar ariaLabel="Comandos de contactos">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/contactos/nuevo')}
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
          <Menu positioning="below-end">
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

      {/* 2. VIEW HEADER ROW */}
      <div className={styles.viewHeader}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <div className={styles.viewSelectorTab} role="button" tabIndex={0}>
              <Text weight="semibold" size={400}>
                {nombresVistaContactos[activeView]}
              </Text>
              <ChevronDown16Regular className={styles.iconChevronMargin} />
            </div>
          </MenuTrigger>
          <MenuPopover className={styles.viewMenuPopover}>
            <MenuList>
              {(Object.keys(nombresVistaContactos) as VistaContactos[]).map((v) => (
                <MenuItem
                  key={v}
                  icon={activeView === v ? <Checkmark16Regular /> : undefined}
                  onClick={() => setActiveView(v)}
                >
                  {nombresVistaContactos[v]}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        <D365TableToolbarTools
          tableRef={tableRef}
          searchValue={searchKeyword}
          onSearchChange={setSearchKeyword}
          searchPlaceholder="Buscar contactos..."
        />
      </div>

      {/* 3. GRID PRINCIPAL */}
      <D365EntityTable<ContactoDto>
        ref={tableRef}
        items={filteredContactos}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={cargar}
        selectionMode="multiselect"
        selectedItems={selectedIds}
        onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
        onRowDoubleClick={(item) => navigate(`/servicio-campo/contactos/${item.id}`)}
        filterFields={filterFields}
        entityName="contactos"
        tableId="contactos-grid"
      />

      {/* 4. FOOTER */}
      <div className={styles.footer}>
        <Text>
          {filteredContactos.length} {filteredContactos.length === 1 ? 'contacto' : 'contactos'}
        </Text>
      </div>
    </div>
  );
};

export default ContactosListPage;
