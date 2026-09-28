import React, { useState, useEffect, useMemo } from 'react';
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  TabList,
  Tab,
  Text,
  Badge,
  Spinner,
  Avatar,
  Divider,
  Label,
  Input,
  Card,
  Button,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Link,
  Tag,
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
  Person16Regular,
  Calendar16Regular,
  LockClosed16Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { TableEmptyState } from '../../../components/common/TableEmptyState';
import {
  dataManagementService,
  type DataImportJob,
  type DataImportJobError,
} from '../../../services/dataManagementService';
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
    minWidth: '700px',
  },
  // Candado al costado del control (estilo D365)
  lockInline: {
    color: '#797775',
    fontSize: '14px',
    flexShrink: 0,
    marginRight: '6px',
  },
  // Contenedor que agrupa el candado pegado al control
  controlWithLock: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  userTagLink: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForegroundLink,
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },
});

export const ImportJobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const styles = useD365FormStyles();
  const localStyles = useLocalStyles();

  const [job, setJob] = useState<DataImportJob | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      const data = await dataManagementService.getImportJobById(id);
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
      await dataManagementService.deleteImportJob(job.id);
      navigate('/configuracion/data-management/imports');
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el registro.');
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'completado':
        return (
          <Badge appearance="filled" color="success">
            Completado
          </Badge>
        );
      case 'conerrores':
        return (
          <Badge appearance="filled" color="warning">
            Con Errores
          </Badge>
        );
      case 'fallido':
        return (
          <Badge appearance="filled" color="danger">
            Fallido
          </Badge>
        );
      case 'procesando':
        return (
          <Badge appearance="filled" color="brand">
            En Proceso
          </Badge>
        );
      default:
        return <Badge appearance="tint">{estado}</Badge>;
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
  const errorColumns: TableColumnDefinition<DataImportJobError>[] = useMemo(
    () => [
      createTableColumn<DataImportJobError>({
        columnId: 'fila',
        compare: (a, b) => a.fila - b.fila,
        renderHeaderCell: () => 'Fila',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Badge appearance="tint" color="danger">
              Fila {item.fila}
            </Badge>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJobError>({
        columnId: 'identificador',
        compare: (a, b) =>
          (a.claveIdentificador || '').localeCompare(b.claveIdentificador || ''),
        renderHeaderCell: () => 'Identificador',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text weight="semibold">{item.claveIdentificador || '─'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJobError>({
        columnId: 'columna',
        compare: (a, b) => (a.columna || '').localeCompare(b.columna || ''),
        renderHeaderCell: () => 'Columna',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.columna || 'General'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJobError>({
        columnId: 'mensaje',
        compare: (a, b) => a.mensaje.localeCompare(b.mensaje),
        renderHeaderCell: () => 'Mensaje de Error / Rechazo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <span style={{ color: '#d13438' }}>{item.mensaje}</span>
          </TableCellLayout>
        ),
      }),
      createTableColumn<DataImportJobError>({
        columnId: 'valorOriginal',
        renderHeaderCell: () => 'Valor Original',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <code>{item.valorOriginal || '─'}</code>
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
              className={styles.primaryLink}
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
                : item.tipo === 2 || item.tipo === 'Servicio'
                  ? 'Servicio'
                  : 'No Inventariable'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ProductoDto>({
        columnId: 'unidadMedida',
        renderHeaderCell: () => 'Unidad de Medida',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text wrap={false}>{item.unidadMedida || 'UND'}</Text>
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
        <div style={{ padding: '24px' }}>
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Registro no encontrado</MessageBarTitle>
              {errorMessage || 'El registro de importación solicitado no existe o fue eliminado.'}
            </MessageBarBody>
          </MessageBar>
          <Button
            appearance="primary"
            style={{ marginTop: '16px' }}
            icon={<ArrowLeft16Regular />}
            onClick={() => navigate('/configuracion/data-management/imports')}
          >
            Volver a Importaciones
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* 1. DYNAMICS 365 TOP COMMAND BAR */}
      <Toolbar size="medium" aria-label="Comandos de importación" className={styles.commandBar}>
        <div className={styles.toolbarLeft}>
          <ToolbarButton
            icon={<ArrowLeft16Regular className={styles.iconPrimary} />}
            onClick={() => navigate('/configuracion/data-management/imports')}
            title="Volver al listado"
            aria-label="Volver"
          />
          <ToolbarDivider />

          <ToolbarButton
            icon={<ArrowClockwise16Regular />}
            onClick={fetchJob}
          >
            Actualizar
          </ToolbarButton>

          <ToolbarButton
            icon={<Delete16Regular className={styles.iconDanger} />}
            onClick={handleDelete}
          >
            Eliminar
          </ToolbarButton>
        </div>
      </Toolbar>

      {/* 2. DYNAMICS 365 ENTITY HEADER */}
      <div className={styles.headerContainer}>
        <div className={styles.headerTopRow}>
          <div className={styles.headerLeft}>
            <Avatar
              name={job.nombreArchivo}
              initials="IM"
              size={56}
              className={styles.avatar}
            />
            <div className={styles.titleSection}>
              <Text className={styles.title}>{job.nombreArchivo}</Text>
              <Text className={styles.subtitle}>
                Import Source File · Entidad: {job.tipoRegistro}
              </Text>
            </div>
          </div>

          <div className={styles.headerMetaRight}>
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>Estado</Text>
              <div style={{ marginTop: '2px' }}>{getStatusBadge(job.estado)}</div>
            </div>
            <Divider vertical className={styles.metaDivider} />
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>Tipo de Registro</Text>
              <Text className={styles.metaValue}>{job.tipoRegistro}</Text>
            </div>
            <Divider vertical className={styles.metaDivider} />
            <div className={styles.metaItem}>
              <Text className={styles.metaLabel}>Iniciado Por</Text>
              <div style={{ marginTop: '2px' }}>
                <Tag
                  appearance="brand"
                  shape="rounded"
                  size="small"
                  media={<Person16Regular />}
                  value={job.creadoPor}
                >
                  <Link as="span" className={localStyles.userTagLink}>
                    {job.creadoPor}
                  </Link>
                </Tag>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TABS DE DYNAMICS 365 */}
        <TabList
          className={styles.tabList}
          selectedValue={activeTab}
          onTabSelect={(_, data) => setActiveTab(data.value as string)}
        >
          <Tab value="general" icon={<DocumentText16Regular />}>
            General
          </Tab>
          <Tab value="failures" icon={<ErrorCircle16Regular />}>
            Errores
          </Tab>
          <Tab value="success" icon={<CheckmarkCircle16Regular />}>
            Completados
          </Tab>
        </TabList>
      </div>

      {/* 4. CONTENIDO DE LAS PESTAÑAS (ESTRUCTURA IDÉNTICA A DYNAMICS 365) */}
      <div className={styles.contentBody}>
        {/* PESTAÑA GENERAL */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%' }}>

            {/* SECCIÓN 1: IDENTIFICACIÓN PRINCIPAL */}
            <Card className={styles.card}>
              <div className={styles.grid2Cols}>
                {/* Columna Izquierda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Nombre */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Nombre</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={job.nombreArchivo}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Creado Por */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Creado Por</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Tag
                          appearance="brand"
                          shape="rounded"
                          size="medium"
                          media={<Person16Regular />}
                          value={job.creadoPor}
                        >
                          <Link as="span" className={localStyles.userTagLink}>
                            {job.creadoPor}
                          </Link>
                        </Tag>
                      </div>
                    </div>
                  </div>

                  {/* Fecha de Creación */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Fecha de Creación</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          contentAfter={<Calendar16Regular style={{ color: '#797775' }} />}
                          value={new Date(job.fechaCreacion).toLocaleString('es-PE')}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Estado */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Estado</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={job.estado}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Espacio reservado para alineación exacta de D365 */}
                  <div className={styles.d365FieldRow} style={{ visibility: 'hidden' }}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Espacio</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <Input size="medium" />
                    </div>
                  </div>

                  {/* Fecha de Finalización */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Finalizado El</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          contentAfter={<Calendar16Regular style={{ color: '#797775' }} />}
                          value={
                            job.fechaFinalizacion
                              ? new Date(job.fechaFinalizacion).toLocaleString('es-PE')
                              : '—'
                          }
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* SECCIÓN 2: PROPIEDADES (PROPERTIES) */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Propiedades</Text>
              <div className={styles.grid2Cols}>
                {/* Columna Izquierda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Archivo */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Archivo</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={job.nombreArchivo}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tipo de Registro */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Tipo de Registro</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={job.tipoRegistro}
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Propietario de Registros */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Propietario de Registros</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Tag
                          appearance="brand"
                          shape="rounded"
                          size="medium"
                          media={<Person16Regular />}
                          value={job.creadoPor}
                        >
                          <Link as="span" className={localStyles.userTagLink}>
                            {job.creadoPor}
                          </Link>
                        </Tag>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      <Label size="medium">Mapa</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value="---"
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detección de Duplicados */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Detección de Duplicados</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={localStyles.controlWithLock}>
                        <LockClosed16Regular className={localStyles.lockInline} title="Campo de sólo lectura" />
                        <Input
                          readOnly
                          size="medium"
                          value={
                            job.modoDuplicados === 'Upsert'
                              ? 'Sí (Actualizar existentes)'
                              : job.modoDuplicados === 'Skip'
                                ? 'Sí (Omitir existentes)'
                                : 'Sí (Rechazar duplicados)'
                          }
                          className={styles.d365ControlFull}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* SECCIÓN 3: RESULTADOS (RESULTS) */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Resultados</Text>
              <div className={styles.grid2Cols}>
                {/* Columna Izquierda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Registros Correctos */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label size="medium">Correctos</Label>
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
                      <Label size="medium">Errores Parciales</Label>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    size="small"
                    icon={<ArrowClockwise16Regular />}
                    onClick={fetchJob}
                  >
                    Actualizar
                  </Button>
                </div>

                <div style={{ width: '260px' }}>
                  <Input
                    size="small"
                    placeholder="Filtrar por palabra clave"
                    contentBefore={<Search16Regular />}
                    value={errorSearch}
                    onChange={(_, d) => setErrorSearch(d.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* DataGrid mostrando siempre la cabecera, y TableEmptyState dentro cuando no hay filas */}
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <DataGrid
                  items={filteredErrores}
                  columns={errorColumns}
                  getRowId={(item) => item.id}
                  className={localStyles.subgridTable}
                >
                  <DataGridHeader>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  {filteredErrores.length === 0 ? (
                    <TableEmptyState />
                  ) : (
                    <DataGridBody<DataImportJobError>>
                      {({ item, rowId }) => (
                        <DataGridRow<DataImportJobError>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    size="small"
                    icon={<ArrowClockwise16Regular />}
                    onClick={fetchImportedProducts}
                  >
                    Actualizar
                  </Button>
                </div>

                <div style={{ width: '260px' }}>
                  <Input
                    size="small"
                    placeholder="Filtrar por palabra clave"
                    contentBefore={<Search16Regular />}
                    value={productSearch}
                    onChange={(_, d) => setProductSearch(d.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {loadingProducts ? (
                <div style={{ padding: '32px', textAlign: 'center' }}>
                  <Spinner size="medium" label="Cargando registros importados..." />
                </div>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <DataGrid
                    items={filteredProducts}
                    columns={productColumns}
                    getRowId={(item) => item.id}
                    className={localStyles.subgridTable}
                  >
                    <DataGridHeader>
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
