import React, { useState, useEffect, useMemo } from 'react';
import {
  TabList,
  Tab,
  Text,
  Spinner,
  Label,
  Input,
  Card,
  Button,
  Link,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  createTableColumn,
  makeStyles,
  tokens,
  type TableColumnDefinition,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  ArrowClockwise16Regular,
  Delete16Regular,
  DocumentText16Regular,
  ErrorCircle16Regular,
  CheckmarkCircle16Regular,
  Calendar16Regular,
  LockClosed16Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { TableEmptyState } from '../../../components/common/TableEmptyState';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';
import { semanticTokens } from '../../../styles/semanticTokens';
import {
  ImportacionService,
  type TrabajoImportacionDto,
  type ErrorImportacionDto,
} from '../../../services/importacion.service';
import { ProductoService } from '../../inventario/productos/services/producto.service';
import type { ProductoDto } from '../../inventario/productos/types/producto.types';

const useLocalStyles = makeStyles({
  subgridHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '12px',
    marginBottom: '8px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  subgridTable: {
    width: '100%',
    minWidth: '1050px',
  },
  // Candado al costado del control (estilo D365)
  lockInline: {
    color: semanticTokens.text.muted,
    fontSize: tokens.fontSizeBase200,
    flexShrink: 0,
    marginRight: '6px',
  },
  // Contenedor que agrupa el candado pegado al control
  controlWithLock: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  notFoundContent: { padding: tokens.spacingVerticalXXL },
  spacedTop: { marginTop: tokens.spacingVerticalM },
  metaValueContent: { marginTop: tokens.spacingVerticalXXS },
  fieldColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  pageColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
    minWidth: 0,
    width: '100%',
  },
  dateIcon: { color: semanticTokens.text.muted },
  subgridActions: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  subgridSearch: { width: '260px' },
  searchInput: { width: '100%' },
  tableOverflow: {
    width: '100%',
    minHeight: '240px',
    maxHeight: 'calc(100vh - 360px)',
    overflowX: 'auto',
    overflowY: 'auto',
  },
  stickyGridHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  loadingProducts: { padding: tokens.spacingVerticalXXL, textAlign: 'center' },
});

