import { D365FormContent } from '../../../../components/common/D365FormContent';
import { guardarListaNuevaPendiente, type ListaPreciosPendiente } from '../services/listaPreciosDraft';
import { useValidationFocus } from '../../../../hooks/useValidationFocus';
import { D365ResponsiveDataGrid } from '../../../../components/common/D365ResponsiveDataGrid';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableCellLayout,
  createTableColumn,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Tooltip,
  Skeleton,
  SkeletonItem,
  Link,
  Combobox,
  Option,
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
  Edit16Regular,
  Search16Regular,
  ArrowUpload24Regular,
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
import { D365FormField } from '../../../../components/common/D365FormField';
import { ImportarExcelDialog } from '../../../../components/common/ImportarExcelDialog';

const useLocalStyles = makeStyles({
  subgridHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  tableContainer: {
    width: '100%',
    maxHeight: 'calc(100vh - 330px)',
    overflowY: 'auto',
    overflowX: 'auto',
    boxSizing: 'border-box',
  },
  stickyHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  subgridTable: {
    width: '100%',
    minWidth: '650px',
  },
  subgridFooter: {
    padding: '8px 4px 0 4px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subgridTools: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dialogForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalXXL}`,
  },
  dialogRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  dialogControl: {
    width: '100%',
  },
  drawer: {
    width: '460px',
    maxWidth: '95vw',
  },
  drawerHeader: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
  },
  drawerFooter: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
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
  const [savedHeader, setSavedHeader] = useState({
    nombre: '',
    moneda: 'PEN',
    activo: true,
  });

  // Price List Elements (Items)
  const [elementos, setElementos] = useState<ElementoListaPreciosDto[]>([]);
  const [elementosSearch, setElementosSearch] = useState<string>('');

  // Add / Edit Item Dialog State
  const [itemDrawerOpen, setItemDrawerOpen] = useState<boolean>(false);
  const [itemSubmitting, setItemSubmitting] = useState<boolean>(false);
  const [editingElemento, setEditingElemento] = useState<ElementoListaPreciosDto | null>(null);
  const [availableProducts, setAvailableProducts] = useState<ProductoDto[]>([]);
  const [availableUnidades, setAvailableUnidades] = useState<UnidadMedidaDto[]>([]);

  // Dialog Form State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [newProductoId, setNewProductoId] = useState<string>('');
  const [busquedaProducto, setBusquedaProducto] = useState<string>('');
  const [newUnidadMedidaId, setNewUnidadMedidaId] = useState<string>('');
  const [newMonto, setNewMonto] = useState<string>('');
  const [newMetodoFijacion, setNewMetodoFijacion] = useState<number>(1);

  // Import Excel Dialog State
  const [importExcelOpen, setImportExcelOpen] = useState<boolean>(false);
  const focusValidation = useValidationFocus();
  const pendingCreation = useRef<ListaPreciosPendiente>({ elementos: new Map() });
  const draft = useUnsavedChanges({ formData,elementos: isNew ? elementos : undefined }, !loading);


  const filteredProducts = useMemo(() => {
    if (!busquedaProducto.trim()) return availableProducts;
    const q = busquedaProducto.toLowerCase();
    return availableProducts.filter(
      (p) =>
        selectedProductIds.includes(p.id) ||
        p.nombre.toLowerCase().includes(q) ||
        (p.codigo && p.codigo.toLowerCase().includes(q))
    );
  }, [availableProducts, busquedaProducto, selectedProductIds]);

  const resetForm = useCallback(() => {
    pendingCreation.current = { elementos: new Map() };
    setFormData({
      nombre: '',
      moneda: 'PEN',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      activo: true,
    });
    setSavedHeader({
      nombre: '',
      moneda: 'PEN',
      activo: true,
    });
    setElementos([]);
    setBanner(null);
    setSelectedTab('general');
    setLoading(false);
  }, []);

  // Load Price List
  const loadData = useCallback(async () => {
    if (isNew) {
      resetForm();
      return;
    }
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
      setSavedHeader({
        nombre: data.nombre || '',
        moneda: data.moneda || 'PEN',
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
  }, [id, isNew, resetForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load catalogs for dialog (Products and Units)
  const loadCatalogsForDrawer = async () => {
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

  const handleOpenItemDrawer = () => {
    setEditingElemento(null);
    setSelectedProductIds([]);
    setNewProductoId('');
    setBusquedaProducto('');
    setNewUnidadMedidaId('');
    setNewMonto('0');
    setNewMetodoFijacion(1);
    setItemDrawerOpen(true);
    loadCatalogsForDrawer();
  };

  const handleEditarElemento = (item: ElementoListaPreciosDto) => {
    setEditingElemento(item);
    setSelectedProductIds([item.productoId]);
    setNewProductoId(item.productoId);
    setBusquedaProducto(`[${item.productoCodigo}] ${item.productoNombre}`);
    setNewUnidadMedidaId(item.unidadMedidaId || '');
    setNewMonto(item.monto.toString());
    setNewMetodoFijacion(item.metodoFijacion);
    setItemDrawerOpen(true);
    loadCatalogsForDrawer();
  };

  // Handle Save
  const handleSave = async (closeAfter: boolean = false) => {
    const savedDraft = draft.capture();
    if (!formData.nombre.trim()) {
      setSelectedTab('general'); focusValidation("lp-nombre");
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

        const res = await guardarListaNuevaPendiente(pendingCreation.current, createDto, elementos);

        draft.markSaved(savedDraft);

        setBanner({ text: 'Lista de precios creada exitosamente.', intent: 'success' });

        if (closeAfter) {
          draft.markSaved(savedDraft);
          navigate('/servicio-campo/listas-precios');
        } else {
          draft.markSaved(savedDraft);
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
        setSavedHeader((prev) => ({
          ...prev,
          nombre: updateDto.nombre,
          moneda: updateDto.moneda,
        }));
        draft.markSaved(savedDraft);
        setBanner({ text: 'Lista de precios actualizada correctamente.', intent: 'success' });

        if (closeAfter) {
          draft.markSaved(savedDraft);
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
      setSavedHeader((prev) => ({ ...prev, activo: nuevoEstado }));
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

  // Add or Update Item(s) in Price List
  const handleGuardarElemento = async () => {
    const targetProductIds = editingElemento
      ? (newProductoId ? [newProductoId] : [])
      : selectedProductIds;

    if (targetProductIds.length === 0) {
      setBanner({ text: 'Debe seleccionar al menos un producto.', intent: 'warning' });
      return;
    }

    const montoNum = parseFloat(newMonto);
    if (isNaN(montoNum) || montoNum < 0) {
      setBanner({ text: 'Debe ingresar un monto o porcentaje numérico válido mayor o igual a 0.', intent: 'warning' });
      return;
    }

    if (isNew) {
      if (editingElemento) {
        const prod = availableProducts.find((p) => p.id === newProductoId);
        const um = availableUnidades.find((u) => u.id === newUnidadMedidaId);
        setElementos((prev) =>
          prev.map((e) =>
            e.id === editingElemento.id
              ? {
                  ...e,
                  productoId: newProductoId,
                  productoCodigo: prod?.codigo || e.productoCodigo,
                  productoNombre: prod?.nombre || e.productoNombre,
                  unidadMedidaId: newUnidadMedidaId || null,
                  unidadMedidaNombre: um?.nombre || null,
                  monto: montoNum,
                  metodoFijacion: newMetodoFijacion,
                }
              : e
          )
        );
      } else {
        setElementos((prev) => {
          let updated = [...prev];
          for (const prodId of targetProductIds) {
            const prod = availableProducts.find((p) => p.id === prodId);
            const effectiveUnitId = newUnidadMedidaId || prod?.unidadMedidaDefectoId || null;
            const um = availableUnidades.find((u) => u.id === effectiveUnitId);

            const existingIdx = updated.findIndex(
              (e) => e.productoId === prodId && (e.unidadMedidaId || null) === (effectiveUnitId || null)
            );

            if (existingIdx >= 0) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                monto: montoNum,
                metodoFijacion: newMetodoFijacion,
              };
            } else {
              const tempItem: ElementoListaPreciosDto = {
                id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                listaPreciosId: '',
                productoId: prodId,
                productoCodigo: prod?.codigo || 'PROD',
                productoNombre: prod?.nombre || 'Producto',
                unidadMedidaId: effectiveUnitId,
                unidadMedidaNombre: um?.nombre || null,
                monto: montoNum,
                metodoFijacion: newMetodoFijacion,
              };
              updated.push(tempItem);
            }
          }
          return updated;
        });
      }

      setItemDrawerOpen(false);
      setEditingElemento(null);
      setSelectedProductIds([]);
      setBanner({
        text: editingElemento
          ? 'Precio del producto actualizado. Se guardará al pulsar Guardar.'
          : `${targetProductIds.length} producto(s) asignado(s). Se guardarán al pulsar Guardar.`,
        intent: 'success',
      });
      setTimeout(() => setBanner(null), 3500);
      return;
    }

    try {
      setItemSubmitting(true);
      if (editingElemento) {
        await ListaPreciosService.guardarElemento(id!, {
          elementoId: editingElemento.id,
          productoId: newProductoId,
          monto: montoNum,
          unidadMedidaId: newUnidadMedidaId || null,
          metodoFijacion: newMetodoFijacion,
        });
      } else {
        for (const prodId of targetProductIds) {
          const prod = availableProducts.find((p) => p.id === prodId);
          const effectiveUnitId = newUnidadMedidaId || prod?.unidadMedidaDefectoId || null;
          await ListaPreciosService.guardarElemento(id!, {
            productoId: prodId,
            monto: montoNum,
            unidadMedidaId: effectiveUnitId,
            metodoFijacion: newMetodoFijacion,
          });
        }
      }

      setItemDrawerOpen(false);
      setEditingElemento(null);
      setSelectedProductIds([]);
      setBanner({
        text: editingElemento
          ? 'Precio del producto actualizado exitosamente.'
          : `${targetProductIds.length} producto(s) asignado(s) a la lista de precios exitosamente.`,
        intent: 'success',
      });
      setTimeout(() => setBanner(null), 4000);
      loadData();
    } catch (err: any) {
      console.error('Error saving item:', err);
      setBanner({
        text: err?.message || 'Error al guardar elemento(s) en la lista de precios.',
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
                onClick={() => handleEditarElemento(item)}
                title="Editar precio del producto"
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
            <div style={{ display: 'flex', gap: '4px' }}>
              <Tooltip content="Editar precio" relationship="label">
                <Button
                  size="medium"
                  appearance="subtle"
                  icon={<Edit16Regular />}
                  onClick={() => handleEditarElemento(item)}
                />
              </Tooltip>
              <Tooltip content="Remover de esta lista" relationship="label">
                <Button
                  size="medium"
                  appearance="subtle"
                  icon={<Delete16Regular className={styles.iconDanger} />}
                  onClick={() => handleEliminarElemento(item.id, item.productoNombre)}
                />
              </Tooltip>
            </div>
          </TableCellLayout>
        ),
      }),
    ],
    [currencySymbol, styles, handleEditarElemento, handleEliminarElemento]
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
            onClick={() => void draft.discardAndRun(() => { void (() => {
              resetForm();
              navigate('/servicio-campo/listas-precios/nuevo');
            })(); })}
            disabled={saving || loading}
            appearance="subtle"
          >
            Nuevo
          </D365CommandButton>

          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            disabled={saving || loading}
            onClick={() => void draft.discardAndRun(() => { void (isNew ? () => {
              setFormData({
                nombre: '',
                moneda: 'PEN',
                descripcion: '',
                fechaInicio: '',
                fechaFin: '',
                activo: true,
              });
            } : loadData)(); })}
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
        title={savedHeader.nombre || (isNew ? 'Nueva Lista de Precios' : 'Sin Nombre')}
        subtitle="Lista de Precios"
        avatarName={savedHeader.nombre || 'Lista de Precios'}
        avatarIcon={<Money24Regular />}
        avatarSize={48}
        loading={loading}
        metadata={[
          { label: 'Moneda', value: savedHeader.moneda === 'USD' ? 'USD ($)' : 'PEN (S/)' },
          { label: 'Estado', value: <><span className={savedHeader.activo ? styles.statusDotActive : styles.statusDotInactive} />{savedHeader.activo ? 'Activo' : 'Inactivo'}</> },
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
      <D365FormContent busy={saving} className={styles.contentBody}>
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
              <D365FormField label="Nombre" required htmlFor="lp-nombre">
                <Input
                  id="lp-nombre"
                  size="medium"
                  className={styles.d365ControlFull}
                  value={formData.nombre}
                  onChange={(_, d) => setFormData({ ...formData, nombre: d.value })}
                />
              </D365FormField>

              {/* Moneda */}
              <D365FormField label="Moneda" required htmlFor="lp-moneda">
                <Select
                  id="lp-moneda"
                  size="medium"
                  className={styles.d365ControlFull}
                  value={formData.moneda}
                  onChange={(_, d) => setFormData({ ...formData, moneda: d.value })}
                >
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                </Select>
              </D365FormField>

              {/* Descripción */}
              <D365FormField label="Descripción" htmlFor="lp-descripcion" align="top">
                <Textarea
                  id="lp-descripcion"
                  size="medium"
                  rows={4}
                  className={styles.d365ControlFull}
                  value={formData.descripcion}
                  onChange={(_, d) => setFormData({ ...formData, descripcion: d.value })}
                />
              </D365FormField>
            </Card>

            {/* Card 2: Vigencia y Parámetros */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Vigencia y Validez Temporal</Text>

              {/* Fecha Inicio */}
              <D365FormField label="Fecha de Inicio" htmlFor="lp-inicio">
                <DatePicker
                  id="lp-inicio"
                  className={styles.d365ControlFull}
                  value={parseISODate(formData.fechaInicio)}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, fechaInicio: formatISODate(date) })
                  }
                />
              </D365FormField>

              {/* Fecha Fin */}
              <D365FormField label="Fecha de Fin" htmlFor="lp-fin">
                <DatePicker
                  id="lp-fin"
                  className={styles.d365ControlFull}
                  value={parseISODate(formData.fechaFin)}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, fechaFin: formatISODate(date) })
                  }
                />
              </D365FormField>

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
                    size="medium"
                    placeholder="Buscar" aria-label="Buscar"
                    contentBefore={<Search16Regular />}
                    value={elementosSearch}
                    onChange={(_, d) => setElementosSearch(d.value)}
                  />
                }
              >
                <D365CommandButton
                  tone="create"
                  size="medium"
                  icon={<Add16Regular />}
                  onClick={handleOpenItemDrawer}
                >
                  Agregar producto
                </D365CommandButton>
                <D365CommandButton
                  size="medium"
                  icon={<ArrowUpload24Regular />}
                  disabled={isNew}
                  title={isNew ? 'Guarde primero la lista de precios para importar desde Excel' : 'Importar precios masivamente desde Excel'}
                  onClick={() => setImportExcelOpen(true)}
                >
                  Importar Excel
                </D365CommandButton>
                <D365CommandButton
                  size="medium"
                  icon={<ArrowClockwise16Regular />}
                  onClick={() => void draft.discardAndRun(() => { void (isNew ? undefined : loadData)?.(); })}
                >
                  Actualizar
                </D365CommandButton>
              </D365CommandBar>

              {/* Subgrid DataGrid con cabeceras fijas y scroll propio */}
              <div className={localStyles.tableContainer}>
                <D365ResponsiveDataGrid onMobileOpen={handleEditarElemento} mobileLabel="Precios"
                  items={filteredElementos}
                  columns={elementoColumns}
                  getRowId={(item) => item.id}
                  className={localStyles.subgridTable}
                >
                  <DataGridHeader className={localStyles.stickyHeader}>
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
                          onDoubleClick={() => handleEditarElemento(item)}
                        >
                          {({ renderCell }) => (
                            <DataGridCell className={styles.dataCell}>{renderCell(item)}</DataGridCell>
                          )}
                        </DataGridRow>
                      )}
                    </DataGridBody>
                  )}
                </D365ResponsiveDataGrid>
              </div>

              {/* Subgrid Footer */}
              <div className={localStyles.subgridFooter}>
                <span>
                  {filteredElementos.length === elementos.length
                    ? `${elementos.length} elementos`
                    : `Mostrando ${filteredElementos.length} de ${elementos.length} elementos`}
                </span>
              </div>
            </div>
          </Card>
        )}
      </D365FormContent>

      <OverlayDrawer
        open={itemDrawerOpen}
        position="end"
        className={localStyles.drawer}
        onOpenChange={(_, data) => !data.open && !itemSubmitting && (setItemDrawerOpen(false), setEditingElemento(null))}
      >
        <DrawerHeader className={localStyles.drawerHeader}>
          <DrawerHeaderTitle
            action={(
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                aria-label="Cerrar"
                disabled={itemSubmitting}
                onClick={() => {
                  setItemDrawerOpen(false);
                  setEditingElemento(null);
                }}
              />
            )}
          >
            {editingElemento ? 'Editar precio' : 'Creación rápida: Precio'}
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody className={localStyles.dialogForm}>
          <div className={localStyles.dialogRow}>
            <Label required size="medium" htmlFor="dialog-producto">
              Producto
            </Label>
            <Combobox
              id="dialog-producto"
              multiselect={!editingElemento}
              disabled={!!editingElemento}
              className={localStyles.dialogControl}
              placeholder={
                selectedProductIds.length > 0
                  ? `${selectedProductIds.length} producto(s) seleccionado(s)`
                  : ''
              }
              value={
                editingElemento
                  ? `[${editingElemento.productoCodigo}] ${editingElemento.productoNombre}`
                  : busquedaProducto
                  ? busquedaProducto
                  : selectedProductIds.length === 1
                  ? (() => {
                      const sp = availableProducts.find((p) => p.id === selectedProductIds[0]);
                      return sp ? `[${sp.codigo}] ${sp.nombre}` : '';
                    })()
                  : selectedProductIds.length > 1
                  ? `${selectedProductIds.length} productos seleccionados`
                  : ''
              }
              selectedOptions={editingElemento ? (newProductoId ? [newProductoId] : []) : selectedProductIds}
              onChange={(e) => {
                if (editingElemento) return;
                setBusquedaProducto(e.target.value);
              }}
              onOptionSelect={(_, d) => {
                if (editingElemento) return;
                const nextSelected = d.selectedOptions;
                setSelectedProductIds(nextSelected);
                if (nextSelected.length === 1 && !newUnidadMedidaId) {
                  const sp = availableProducts.find((p) => p.id === nextSelected[0]);
                  if (sp?.unidadMedidaDefectoId) {
                    setNewUnidadMedidaId(sp.unidadMedidaDefectoId);
                  }
                }
              }}
            >
              {filteredProducts.map((p) => (
                <Option key={p.id} value={p.id} text={`[${p.codigo}] ${p.nombre}`}>
                  [{p.codigo}] {p.nombre}
                </Option>
              ))}
              {filteredProducts.length === 0 && (
                <Option disabled value="">
                  No se encontraron productos coincidentes
                </Option>
              )}
            </Combobox>
            {!editingElemento && selectedProductIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                {selectedProductIds.map((pid) => {
                  const p = availableProducts.find((x) => x.id === pid);
                  return (
                    <span
                      key={pid}
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        backgroundColor: tokens.colorNeutralBackground3,
                        borderRadius: tokens.borderRadiusMedium,
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {p ? `[${p.codigo}] ${p.nombre}` : pid}
                      <span
                        style={{ cursor: 'pointer', fontWeight: 'bold', color: tokens.colorNeutralForeground3 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductIds((prev) => prev.filter((id) => id !== pid));
                        }}
                        title="Quitar"
                      >
                        ✕
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className={localStyles.dialogRow}>
            <Label size="medium" htmlFor="dialog-unidad">
              Unidad
            </Label>
            <Select
              id="dialog-unidad"
              className={localStyles.dialogControl}
              value={newUnidadMedidaId}
              onChange={(_, d) => setNewUnidadMedidaId(d.value)}
            >
              <option value="">{selectedProductIds.length > 1 ? 'Unidad predeterminada de cada producto' : 'Seleccionar unidad...'}</option>
              {availableUnidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div className={localStyles.dialogRow}>
            <Label required size="medium" htmlFor="dialog-metodo">
              Método
            </Label>
            <Select
              id="dialog-metodo"
              className={localStyles.dialogControl}
              value={newMetodoFijacion.toString()}
              onChange={(_, d) => setNewMetodoFijacion(parseInt(d.value, 10))}
            >
              <option value="1">Importe</option>
              <option value="2">Costo</option>
              <option value="3">Margen</option>
            </Select>
          </div>

          <div className={localStyles.dialogRow}>
            <Label required size="medium" htmlFor="dialog-monto">
              {newMetodoFijacion === 1 ? 'Importe' : 'Porcentaje'}
            </Label>
            <Input
              id="dialog-monto"
              className={localStyles.dialogControl}
              type="number"
              step="0.01"
              min="0"
              contentBefore={newMetodoFijacion === 1 ? currencySymbol : '%'}
              value={newMonto}
              onChange={(_, d) => setNewMonto(d.value)}
            />
          </div>
        </DrawerBody>
        <DrawerFooter className={localStyles.drawerFooter}>
          <Button
            appearance="secondary"
            disabled={itemSubmitting}
            onClick={() => {
              setItemDrawerOpen(false);
              setEditingElemento(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            appearance="primary"
            disabled={
              itemSubmitting ||
              (editingElemento ? !newProductoId : selectedProductIds.length === 0) ||
              newMonto.trim() === ''
            }
            onClick={handleGuardarElemento}
          >
            {itemSubmitting
              ? 'Guardando…'
              : editingElemento
              ? 'Actualizar precio'
              : selectedProductIds.length > 1
              ? `Guardar ${selectedProductIds.length} precios`
              : 'Guardar y cerrar'}
          </Button>
        </DrawerFooter>
      </OverlayDrawer>

      {/* Dialog para Carga Masiva desde Excel */}
      <ImportarExcelDialog
        open={importExcelOpen}
        onOpenChange={setImportExcelOpen}
        title={`Importar Precios - ${savedHeader.nombre || 'Lista de Precios'}`}
        entityName="Precios de Productos"
        onDownloadTemplate={() => ListaPreciosService.descargarPlantillaExcel()}
        onUploadFile={(file) => ListaPreciosService.importarExcel(id!, file)}
        onSuccess={() => {
          loadData();
          setBanner({
            text: 'Precios importados y actualizados exitosamente desde Excel.',
            intent: 'success',
          });
          setTimeout(() => setBanner(null), 4000);
        }}
        allowUpsert={true}
      />
    </div>
  );
};
export default ListaPreciosFormPage;
