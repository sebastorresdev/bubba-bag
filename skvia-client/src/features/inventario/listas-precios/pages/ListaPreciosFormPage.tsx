import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Select,
  Textarea,
  TabList,
  Tab,
  Card,
  Text,
  Label,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  createTableColumn,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Tooltip,
  Skeleton,
  SkeletonItem,
  Link,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  DismissRegular,
  Money24Regular,
  Checkmark16Regular,
  Delete16Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { ListaPreciosService } from '../services/listaPrecios.service';
import type {
  ElementoListaPreciosDto,
  CreateListaPreciosDto,
  UpdateListaPreciosDto,
} from '../types/listaPrecios.types';
import { ProductoService } from '../../productos/services/producto.service';
import type { ProductoDto } from '../../productos/types/producto.types';
import { UnidadMedidaService } from '../../unidades-medida/services/unidadMedida.service';
import type { UnidadMedidaDto } from '../../unidades-medida/types/unidadMedida.types';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';

const useLocalStyles = makeStyles({
  subgridHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  subgridTable: {
    width: '100%',
    marginTop: '12px',
  },
  subgridTools: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dialogForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '12px 0',
  },
  dialogRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
});

const parseISODate = (val?: string): Date | undefined => {
  if (!val) return undefined;
  const parts = val.split('-');
  if (parts.length !== 3) return undefined;
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};