export const ImportacionDetallePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const styles = useD365FormStyles();
  const localStyles = useLocalStyles();

  const [job, setJob] = useState<TrabajoImportacionDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') === 'errores' ? 'failures' : 'general');
  }, [id, searchParams]);

  // Filtros de búsqueda para las sub-tablas
  const [errorSearch, setErrorSearch] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');

  // Datos para la pestaña Completados
  const [importedProducts, setImportedProducts] = useState<ProductoDto[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  const fetchJob = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await ImportacionService.getImportJobById(id);
      setJob(data);

      if (data.tipoRegistro.toLowerCase().includes('prod')) {
        fetchImportedProducts();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al cargar los detalles de la importación.');
    } finally {
      setLoading(false);
    }
  };

  const fetchImportedProducts = async () => {
    try {
      setLoadingProducts(true);
      const list = await ProductoService.getProductos();
      setImportedProducts(list);
    } catch (e) {
      console.error('Error fetching imported products', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleDelete = async () => {
    if (!job) return;
    if (
      !window.confirm(
        `¿Está seguro de eliminar el registro de importación '${job.nombreArchivo}'?`
      )
    ) {
      return;
    }

    try {
      await ImportacionService.deleteImportJob(job.id);
      navigate('/gestion-datos/importaciones');
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el registro.');
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado':
        return 'Completado';
      case 'conerrores':
        return 'Con errores';
      case 'fallido':
        return 'Fallido';
      case 'procesando':
        return 'En proceso';
      default:
        return estado;
    }
  };

  // Filtrado de Errores
  const filteredErrores = useMemo(() => {
    if (!job || !job.errores) return [];
    if (!errorSearch.trim()) return job.errores;
    const q = errorSearch.toLowerCase();
    return job.errores.filter(
      (e) =>
        e.mensaje.toLowerCase().includes(q) ||
        (e.columna && e.columna.toLowerCase().includes(q)) ||
        (e.claveIdentificador && e.claveIdentificador.toLowerCase().includes(q)) ||
        (e.valorOriginal && e.valorOriginal.toLowerCase().includes(q)) ||
        String(e.fila).includes(q)
    );
  }, [job, errorSearch]);

  // Columnas DataGrid para la pestaña ERRORES
  const errorColumns: TableColumnDefinition<ErrorImportacionDto>[] = useMemo(
    () => [
      createTableColumn<ErrorImportacionDto>({
        columnId: 'fila',
        compare: (a, b) => a.fila - b.fila,
        renderHeaderCell: () => 'Fila',
        renderCell: (item) => (
          <TableCellLayout truncate><Text>{item.fila}</Text></TableCellLayout>
        ),
      }),
      createTableColumn<ErrorImportacionDto>({
        columnId: 'identificador',
        compare: (a, b) =>
          (a.claveIdentificador || '').localeCompare(b.claveIdentificador || ''),
        renderHeaderCell: () => 'Identificador',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.claveIdentificador || '─'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ErrorImportacionDto>({
        columnId: 'columna',
        compare: (a, b) => (a.columna || '').localeCompare(b.columna || ''),
        renderHeaderCell: () => 'Columna',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.columna || 'General'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ErrorImportacionDto>({
        columnId: 'mensaje',
        compare: (a, b) => a.mensaje.localeCompare(b.mensaje),
        renderHeaderCell: () => 'Mensaje de Error / Rechazo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.mensaje}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ErrorImportacionDto>({
        columnId: 'valorOriginal',
        renderHeaderCell: () => 'Valor Original',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.valorOriginal || '─'}</Text>
          </TableCellLayout>
        ),
      }),
    ],
    []
  );

  // Filtrado de Productos Completados
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return importedProducts;
    const q = productSearch.toLowerCase();
    return importedProducts.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        (p.categoria && p.categoria.toLowerCase().includes(q))
    );
  }, [importedProducts, productSearch]);

  // Definición de columnas de productos completados (DataGrid Fluent UI)
  const productColumns: TableColumnDefinition<ProductoDto>[] = useMemo(
    () => [
      createTableColumn<ProductoDto>({
        columnId: 'nombre',
        compare: (a, b) => a.nombre.localeCompare(b.nombre),
        renderHeaderCell: () => 'Nombre',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Link
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/servicio-campo/productos/${item.id}`);
              }}
              title={item.nombre}
            >
              {item.nombre}
            </Link>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'codigo',
        compare: (a, b) => a.codigo.localeCompare(b.codigo),
        renderHeaderCell: () => 'Código',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false}>{item.codigo}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'categoria',
        compare: (a, b) => (a.categoria || '').localeCompare(b.categoria || ''),
        renderHeaderCell: () => 'Categoría',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false}>{item.categoria || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'tipo',
        renderHeaderCell: () => 'Tipo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false}>
              {item.tipo === 1 || item.tipo === 'Inventario'
                ? 'Inventario'
                : item.tipo === 2 || item.tipo === 'NoInventario'
                  ? 'No inventario'
                  : 'Servicio'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'unidadMedida',
        renderHeaderCell: () => 'Unidad de Medida',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false}>{item.nombreUnidadMedidaDefecto || '—'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'precioBase',
        compare: (a, b) => (a.precioBase || 0) - (b.precioBase || 0),
        renderHeaderCell: () => 'Precio Base',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false}>
              {new Intl.NumberFormat('es-PE', {
                style: 'currency',
                currency: 'PEN',
              }).format(item.precioBase || 0)}
            </Text>
          </TableCellLayout>
        ),
      }),
    ],
    [navigate, styles]
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" label="Cargando detalles de la importación..." />
      </div>
    );
  }

  if (!job) {
    return (
      <div className={styles.root}>
        <div className={localStyles.notFoundContent}>
          <D365MessageBar intent="error" title="Importación no encontrada">
            {errorMessage || 'La importación solicitada no existe o fue eliminada.'}
          </D365MessageBar>
          <Button
            appearance="primary"
            className={localStyles.spacedTop}
            icon={<ArrowLeft16Regular />}
            onClick={() => navigate('/gestion-datos/importaciones')}
          >
            Volver a importaciones
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* 1. DYNAMICS 365 TOP COMMAND BAR */}
      <D365CommandBar ariaLabel="Comandos de importación">
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={() => navigate('/gestion-datos/importaciones')}
            title="Volver al historial"
            aria-label="Volver"
          />
          <D365CommandDivider />

          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            onClick={fetchJob}
          >
            Actualizar
          </D365CommandButton>

          <D365CommandButton
            icon={<Delete16Regular />}
            tone="danger"
            onClick={handleDelete}
          >
            Eliminar
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. DYNAMICS 365 ENTITY HEADER */}
      <D365EntityHeader
        className={styles.headerContainer}
        title={job.nombreArchivo}
        subtitle={`Archivo de importación · Entidad: ${job.tipoRegistro}`}
        avatarInitials="IM"
        metadata={[
          { label: 'Estado', value: getStatusText(job.estado) },
          { label: 'Entidad', value: job.tipoRegistro },
          { label: 'Iniciado por', value: job.creadoPor },
        ]}
        tabs={(
          <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as string)}>
            <Tab value="general" icon={<DocumentText16Regular />}>General</Tab>
            <Tab value="failures" icon={<ErrorCircle16Regular />}>Errores</Tab>
            <Tab value="success" icon={<CheckmarkCircle16Regular />}>Completados</Tab>
          </TabList>
        )}
      />

      {/* 4. CONTENIDO DE LAS PESTAÑAS (ESTRUCTURA IDÉNTICA A DYNAMICS 365) */}
      <div className={styles.contentBody}>
        {/* PESTAÑA GENERAL */}
        {activeTab === 'general' && (
          <div className={localStyles.pageColumn}>

            {/* SECCIÓN 1: DETALLES DE IMPORTACIÓN */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Detalles de importación</Text>
              <div className={styles.grid2Cols}>
                {/* Columna Izquierda */}
                <div className={localStyles.fieldColumn}>
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}><Label size="medium">Fecha de creación</Label></div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de solo lectura" />
                        <Input readOnly size="medium" contentAfter={<Calendar16Regular className={localStyles.dateIcon} />} value={new Date(job.fechaCreacion).toLocaleString('es-PE')} className={styles.d365ControlFull} />
                      </div>
                    </div>
                  </div>
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}><Label size="medium">Fecha de finalización</Label></div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de solo lectura" />
                        <Input readOnly size="medium" contentAfter={<Calendar16Regular className={localStyles.dateIcon} />} value={job.fechaFinalizacion ? new Date(job.fechaFinalizacion).toLocaleString('es-PE') : '—'} className={styles.d365ControlFull} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className={localStyles.fieldColumn}>
                  {/* Tamaño */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Tamaño</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={`${job.tamanoBytes.toLocaleString('es-PE')} bytes`}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mapeo */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Campos mapeados</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={`${Object.keys(job.mapeoCampos ?? {}).length} campos mapeados`}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tratamiento de duplicados */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Tratamiento de duplicados</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={
                            job.modoDuplicados === 'Upsert'
                              ? 'Actualizar los registros existentes'
                              : job.modoDuplicados === 'Skip'
                                ? 'Omitir los registros existentes'
                                : 'Rechazar los duplicados'
                          }
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* SECCIÓN 2: RESULTADOS */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Resultados</Text>
              <div className={styles.grid2Cols}>
                {/* Columna Izquierda */}
                <div className={localStyles.fieldColumn}>
                  {/* Registros Importados correctamente */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Importados correctamente</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={String(job.totalExitosos)}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parciales / Omitidos */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Errores parciales</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={String(job.totalParciales)}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className={localStyles.fieldColumn}>
                  {/* Errores / Fallos */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Fallos</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={String(job.totalFallidos)}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Procesado */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Total</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={String(job.totalProcesados)}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        )}

        {/* PESTAÑA ERRORES: DataGrid que conserva siempre las cabeceras de columnas */}
        {activeTab === 'failures' && (
          <Card className={styles.card}>
            <div>
              {/* Subgrid Toolbar */}
              <div className={localStyles.subgridHeader}>
                <div className={localStyles.subgridActions}>
                  <Button
                    icon={<ArrowClockwise16Regular />}
                    onClick={fetchJob}
                  >
                    Actualizar
                  </Button>
                </div>

                <div className={localStyles.subgridSearch}>
                  <Input
                    placeholder="Buscar" aria-label="Buscar"
                    contentBefore={<Search16Regular />}
                    value={errorSearch}
                    onChange={(_, d) => setErrorSearch(d.value)}
                    className={localStyles.searchInput}
                  />
                </div>
              </div>

              {/* DataGrid mostrando siempre la cabecera, y TableEmptyState dentro cuando no hay filas */}
              <div className={localStyles.tableOverflow}>
                <DataGrid
                  items={filteredErrores}
                  columns={errorColumns}
                  getRowId={(item) => item.id}
                  className={localStyles.subgridTable}
                >
                  <DataGridHeader className={localStyles.stickyGridHeader}>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  {filteredErrores.length === 0 ? (
                    <TableEmptyState />
                  ) : (
                    <DataGridBody<ErrorImportacionDto>>
                      {({ item, rowId }) => (
                        <DataGridRow<ErrorImportacionDto>
                          key={rowId}
                          className={styles.dataRow}
                        >
                          {({ renderCell }) => (
                            <DataGridCell className={styles.dataCell}>
                              {renderCell(item)}
                            </DataGridCell>
                          )}
                        </DataGridRow>
                      )}
                    </DataGridBody>
                  )}
                </DataGrid>
              </div>
            </div>
          </Card>
        )}

        {/* PESTAÑA COMPLETADOS: DataGrid que conserva siempre las cabeceras de columnas */}
        {activeTab === 'success' && (
          <Card className={styles.card}>
            <div>
              {/* Subgrid Toolbar */}
              <div className={localStyles.subgridHeader}>
                <div className={localStyles.subgridActions}>
                  <Button
                    icon={<ArrowClockwise16Regular />}
                    onClick={fetchImportedProducts}
                  >
                    Actualizar
                  </Button>
                </div>

                <div className={localStyles.subgridSearch}>
                  <Input
                    placeholder="Buscar" aria-label="Buscar"
                    contentBefore={<Search16Regular />}
                    value={productSearch}
                    onChange={(_, d) => setProductSearch(d.value)}
                    className={localStyles.searchInput}
                  />
                </div>
              </div>

              {loadingProducts ? (
                <div className={localStyles.loadingProducts}>
                  <Spinner size="medium" label="Cargando registros importados..." />
                </div>
              ) : (
                <div className={localStyles.tableOverflow}>
                  <DataGrid
                    items={filteredProducts}
                    columns={productColumns}
                    getRowId={(item) => item.id}
                    className={localStyles.subgridTable}
                  >
                    <DataGridHeader className={localStyles.stickyGridHeader}>
                      <DataGridRow>
                        {({ renderHeaderCell }) => (
                          <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                        )}
                      </DataGridRow>
                    </DataGridHeader>
                    {filteredProducts.length === 0 ? (
                      <TableEmptyState />
                    ) : (
                      <DataGridBody<ProductoDto>>
                        {({ item, rowId }) => (
                          <DataGridRow<ProductoDto>
                            key={rowId}
                            className={styles.dataRow}
                            onClick={() => navigate(`/servicio-campo/productos/${item.id}`)}
                          >
                            {({ renderCell }) => (
                              <DataGridCell className={styles.dataCell}>
                                {renderCell(item)}
                              </DataGridCell>
                            )}
                          </DataGridRow>
                        )}
                      </DataGridBody>
                    )}
                  </DataGrid>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