const formatISODate = (d?: Date | null): string => {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const ListaPreciosFormPage: React.FC = () => {
  const styles = useD365FormStyles();
  const localStyles = useLocalStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isNew = !id || id === 'nuevo';

  // State
  const [selectedTab, setSelectedTab] = useState<'general' | 'elementos'>('general');
  const [loading, setLoading] = useState<boolean>(!isNew);
  const [saving, setSaving] = useState<boolean>(false);
  const [banner, setBanner] = useState<{
    text: string;
    intent: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState<{
    nombre: string;
    moneda: string;
    descripcion: string;
    fechaInicio: string;
    fechaFin: string;
    activo: boolean;
  }>({
    nombre: '',
    moneda: 'PEN',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    activo: true,
  });

  // Price List Elements (Items)
  const [elementos, setElementos] = useState<ElementoListaPreciosDto[]>([]);
  const [elementosSearch, setElementosSearch] = useState<string>('');

  // Add Item Dialog State
  const [itemDialogOpen, setItemDialogOpen] = useState<boolean>(false);
  const [itemSubmitting, setItemSubmitting] = useState<boolean>(false);
  const [availableProducts, setAvailableProducts] = useState<ProductoDto[]>([]);
  const [availableUnidades, setAvailableUnidades] = useState<UnidadMedidaDto[]>([]);

  // Dialog Form State
  const [newProductoId, setNewProductoId] = useState<string>('');
  const [newUnidadMedidaId, setNewUnidadMedidaId] = useState<string>('');
  const [newMonto, setNewMonto] = useState<string>('');
  const [newMetodoFijacion, setNewMetodoFijacion] = useState<number>(1);

  // Load Price List
  const loadData = useCallback(async () => {
    if (isNew) return;
    try {
      setLoading(true);
      const data = await ListaPreciosService.getListaPreciosById(id!);
      setFormData({
        nombre: data.nombre || '',
        moneda: data.moneda || 'PEN',
        descripcion: data.descripcion || '',
        fechaInicio: data.fechaInicio ? data.fechaInicio.split('T')[0] : '',
        fechaFin: data.fechaFin ? data.fechaFin.split('T')[0] : '',
        activo: data.activo,
      });
      setElementos(data.elementos || []);
    } catch (err: any) {
      console.error('Error loading lista de precios:', err);
      setBanner({
        text: err?.message || 'Error al cargar los datos de la lista de precios',
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load catalogs for dialog (Products and Units)
  const loadCatalogsForDialog = async () => {
    try {
      const [prods, units] = await Promise.all([
        ProductoService.getProductos(undefined, undefined, true),
        UnidadMedidaService.getUnidadesMedida(undefined, true),
      ]);
      setAvailableProducts(prods);
      setAvailableUnidades(units);
    } catch (err) {
      console.error('Error loading catalogs for item dialog:', err);
    }
  };

  const handleOpenItemDialog = () => {
    setNewProductoId('');
    setNewUnidadMedidaId('');
    setNewMonto('0');
    setNewMetodoFijacion(1);
    setItemDialogOpen(true);
    loadCatalogsForDialog();
  };

  // Handle Save
  const handleSave = async (closeAfter: boolean = false) => {
    if (!formData.nombre.trim()) {
      setBanner({ text: 'El campo "Nombre de la lista" es obligatorio.', intent: 'error' });
      return;
    }
    try {
      setSaving(true);
      setBanner(null);

      if (isNew) {
        const createDto: CreateListaPreciosDto = {
          nombre: formData.nombre.trim(),
          moneda: formData.moneda,
          descripcion: formData.descripcion.trim() || null,
          fechaInicio: formData.fechaInicio ? new Date(formData.fechaInicio).toISOString() : null,
          fechaFin: formData.fechaFin ? new Date(formData.fechaFin).toISOString() : null,
        };

        const res = await ListaPreciosService.createListaPrecios(createDto);

        // Guardar elementos que hayan sido agregados en memoria antes de guardar la lista
        if (elementos.length > 0) {
          for (const elem of elementos) {
            try {
              await ListaPreciosService.guardarElemento(res.id, {
                productoId: elem.productoId,
                monto: elem.monto,
                unidadMedidaId: elem.unidadMedidaId || null,
                metodoFijacion: elem.metodoFijacion,
              });
            } catch (elemErr) {
              console.error('Error guardando elemento en lista de precios:', elemErr);
            }
          }
        }

        setBanner({ text: 'Lista de precios creada exitosamente.', intent: 'success' });

        if (closeAfter) {
          navigate('/servicio-campo/listas-precios');
        } else {
          navigate(`/servicio-campo/listas-precios/${res.id}`, { replace: true });
        }
      } else {
        const updateDto: UpdateListaPreciosDto = {
          nombre: formData.nombre.trim(),
          moneda: formData.moneda,
          descripcion: formData.descripcion.trim() || null,
          fechaInicio: formData.fechaInicio ? new Date(formData.fechaInicio).toISOString() : null,
          fechaFin: formData.fechaFin ? new Date(formData.fechaFin).toISOString() : null,
        };

        await ListaPreciosService.updateListaPrecios(id!, updateDto);
        setBanner({ text: 'Lista de precios actualizada correctamente.', intent: 'success' });

        if (closeAfter) {
          navigate('/servicio-campo/listas-precios');
        } else {
          loadData();
        }
      }
    } catch (err: any) {
      console.error('Error saving lista de precios:', err);
      setBanner({
        text: err?.message || 'Error al guardar la lista de precios.',
        intent: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active State
  const handleToggleEstado = async () => {
    if (isNew || !id) return;
    try {
      const nuevoEstado = !formData.activo;
      await ListaPreciosService.cambiarEstado(id, nuevoEstado);
      setFormData((prev) => ({ ...prev, activo: nuevoEstado }));
      setBanner({
        text: `Lista de precios ${nuevoEstado ? 'activada' : 'desactivada'} correctamente.`,
        intent: 'success',
      });
      setTimeout(() => setBanner(null), 3500);
    } catch (err: any) {
      setBanner({
        text: err?.message || 'Error al cambiar estado de la lista de precios.',
        intent: 'error',
      });
    }
  };

  // Add Item to Price List
  const handleGuardarElemento = async () => {
    if (!newProductoId) {
      setBanner({ text: 'Debe seleccionar un producto.', intent: 'warning' });
      return;
    }
    const montoNum = parseFloat(newMonto);
    if (isNaN(montoNum) || montoNum < 0) {
      setBanner({ text: 'Debe ingresar un monto o porcentaje numérico válido mayor o igual a 0.', intent: 'warning' });
      return;
    }

    const prod = availableProducts.find((p) => p.id === newProductoId);
    const um = availableUnidades.find((u) => u.id === newUnidadMedidaId);

    if (isNew) {
      const tempItem: ElementoListaPreciosDto = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        listaPreciosId: '',
        productoId: newProductoId,
        productoCodigo: prod?.codigo || 'PROD',
        productoNombre: prod?.nombre || 'Producto',
        unidadMedidaId: newUnidadMedidaId || null,
        unidadMedidaNombre: um ? `${um.nombre} (${um.abreviatura})` : null,
        monto: montoNum,
        metodoFijacion: newMetodoFijacion,
      };

      setElementos((prev) => {
        const existingIdx = prev.findIndex(
          (e) => e.productoId === newProductoId && (e.unidadMedidaId || null) === (newUnidadMedidaId || null)
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], monto: montoNum, metodoFijacion: newMetodoFijacion };
          return updated;
        }
        return [...prev, tempItem];
      });

      setItemDialogOpen(false);
      setBanner({ text: 'Precio del producto asignado. Se guardará al pulsar Guardar.', intent: 'success' });
      setTimeout(() => setBanner(null), 3000);
      return;
    }

    try {
      setItemSubmitting(true);
      await ListaPreciosService.guardarElemento(id!, {
        productoId: newProductoId,
        monto: montoNum,
        unidadMedidaId: newUnidadMedidaId || null,
        metodoFijacion: newMetodoFijacion,
      });

      setItemDialogOpen(false);
      setBanner({ text: 'Producto asignado a la lista de precios exitosamente.', intent: 'success' });
      setTimeout(() => setBanner(null), 4000);
      loadData();
    } catch (err: any) {
      console.error('Error saving item:', err);
      setBanner({
        text: err?.message || 'Error al guardar el elemento en la lista de precios.',
        intent: 'error',
      });
    } finally {
      setItemSubmitting(false);
    }
  };

  // Remove Item
  const handleEliminarElemento = async (elementoId: string, productoNombre: string) => {
    if (!confirm(`¿Está seguro de remover "${productoNombre}" de esta lista de precios?`)) {
      return;
    }

    if (elementoId.startsWith('temp-')) {
      setElementos((prev) => prev.filter((e) => e.id !== elementoId));
      setBanner({ text: `Producto "${productoNombre}" removido.`, intent: 'info' });
      setTimeout(() => setBanner(null), 3000);
      return;
    }

    try {
      await ListaPreciosService.eliminarElemento(elementoId);
      setBanner({ text: `Producto "${productoNombre}" eliminado de la lista de precios.`, intent: 'info' });
      setTimeout(() => setBanner(null), 3500);
      loadData();
    } catch (err: any) {
      setBanner({
        text: err?.message || 'Error al eliminar el producto de la lista.',
        intent: 'error',
      });
    }
  };

  // Filter elements
  const filteredElementos = useMemo(() => {
    if (!elementosSearch.trim()) return elementos;
    const q = elementosSearch.toLowerCase();
    return elementos.filter(
      (e) =>
        e.productoNombre.toLowerCase().includes(q) ||
        e.productoCodigo.toLowerCase().includes(q) ||
        (e.unidadMedidaNombre && e.unidadMedidaNombre.toLowerCase().includes(q))
    );
  }, [elementos, elementosSearch]);

  const currencySymbol = formData.moneda === 'USD' ? '$' : 'S/';

  const getMetodoFijacionLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Importe en divisa fija';
      case 2:
        return '% sobre el costo';
      case 3:
        return '% de margen comercial';
      default:
        return 'Importe fijo';
    }
  };

  // Subgrid Columns
  const elementoColumns = useMemo(
    () => [
      createTableColumn<ElementoListaPreciosDto>({
        columnId: 'producto',
        compare: (a, b) => a.productoNombre.localeCompare(b.productoNombre),
        renderHeaderCell: () => 'Producto',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <div className={styles.dialogRow}>
              <Link
                as="button"
                onClick={() => navigate(`/servicio-campo/productos/${item.productoId}`)}
                title="Ver ficha de producto"
              >
                {item.productoNombre}
              </Link>
            </div>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ElementoListaPreciosDto>({
        columnId: 'unidadMedida',
        renderHeaderCell: () => 'Unidad de Medida',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.unidadMedidaNombre || 'Unidad predeterminada'}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ElementoListaPreciosDto>({
        columnId: 'metodoFijacion',
        renderHeaderCell: () => 'Método de Fijación',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>
              {getMetodoFijacionLabel(item.metodoFijacion)}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<ElementoListaPreciosDto>({
        columnId: 'monto',
        compare: (a, b) => a.monto - b.monto,
        renderHeaderCell: () => 'Monto / Tarifa',
        renderCell: (item) => {
          const isPorcentaje = item.metodoFijacion === 2 || item.metodoFijacion === 3;
          return (
            <TableCellLayout truncate>
              <Text>
                {isPorcentaje ? `${item.monto.toFixed(2)} %` : `${currencySymbol} ${item.monto.toFixed(2)}`}
              </Text>
            </TableCellLayout>
          );
        },
      }),
      createTableColumn<ElementoListaPreciosDto>({
        columnId: 'acciones',
        renderHeaderCell: () => 'Acciones',
        renderCell: (item) => (
          <TableCellLayout>
            <Tooltip content="Remover de esta lista" relationship="label">
              <Button
                size="small"
                appearance="subtle"
                icon={<Delete16Regular className={styles.iconDanger} />}
                onClick={() => handleEliminarElemento(item.id, item.productoNombre)}
              />
            </Tooltip>
          </TableCellLayout>
        ),
      }),
    ],
    [navigate, currencySymbol, styles]
  );

  return (
    <div className={styles.root}>
      {/* 0. Notification Banner */}
      {banner && (
        <D365MessageBar
          intent={banner.intent}
          className={styles.messageBarContainer}
          onDismiss={() => setBanner(null)}
        >
          {banner.text}
        </D365MessageBar>
      )}

      {/* 1. Dynamics 365 Standard Top Command Bar */}
      <D365CommandBar
        ariaLabel="Comandos de lista de precios"

        busy={saving || loading}
        busyLabel={loading ? 'Cargando...' : 'Guardando...'}
      >
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={() => navigate('/servicio-campo/listas-precios')}
            title="Volver al listado"
            aria-label="Volver"
          />

          <D365CommandDivider />

          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            disabled={saving || loading}
            onClick={() => handleSave(false)}
            appearance="subtle"
          >
            Guardar
          </D365CommandButton>

          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            disabled={saving || loading}
            onClick={() => handleSave(true)}
            appearance="subtle"
          >
            Guardar y cerrar
          </D365CommandButton>

          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={() => navigate('/servicio-campo/listas-precios/nuevo')}
            disabled={saving || loading}
            appearance="subtle"
          >
            Nuevo
          </D365CommandButton>

          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            disabled={saving || loading}
            onClick={isNew ? () => {
              setFormData({
                nombre: '',
                moneda: 'PEN',
                descripcion: '',
                fechaInicio: '',
                fechaFin: '',
                activo: true,
              });
            } : loadData}
            appearance="subtle"
          >
            Deshacer
          </D365CommandButton>

          {!isNew && (
            <>
              <D365CommandDivider />
              <D365CommandButton
                icon={
                  formData.activo ? (
                    <DismissRegular className={styles.iconDanger} />
                  ) : (
                    <Checkmark16Regular className={styles.iconNewGreen} />
                  )
                }
                tone={formData.activo ? 'danger' : 'create'}
                onClick={handleToggleEstado}
                appearance="subtle"
              >
                {formData.activo ? 'Desactivar' : 'Activar'}
              </D365CommandButton>
            </>
          )}
        </div>
      </D365CommandBar>

      {/* 2. Dynamics 365 Entity Header Summary */}
      <D365EntityHeader
        title={formData.nombre || (isNew ? 'Nueva Lista de Precios' : 'Sin Nombre')}
        subtitle="Lista de Precios"
        avatarName={formData.nombre || 'Lista de Precios'}
        avatarIcon={<Money24Regular />}
        avatarSize={48}
        loading={loading}
        metadata={[
          { label: 'Moneda', value: formData.moneda === 'USD' ? 'USD ($)' : 'PEN (S/)' },
          { label: 'Estado', value: <><span className={formData.activo ? styles.statusDotActive : styles.statusDotInactive} />{formData.activo ? 'Activo' : 'Inactivo'}</> },
          ...(!isNew ? [{ label: 'Artículos', value: `${elementos.length} asignados` }] : []),
        ]}
        tabs={(
          <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as any)}>
            <Tab value="general">General</Tab>
            <Tab value="elementos">Elementos de Lista de Precios</Tab>
          </TabList>
        )}
      />

      {/* 3. Form Content Body */}
      <div className={styles.contentBody}>
        {loading ? (
          <div className={styles.grid2Cols}>
            <Card className={styles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} className={styles.skeletonHeader} />
                <div className={styles.fieldColumnFlex}>
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={72} className={styles.skeletonTextarea72} />
                </div>
              </Skeleton>
            </Card>
            <Card className={styles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} className={styles.skeletonHeader} />
                <div className={styles.fieldColumnFlex}>
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                </div>
              </Skeleton>
            </Card>
          </div>
        ) : selectedTab === 'general' ? (
          <div className={styles.grid2Cols}>
            {/* Card 1: Información General */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Información de la Tarifa</Text>

              {/* Nombre */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label size="medium" required htmlFor="lp-nombre">
                    Nombre
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Input
                    id="lp-nombre"
                    size="medium"
                    className={styles.d365ControlFull}
                    placeholder="Ej. Tarifa General 2026, Mayoristas..."
                    value={formData.nombre}
                    onChange={(_, d) => setFormData({ ...formData, nombre: d.value })}
                  />
                </div>
              </div>

              {/* Moneda */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label size="medium" required htmlFor="lp-moneda">
                    Moneda
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Select
                    id="lp-moneda"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.moneda}
                    onChange={(_, d) => setFormData({ ...formData, moneda: d.value })}
                  >
                    <option value="PEN">PEN — Sol Peruano (S/)</option>
                    <option value="USD">USD — Dólar Estadounidense ($)</option>
                  </Select>
                </div>
              </div>

              {/* Descripción */}
              <div className={styles.d365FieldRowTop}>
                <div className={styles.d365LabelColTop}>
                  <Label size="medium" htmlFor="lp-descripcion">
                    Descripción
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Textarea
                    id="lp-descripcion"
                    size="medium"
                    rows={4}
                    className={styles.d365ControlFull}
                    placeholder="Notas o condiciones sobre el uso de esta lista de precios..."
                    value={formData.descripcion}
                    onChange={(_, d) => setFormData({ ...formData, descripcion: d.value })}
                  />
                </div>
              </div>
            </Card>

            {/* Card 2: Vigencia y Parámetros */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Vigencia y Validez Temporal</Text>

              {/* Fecha Inicio */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label size="medium">
                    Fecha de Inicio
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <DatePicker
                    id="lp-inicio"
                    className={styles.d365ControlFull}
                    placeholder="Seleccionar fecha de inicio..."
                    value={parseISODate(formData.fechaInicio)}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, fechaInicio: formatISODate(date) })
                    }
                  />
                </div>
              </div>

              {/* Fecha Fin */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label size="medium">
                    Fecha de Fin
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <DatePicker
                    id="lp-fin"
                    className={styles.d365ControlFull}
                    placeholder="Seleccionar fecha de fin..."
                    value={parseISODate(formData.fechaFin)}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, fechaFin: formatISODate(date) })
                    }
                  />
                </div>
              </div>

            </Card>
          </div>
        ) : (
          /* Tab Elementos de Lista de Precios */
          <Card className={styles.card}>
            <div>
              {/* Subgrid Toolbar */}
              <D365CommandBar
                ariaLabel="Acciones de elementos de la lista"
                className={localStyles.subgridHeader}
                trailing={
                  <Input
                    size="small"
                    placeholder="Filtrar por palabra clave"
                    contentBefore={<Search16Regular />}
                    value={elementosSearch}
                    onChange={(_, d) => setElementosSearch(d.value)}
                  />
                }
              >
                <D365CommandButton
                  tone="create"
                  size="small"
                  icon={<Add16Regular />}
                  onClick={handleOpenItemDialog}
                >
                  Agregar producto
                </D365CommandButton>
                <D365CommandButton
                  size="small"
                  icon={<ArrowClockwise16Regular />}
                  onClick={isNew ? undefined : loadData}
                >
                  Actualizar
                </D365CommandButton>
              </D365CommandBar>

              {/* Subgrid DataGrid con cabeceras siempre visibles y Empty State */}
              <DataGrid
                items={filteredElementos}
                columns={elementoColumns}
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
                {filteredElementos.length === 0 ? (
                  <TableEmptyState />
                ) : (
                  <DataGridBody<ElementoListaPreciosDto>>
                    {({ item, rowId }) => (
                      <DataGridRow<ElementoListaPreciosDto>
                        key={rowId}
                        className={styles.dataRow}
                        onDoubleClick={() => navigate(`/servicio-campo/productos/${item.productoId}`)}
                      >
                        {({ renderCell }) => (
                          <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>
                        )}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                )}
              </DataGrid>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog: Agregar Producto a Lista de Precios */}
      <Dialog open={itemDialogOpen} onOpenChange={(_, data) => setItemDialogOpen(data.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogTitle>Asignar Producto a Lista de Precios</DialogTitle>
          <DialogBody>
            <DialogContent className={localStyles.dialogForm}>
              {/* Seleccionar Producto */}
              <div className={localStyles.dialogRow}>
                <Label required size="medium" htmlFor="dialog-producto">
                  Producto del Catálogo
                </Label>
                <Select
                  id="dialog-producto"
                  value={newProductoId}
                  onChange={(_, d) => setNewProductoId(d.value)}
                >
                  <option value="">---</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo}] {p.nombre}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Unidad de Medida */}
              <div className={localStyles.dialogRow}>
                <Label size="medium" htmlFor="dialog-unidad">
                  Unidad de Medida (Opcional)
                </Label>
                <Select
                  id="dialog-unidad"
                  value={newUnidadMedidaId}
                  onChange={(_, d) => setNewUnidadMedidaId(d.value)}
                >
                  <option value="">---</option>
                  {availableUnidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.abreviatura})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Método de Fijación */}
              <div className={localStyles.dialogRow}>
                <Label required size="medium" htmlFor="dialog-metodo">
                  Método de Fijación de Precio
                </Label>
                <Select
                  id="dialog-metodo"
                  value={newMetodoFijacion.toString()}
                  onChange={(_, d) => setNewMetodoFijacion(parseInt(d.value, 10))}
                >
                  <option value="1">1 — Importe en divisa fija ({currencySymbol})</option>
                  <option value="2">2 — Porcentaje sobre el costo base (%)</option>
                  <option value="3">3 — Porcentaje de margen comercial (%)</option>
                </Select>
              </div>

              {/* Monto / Porcentaje */}
              <div className={localStyles.dialogRow}>
                <Label required size="medium" htmlFor="dialog-monto">
                  {newMetodoFijacion === 1 ? `Importe (${currencySymbol})` : 'Porcentaje (%)'}
                </Label>
                <Input
                  id="dialog-monto"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  contentBefore={newMetodoFijacion === 1 ? currencySymbol : '%'}
                  value={newMonto}
                  onChange={(_, d) => setNewMonto(d.value)}
                />
              </div>

              <Text size={200} className={styles.fieldHint}>
                Nota: En una misma lista de precios, cada combinación de Producto y Unidad de Medida tiene un único precio. Si ya existe, se actualizará su tarifa.
              </Text>
            </DialogContent>

            <DialogActions>
              <Button appearance="secondary" onClick={() => setItemDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                disabled={itemSubmitting || !newProductoId || newMonto.trim() === ''}
                onClick={handleGuardarElemento}
              >
                {itemSubmitting ? 'Guardando...' : 'Asignar a Lista'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
export default ListaPreciosFormPage;
