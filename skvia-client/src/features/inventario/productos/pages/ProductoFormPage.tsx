import { D365FormContent } from '../../../../components/common/D365FormContent';
import { useValidationFocus } from '../../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Textarea,
  Select,
  Switch,
  TabList,
  Tab,
  Card,
  Text,
  Skeleton,
  SkeletonItem,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
  useId,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  Cube16Regular,
  Folder16Regular,
  LockClosed16Regular,
  Money16Regular,
  Building16Regular,
} from '@fluentui/react-icons';
import { ProductoService } from '../services/producto.service';
import type { CreateProductoDto, TipoProducto } from '../types/producto.types';
import { CategoriaService } from '../../categorias/services/categoria.service';
import type { CategoriaProductoDto } from '../../categorias/types/categoria.types';
import { CrearCategoriaDrawer } from '../../categorias/components/CrearCategoriaDrawer';
import { GrupoUnidadMedidaService, UnidadMedidaService } from '../../unidades-medida/services/unidadMedida.service';
import type { GrupoUnidadMedidaDto, UnidadMedidaDto } from '../../unidades-medida/types/unidadMedida.types';
import { CrearUnidadDrawer } from '../../unidades-medida/components/CrearUnidadDrawer';
import { ListaPreciosService } from '../../listas-precios/services/listaPrecios.service';
import type { ListaPreciosDto } from '../../listas-precios/types/listaPrecios.types';
import { CrearListaPreciosDrawer } from '../../listas-precios/components/CrearListaPreciosDrawer';
import { ClienteService } from '../../../crm/clientes/services/cliente.service';
import type { ClienteListadoItemDto } from '../../../crm/clientes/types/cliente.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { SelectorEntidadRelacionada, type OpcionEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { LookupDropdownWithQuickCreate } from '../../../../components/common/LookupDropdownWithQuickCreate';

export interface ProductoFormPageProps {
  productoId?: string | null;
  onBack?: () => void;
  onSaved?: (savedId: string) => void;
  onCreated?: (createdId: string) => void;
}

export const ProductoFormPage: React.FC<ProductoFormPageProps> = ({
  productoId: propProductoId,
  onBack: propOnBack,
  onSaved: propOnSaved,
  onCreated: propOnCreated,
}) => {
  const styles = useD365FormStyles();
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const toasterId = useId('producto-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback(
    (title: string) => {
      dispatchToast(
        <Toast>
          <ToastTitle>{title}</ToastTitle>
        </Toast>,
        { intent: 'success', position: 'top-end' }
      );
    },
    [dispatchToast]
  );

  // Effective product ID (either from prop or route, unless it's 'nuevo')
  const effectiveId = propProductoId !== undefined
    ? propProductoId
    : (routeId && routeId !== 'nuevo' ? routeId : null);

  // Current Product ID (null if new)
  const [currentId, setCurrentId] = useState<string | null>(effectiveId);
  const isEditMode = Boolean(currentId);

  // Active Tab: D365 standard tabs
  const [selectedTab, setSelectedTab] = useState<string>('detalles');

  // Form State (Real-time input values)
  const [formData, setFormData] = useState<CreateProductoDto>({
    codigo: '',
    nombre: '',
    tipo: 'Inventario',
    categoriaProductoId: null,
    grupoUnidadMedidaId: null,
    unidadMedidaDefectoId: null,
    decimalesCantidad: 0,
    precioBase: 0,
    costoActual: 0,
    costoEstandar: 0,
    afectoImpuesto: true,
    esSerializado: false,
    codigoBarras: '',
    proveedorDefecto: '',
    descripcion: '',
    listaPreciosPredeterminadaId: null,
  });

  // String states para inputs numéricos (permite ingresar 0, decimales y limpiar sin comportamientos extraños)
  const [precioBaseStr, setPrecioBaseStr] = useState<string>('0');
  const [costoActualStr, setCostoActualStr] = useState<string>('0');
  const [costoEstandarStr, setCostoEstandarStr] = useState<string>('0');

  // Header State (Solo se actualiza al cargar o al pulsar Guardar con éxito)
  const [savedHeader, setSavedHeader] = useState<{
    nombre: string;
    codigo: string;
    tipo: string;
    activo: boolean;
  }>({
    nombre: '',
    codigo: '',
    tipo: 'Inventario',
    activo: true,
  });

  // UI state
  const [loading, setLoading] = useState<boolean>(Boolean(effectiveId));
  const [saving, setSaving] = useState<boolean>(false);
  const [tieneMovimientos, setTieneMovimientos] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Catálogos dinámicos
  const [categoriasList, setCategoriasList] = useState<CategoriaProductoDto[]>([]);
  const [unidadesList, setUnidadesList] = useState<UnidadMedidaDto[]>([]);
  const [gruposUnidadList, setGruposUnidadList] = useState<GrupoUnidadMedidaDto[]>([]);
  const [listasPreciosList, setListasPreciosList] = useState<ListaPreciosDto[]>([]);
  const [cuentasList, setCuentasList] = useState<ClienteListadoItemDto[]>([]);

  const cargarCatalogos = useCallback(() => {
    CategoriaService.getCategorias(undefined, true)
      .then((cats) => setCategoriasList(cats))
      .catch((err) => console.error('Error al cargar catálogo de categorías:', err));

    UnidadMedidaService.getUnidadesMedida(undefined, true)
      .then((ums) => setUnidadesList(ums))
      .catch((err) => console.error('Error al cargar catálogo de unidades de medida:', err));

    GrupoUnidadMedidaService.getGrupos(undefined, true)
      .then((grupos) => setGruposUnidadList(grupos))
      .catch((err) => console.error('Error al cargar grupos de unidades:', err));

    ListaPreciosService.getListasPrecios(undefined, true)
      .then((lps) => setListasPreciosList(lps))
      .catch((err) => console.error('Error al cargar listas de precios:', err));

    ClienteService.obtenerClientes({ soloActivos: true })
      .then((cts) => setCuentasList(cts || []))
      .catch((err) => console.error('Error al cargar catálogo de cuentas/proveedores:', err));
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // Estado y lógica para TagPicker de Unidad de Medida (Estilo Dynamics 365)
  const [unidadQuery, setUnidadQuery] = useState('');

  // Estado y lógica para TagPicker de Categoría (Estilo Dynamics 365)
  const [categoriaQuery, setCategoriaQuery] = useState('');

  // Estado y lógica para TagPicker de Proveedor Habitual (Estilo Dynamics 365)
  const [proveedorQuery, setProveedorQuery] = useState('');

  const opcionesProveedores: OpcionEntidadRelacionada[] = useMemo(() => {
    return cuentasList.map((c) => ({
      id: c.id,
      nombre: c.razonSocial || c.nombreCompletoODenominacion,
      detalle: c.documentoIdentidad ? `RUC ${c.documentoIdentidad}` : undefined,
    }));
  }, [cuentasList]);

  const proveedorSeleccionadoObj: OpcionEntidadRelacionada | null = useMemo(() => {
    if (!formData.proveedorDefecto) return null;
    const provUpper = formData.proveedorDefecto.trim().toUpperCase();
    const c = cuentasList.find((x) =>
      (x.razonSocial && x.razonSocial.toUpperCase() === provUpper) ||
      (x.nombreCompletoODenominacion && x.nombreCompletoODenominacion.toUpperCase() === provUpper) ||
      (x.nombres && x.nombres.toUpperCase() === provUpper)
    );
    if (c) {
      return {
        id: c.id,
        nombre: c.razonSocial || c.nombreCompletoODenominacion,
        detalle: c.documentoIdentidad ? `RUC ${c.documentoIdentidad}` : undefined,
      };
    }
    return {
      id: 'manual',
      nombre: formData.proveedorDefecto,
      detalle: 'Proveedor habitual',
    };
  }, [cuentasList, formData.proveedorDefecto]);

  const categoriaSeleccionadaObj = useMemo(
    () => categoriasList.find((c) => c.id === formData.categoriaProductoId),
    [categoriasList, formData.categoriaProductoId]
  );

  const unidadSeleccionadaObj = useMemo(
    () => unidadesList.find((unidad) => unidad.id === formData.unidadMedidaDefectoId),
    [unidadesList, formData.unidadMedidaDefectoId],
  );

  useEffect(() => {
    if (effectiveId || categoriasList.length === 0 || gruposUnidadList.length === 0 || unidadesList.length === 0) return;

    const categoriaDefault = categoriasList.find((categoria) => categoria.nombre.toLowerCase() === 'default');
    const grupoDefault = gruposUnidadList.find((grupo) => grupo.nombre.toLowerCase() === 'unidades generales');
    const unidadDefault = grupoDefault
      ? unidadesList.find((unidad) => unidad.grupoUnidadMedidaId === grupoDefault.id && (unidad.esUnidadBase || unidad.nombre.toLowerCase() === 'unidades' || unidad.nombre.toLowerCase() === 'unidad'))
      : undefined;

    setFormData((actual) => ({
      ...actual,
      categoriaProductoId: actual.categoriaProductoId ?? categoriaDefault?.id ?? null,
      grupoUnidadMedidaId: actual.grupoUnidadMedidaId ?? grupoDefault?.id ?? null,
      unidadMedidaDefectoId: actual.unidadMedidaDefectoId ?? unidadDefault?.id ?? null,
    }));
  }, [categoriasList, effectiveId, gruposUnidadList, unidadesList]);

  // Estado y lógica para TagPicker de Lista de Precios Predeterminada (Estilo Dynamics 365)
  const [listaPreciosQuery, setListaPreciosQuery] = useState('');
  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges({ formData,precioBaseStr,costoActualStr,costoEstandarStr }, !loading);


  const listaPreciosSeleccionadaObj = useMemo(
    () => listasPreciosList.find((lp) => lp.id === formData.listaPreciosPredeterminadaId),
    [listasPreciosList, formData.listaPreciosPredeterminadaId]
  );

  // Cargar producto si estamos en modo edición
  useEffect(() => {
    if (effectiveId) {
      setCurrentId(effectiveId);
      setLoading(true);
      ProductoService.getProductoById(effectiveId)
        .then((p) => {
          const tipoNormalizado: TipoProducto = p.tipo === 1 || p.tipo === 'Inventario'
            ? 'Inventario'
            : p.tipo === 2 || p.tipo === 'NoInventario'
              ? 'NoInventario'
              : 'Servicio';
          setFormData({
            codigo: p.codigo,
            nombre: p.nombre,
            tipo: tipoNormalizado,
            categoriaProductoId: p.categoriaProductoId ?? null,
            grupoUnidadMedidaId: p.grupoUnidadMedidaId ?? null,
            unidadMedidaDefectoId: p.unidadMedidaDefectoId ?? null,
            decimalesCantidad: p.decimalesCantidad ?? 0,
            precioBase: p.precioBase,
            costoActual: p.costoActual ?? 0,
            costoEstandar: p.costoEstandar ?? 0,
            afectoImpuesto: p.afectoImpuesto ?? true,
            esSerializado: p.esSerializado ?? false,
            codigoBarras: p.codigoBarras ?? '',
            proveedorDefecto: p.proveedorDefecto ?? '',
            descripcion: p.descripcion ?? '',
            notas: p.notas ?? '',
            listaPreciosPredeterminadaId: p.listaPreciosPredeterminadaId ?? null,
          });
          setPrecioBaseStr(p.precioBase !== undefined && p.precioBase !== null ? p.precioBase.toString() : '0');
          setCostoActualStr(p.costoActual !== undefined && p.costoActual !== null ? p.costoActual.toString() : '0');
          setCostoEstandarStr(p.costoEstandar !== undefined && p.costoEstandar !== null ? p.costoEstandar.toString() : '0');
          setSavedHeader({
            nombre: p.nombre,
            codigo: p.codigo,
            tipo: tipoNormalizado === 'NoInventario' ? 'No inventario' : tipoNormalizado,
            activo: p.activo,
          });
          setTieneMovimientos(Boolean(p.tieneMovimientos));
        })
        .catch((err) => {
          setStatusMessage({
            type: 'error',
            text: `Error al cargar el producto: ${err?.message || 'Error desconocido'}`,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      handleResetForm();
      setLoading(false);
    }
  }, [effectiveId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código del producto es obligatorio';
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del producto es obligatorio';
    }
    if ((formData.tipo === 'Inventario' || formData.tipo === 1) && !formData.unidadMedidaDefectoId) {
      newErrors.unidadMedida = 'Selecciona una unidad predeterminada.';
    }
    const decimalesCantidad = formData.decimalesCantidad ?? 0;
    if (!Number.isInteger(decimalesCantidad) || decimalesCantidad < 0 || decimalesCantidad > 5) {
      newErrors.decimalesCantidad = 'Indica un número entero entre 0 y 5.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfter: boolean) => {
    const savedDraft = draft.capture();
    if (!validate()) {
      setSelectedTab('general'); focusValidation();
      setStatusMessage({ type: 'error', text: 'Por favor completa los campos obligatorios marcados con *' });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      let savedId = currentId;

      if (isEditMode && currentId) {
        await ProductoService.updateProducto(currentId, {
          nombre: formData.nombre,
          categoriaProductoId: formData.categoriaProductoId,
          grupoUnidadMedidaId: formData.grupoUnidadMedidaId,
          unidadMedidaDefectoId: formData.unidadMedidaDefectoId,
          decimalesCantidad: formData.decimalesCantidad,
          esSerializado: formData.esSerializado,
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          precioBase: formData.precioBase,
          codigoBarras: formData.codigoBarras,
          notas: formData.notas,
          costoActual: formData.costoActual,
          costoEstandar: formData.costoEstandar,
          afectoImpuesto: formData.afectoImpuesto,
          proveedorDefecto: formData.proveedorDefecto,
          listaPreciosPredeterminadaId: formData.listaPreciosPredeterminadaId,
        });
        draft.markSaved(savedDraft);
        notifySuccess(`Producto "${formData.nombre}" actualizado exitosamente.`);
        setStatusMessage(null);
      } else {
        const res = await ProductoService.createProducto(formData);
        savedId = res.id;
        setCurrentId(res.id);
        draft.markSaved(savedDraft);
        notifySuccess(`Producto "${formData.nombre}" creado exitosamente.`);
        setStatusMessage(null);
        if (!closeAfter) {
          draft.markSaved(savedDraft);
          navigate(`/servicio-campo/productos/${res.id}`, { replace: true });
        }
      }

      setSavedHeader({
        nombre: formData.nombre,
        codigo: formData.codigo,
        tipo: formData.tipo === 'NoInventario' ? 'No inventario' : String(formData.tipo || 'Inventario'),
        activo: true,
      });

      if (closeAfter) {
        setTimeout(() => {
          if (propOnSaved) propOnSaved(savedId || '');
          if (propOnCreated) propOnCreated(savedId || '');
          draft.markSaved(savedDraft);
          navigate('/servicio-campo/productos');
        }, 800);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setStatusMessage({
        type: 'error',
        text: error?.message || 'Error al comunicarse con el servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    setCurrentId(null);
    setFormData({
      codigo: '',
      nombre: '',
      tipo: 'Inventario',
      categoriaProductoId: null,
      grupoUnidadMedidaId: null,
      unidadMedidaDefectoId: null,
      decimalesCantidad: 0,
      precioBase: 0,
      costoActual: 0,
      costoEstandar: 0,
      afectoImpuesto: true,
      esSerializado: false,
      codigoBarras: '',
      proveedorDefecto: '',
      descripcion: '',
      notas: '',
      listaPreciosPredeterminadaId: null,
    });
    setPrecioBaseStr('0');
    setCostoActualStr('0');
    setCostoEstandarStr('0');
    setSavedHeader({
      nombre: '',
      codigo: '',
      tipo: 'Inventario',
      activo: true,
    });
    setErrors({});
    setTieneMovimientos(false);
    setStatusMessage(null);
  };

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate('/servicio-campo/productos');
    }
  };

  const handleNew = () => {
    navigate('/servicio-campo/productos/nuevo');
    handleResetForm();
    cargarCatalogos();
  };

  const getInitials = (text: string) =>
    text
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const headerTitle = loading
    ? 'Cargando...'
    : savedHeader.nombre || (isEditMode ? 'Cargando...' : 'Nuevo producto');

  const headerSubtitle = loading
    ? 'Cargando...'
    : savedHeader.codigo
      ? `Producto · Código: ${savedHeader.codigo.toUpperCase()}`
      : 'Producto sin guardar';

  const headerInitials = savedHeader.nombre ? getInitials(savedHeader.nombre) : 'NP';

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />
      {/* 0. FULL WIDTH TOP NOTIFICATION MESSAGEBAR (ABOVE COMMAND BAR CON BOTÓN X) */}
      {statusMessage && (
        <D365MessageBar
          intent={statusMessage.type === 'success' ? 'success' : 'error'}
          className={styles.messageBarContainer}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </D365MessageBar>
      )}

      {/* 1. DYNAMICS 365 COMMAND BAR */}
      <D365CommandBar
        ariaLabel="Comandos de producto"

        busy={saving || loading}
        busyLabel={loading ? 'Cargando...' : 'Guardando...'}
      >
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={handleBack}
            title="Volver al listado"
            aria-label="Volver"
          />
          <D365CommandDivider />

          {/* Guardar: Lilac Border Active */}
          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            onClick={() => handleSave(false)}
            disabled={saving || loading}
            appearance="subtle"
          >
            Guardar
          </D365CommandButton>

          {/* Guardar y cerrar: Lilac Border Active */}
          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            onClick={() => handleSave(true)}
            disabled={saving || loading}
            appearance="subtle"
          >
            Guardar y cerrar
          </D365CommandButton>

          {/* Nuevo: Verde D365 */}
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={handleNew}
            disabled={saving || loading}
            appearance="subtle"
          >
            Nuevo
          </D365CommandButton>

          {/* Deshacer / Refrescar */}
          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            onClick={handleNew}
            disabled={saving || loading}
            appearance="subtle"
          >
            Deshacer
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. ENTITY HEADER SUMMARY */}
      <D365EntityHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        avatarName={headerTitle}
        avatarInitials={headerInitials}
        avatarSize={56}
        loading={loading}
        metadata={[
          { label: 'Estado', value: savedHeader.activo ? 'Activo' : 'Inactivo' },
          { label: 'Tipo de producto', value: savedHeader.tipo },
        ]}
        tabs={(
          <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value as string)}>
            <Tab value="detalles">Detalles del Producto</Tab>
            <Tab value="field-service">Servicio de Campo</Tab>
            <Tab value="notas">Notas</Tab>
          </TabList>
        )}
      />

      {/* 3. D365 FORM SECTIONS (Ocupando de izquierda a derecha sin centrado) */}
      {loading ? (
        <D365FormContent busy={saving} className={styles.contentBody}>
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
                <SkeletonItem size={16} className={styles.skeletonSub140} />
                <div className={styles.fieldColumnFlex}>
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                </div>
              </Skeleton>
            </Card>
          </div>
        </D365FormContent>
      ) : (
        <D365FormContent busy={saving} className={styles.contentBody}>
          {/* TAB 1: DETALLES DEL PRODUCTO (GENERAL) */}
          {selectedTab === 'detalles' && (
            <div className={styles.grid2Cols}>
              {/* Sección Izquierda: DETALLES DEL PRODUCTO */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>Detalles del Producto</Text>

                {/* Nombre (Obligatorio) */}
                <D365FormField label="Nombre" required htmlFor="prod-nombre" error={errors.nombre}>
                  <Input
                    id="prod-nombre"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.nombre}
                    onChange={(_, data) => {
                      setFormData({ ...formData, nombre: data.value });
                      if (errors.nombre && data.value.trim()) {
                        setErrors((prev) => ({ ...prev, nombre: '' }));
                      }
                    }}
                  />
                </D365FormField>

                {/* Código / Product ID (Obligatorio) */}
                <D365FormField label="ID de Producto" required htmlFor="prod-codigo" error={errors.codigo}>
                  <Input
                    id="prod-codigo"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.codigo}
                    appearance={isEditMode ? 'filled-darker' : 'outline'}
                    readOnly={isEditMode}
                    contentAfter={isEditMode ? (
                      <LockClosed16Regular title="Campo de solo lectura" aria-label="Campo de solo lectura" />
                    ) : undefined}
                    onChange={(_, data) => {
                      const val = data.value.toUpperCase();
                      setFormData({ ...formData, codigo: val });
                      if (errors.codigo && val.trim()) {
                        setErrors((prev) => ({ ...prev, codigo: '' }));
                      }
                    }}
                  />
                </D365FormField>


                {/* Categoría (TagPicker Estilo Dynamics 365 con Quick Create) */}
                <D365FormField label="Categoría" htmlFor="prod-categoria">
                  <LookupDropdownWithQuickCreate
                    idEntrada="prod-categoria"
                    etiquetaGrupo="Categorías"
                    opciones={categoriasList.map((categoria) => ({
                      id: categoria.id,
                      nombre: categoria.nombre,
                      detalle: categoria.categoriaPadreNombre
                        ? `Padre: ${categoria.categoriaPadreNombre}`
                        : null,
                    }))}
                    seleccionada={categoriaSeleccionadaObj ? {
                      id: categoriaSeleccionadaObj.id,
                      nombre: categoriaSeleccionadaObj.nombre,
                    } : null}
                    textoBusqueda={categoriaQuery}
                    alCambiarBusqueda={setCategoriaQuery}
                    alSeleccionar={(id) => setFormData((prev) => ({
                      ...prev,
                      categoriaProductoId: id,
                    }))}
                    alNavegar={(id) => window.open(`/servicio-campo/categorias-producto/${id}`, '_blank')}
                    icono={<Folder16Regular className={styles.categoryIcon} />}
                    textoVacio="No se encontraron categorías"
                    tituloEnlace="Ver detalles de la categoría"
                    renderizarCreacionRapida={({ abierto, nombreInicial, cerrar }) => (
                      <CrearCategoriaDrawer
                        abierto={abierto}
                        nombreInicial={nombreInicial}
                        alCerrar={cerrar}
                        alGuardar={(categoriaCreada) => {
                          setCategoriasList((actual) => [
                            categoriaCreada,
                            ...actual.filter((categoria) => categoria.id !== categoriaCreada.id),
                          ]);
                          setFormData((actual) => ({ ...actual, categoriaProductoId: categoriaCreada.id }));
                        }}
                      />
                    )}
                  />
                </D365FormField>

                {/* Control Serializado */}
                <D365FormField label="Es Serializado" htmlFor="prod-serializado">
                  <div className={styles.fieldRowFlex}>
                    <Switch
                      id="prod-serializado"
                      disabled={tieneMovimientos}
                      checked={formData.esSerializado || false}
                      onChange={(_, data) =>
                        setFormData({ ...formData, esSerializado: data.checked })
                      }
                    />
                    <Text size={200} className={styles.fieldHint}>
                      {formData.esSerializado ? 'Sí' : 'No'}
                    </Text>
                  </div>
                </D365FormField>

                {/* Descripción */}
                <D365FormField label="Descripción" htmlFor="prod-descripcion" align="top">
                  <Textarea
                    id="prod-descripcion"
                    appearance="outline"
                    size="medium"
                    rows={3}
                    className={styles.d365ControlFull}
                    value={formData.descripcion || ''}
                    onChange={(_, data) => setFormData({ ...formData, descripcion: data.value })}
                  />
                </D365FormField>
              </Card>

              {/* Sección Derecha: UNIDADES Y LISTA DE PRECIOS */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>Unidades y Lista de Precios</Text>

                {/* Unidad de Medida (Obligatorio) */}
                <D365FormField
                  label="Unidad Predeterminada"
                  required={formData.tipo === 'Inventario' || formData.tipo === 1}
                  htmlFor="prod-unidad"
                  error={errors.unidadMedida}
                  info={tieneMovimientos ? "Bloqueado por trazabilidad: el producto ya registra movimientos o stock en almacén." : undefined}
                >
                  <LookupDropdownWithQuickCreate
                    idEntrada="prod-unidad"
                    deshabilitado={tieneMovimientos}
                    etiquetaGrupo="Unidades"
                    opciones={unidadesList.map((unidad) => ({
                      id: unidad.id,
                      nombre: unidad.nombre,
                      detalle: unidad.nombreGrupo,
                    }))}
                    seleccionada={unidadSeleccionadaObj || null}
                    textoBusqueda={unidadQuery}
                    alCambiarBusqueda={setUnidadQuery}
                    alSeleccionar={(id) => {
                      setFormData((prev) => ({
                        ...prev,
                        grupoUnidadMedidaId: unidadesList.find((unidad) => unidad.id === id)?.grupoUnidadMedidaId ?? null,
                        unidadMedidaDefectoId: id,
                      }));
                      if (errors.unidadMedida) setErrors((prev) => ({ ...prev, unidadMedida: '' }));
                    }}
                    alNavegar={(id) => window.open(`/servicio-campo/unidades-medida/${id}`, '_blank')}
                    icono={<Cube16Regular className={styles.unitIcon} />}
                    textoVacio="No se encontraron unidades"
                    tituloEnlace="Ver detalles de la unidad de medida"
                    renderizarCreacionRapida={({ abierto, nombreInicial, cerrar }) => {
                      const grupoSeleccionado = gruposUnidadList.find(
                        (grupo) => grupo.id === formData.grupoUnidadMedidaId,
                      );
                      return (
                        <CrearUnidadDrawer
                          abierto={abierto}
                          grupoId={grupoSeleccionado?.id}
                          nombreGrupo={grupoSeleccionado?.nombre}
                          nombreUnidadRaiz={grupoSeleccionado?.unidades.find((unidad) => unidad.esUnidadBase)?.nombre}
                          gruposDisponibles={gruposUnidadList}
                          nombreInicial={nombreInicial}
                          alCerrar={cerrar}
                          alGuardar={(unidadCreada) => {
                            setUnidadesList((actual) => [
                              unidadCreada,
                              ...actual.filter((unidad) => unidad.id !== unidadCreada.id),
                            ]);
                            setFormData((actual) => ({
                              ...actual,
                              grupoUnidadMedidaId: unidadCreada.grupoUnidadMedidaId,
                              unidadMedidaDefectoId: unidadCreada.id,
                            }));
                            setErrors((actual) => ({ ...actual, unidadMedida: '' }));
                          }}
                        />
                      );
                    }}
                  />
                </D365FormField>

                <D365FormField
                  label="Decimales de cantidad"
                  htmlFor="prod-decimales-cantidad"
                  error={errors.decimalesCantidad}
                  info={tieneMovimientos ? "Bloqueado por trazabilidad: el producto ya registra movimientos o stock en almacén." : undefined}
                >
                    <Input
                      id="prod-decimales-cantidad"
                      disabled={tieneMovimientos}
                      type="number"
                      min={0}
                      max={5}
                      step={1}
                      value={String(formData.decimalesCantidad ?? 0)}
                      onChange={(_, data) => {
                        const value = Number.parseInt(data.value, 10);
                        setFormData((prev) => ({
                          ...prev,
                          decimalesCantidad: Number.isNaN(value) ? 0 : value,
                        }));
                      }}
                    />
                </D365FormField>

                {/* Lista de Precios Predeterminada (TagPicker Estilo Dynamics 365) */}
                <D365FormField label="Lista de Precios Predeterminada" htmlFor="prod-lista-precios">
                  <LookupDropdownWithQuickCreate
                    idEntrada="prod-lista-precios"
                    etiquetaGrupo="Listas de Precios"
                    opciones={listasPreciosList.map((lista) => ({
                      id: lista.id,
                      nombre: lista.nombre,
                      detalle: lista.moneda,
                    }))}
                    seleccionada={listaPreciosSeleccionadaObj ? {
                      id: listaPreciosSeleccionadaObj.id,
                      nombre: `${listaPreciosSeleccionadaObj.nombre} (${listaPreciosSeleccionadaObj.moneda})`,
                    } : null}
                    textoBusqueda={listaPreciosQuery}
                    alCambiarBusqueda={setListaPreciosQuery}
                    alSeleccionar={(id) => setFormData((prev) => ({
                      ...prev,
                      listaPreciosPredeterminadaId: id,
                    }))}
                    alNavegar={(id) => window.open(`/servicio-campo/listas-precios/${id}`, '_blank')}
                    icono={<Money16Regular className={styles.iconBrand} />}
                    textoVacio="No se encontraron listas de precios"
                    tituloEnlace="Ver detalles de la lista de precios"
                    renderizarCreacionRapida={({ abierto, nombreInicial, cerrar }) => (
                      <CrearListaPreciosDrawer
                        abierto={abierto}
                        nombreInicial={nombreInicial}
                        alCerrar={cerrar}
                        alGuardar={(listaCreada) => {
                          setListasPreciosList((actual) => [
                            listaCreada,
                            ...actual.filter((lista) => lista.id !== listaCreada.id),
                          ]);
                          setFormData((actual) => ({
                            ...actual,
                            listaPreciosPredeterminadaId: listaCreada.id,
                          }));
                        }}
                      />
                    )}
                  />
                </D365FormField>

                {/* Afecto a Impuestos */}
                <D365FormField label="Afecto a Impuestos (IGV)" htmlFor="prod-afecto-impuesto">
                  <div className={styles.fieldRowFlex}>
                    <Switch
                      id="prod-afecto-impuesto"
                      checked={formData.afectoImpuesto !== false}
                      onChange={(_, data) =>
                        setFormData({ ...formData, afectoImpuesto: data.checked })
                      }
                    />
                    <Text size={200} className={styles.fieldHint}>
                      {formData.afectoImpuesto !== false ? 'Sí' : 'No'}
                    </Text>
                  </div>
                </D365FormField>
              </Card>
            </div>
          )}

          {/* TAB 2: FIELD SERVICE */}
          {selectedTab === 'field-service' && (
            <div className={styles.grid2Cols}>
              {/* Sección Izquierda: GENERAL FIELD SERVICE */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>General</Text>

                <D365FormField label="Tipo" htmlFor="prod-tipo-fs">
                  <Select
                    id="prod-tipo-fs"
                    appearance="outline"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.tipo as string}
                    onChange={(_, data) =>
                      setFormData({ ...formData, tipo: data.value as TipoProducto })
                    }
                  >
                    <option value="Inventario">Inventario</option>
                    <option value="NoInventario">No inventario</option>
                    <option value="Servicio">Servicio</option>
                  </Select>
                </D365FormField>

                {/* Precio de Lista (Field Service) */}
                <D365FormField label="Precio de Lista" htmlFor="prod-precio">
                  <Input
                    id="prod-precio"
                    type="number"
                    step="0.01"
                    min="0"
                    appearance="outline"
                    size="medium"
                    contentBefore="S/."
                    className={styles.d365ControlFull}
                    value={precioBaseStr}
                    onChange={(_, data) => {
                      setPrecioBaseStr(data.value);
                      const val = parseFloat(data.value);
                      setFormData((prev) => ({ ...prev, precioBase: isNaN(val) ? 0 : val }));
                    }}
                  />
                </D365FormField>

                {/* Código de Barras / UPC */}
                <D365FormField label="Código UPC / Barras" htmlFor="prod-upc">
                  <Input
                    id="prod-upc"
                    appearance="outline"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.codigoBarras || ''}
                    onChange={(_, data) => setFormData({ ...formData, codigoBarras: data.value })}
                  />
                </D365FormField>
              </Card>

              {/* Sección Derecha: COSTOS Y PROVEEDOR */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>Costos y Proveedor</Text>

                {/* Proveedor Habitual con TagPicker / SelectorEntidadRelacionada */}
                <D365FormField
                  label="Proveedor Habitual"
                  htmlFor="prod-proveedor"
                  info="Seleccione la cuenta jurídica del proveedor habitual o ingrese uno nuevo."
                >
                  <SelectorEntidadRelacionada
                    idEntrada="prod-proveedor"
                    etiquetaGrupo="Proveedores y Cuentas"
                    opciones={opcionesProveedores}
                    seleccionada={proveedorSeleccionadoObj}
                    textoBusqueda={proveedorQuery}
                    alCambiarBusqueda={setProveedorQuery}
                    alSeleccionar={(id) => {
                      if (id && id !== 'manual') {
                        const c = cuentasList.find((x) => x.id === id);
                        setFormData((prev) => ({
                          ...prev,
                          proveedorDefecto: c?.razonSocial || c?.nombreCompletoODenominacion || '',
                        }));
                      } else {
                        setFormData((prev) => ({ ...prev, proveedorDefecto: '' }));
                      }
                    }}
                    alCrearNuevo={(nombre) => {
                      setFormData((prev) => ({ ...prev, proveedorDefecto: nombre }));
                    }}
                    alNavegar={(id) => {
                      if (id && id !== 'manual') {
                        window.open(`/servicio-campo/cuentas/${id}`, '_blank');
                      }
                    }}
                    icono={<Building16Regular />}
                    textoVacio="No se encontraron proveedores"
                    tituloEnlace="Ver ficha del proveedor"
                  />
                </D365FormField>

                {/* Costo Actual */}
                <D365FormField label="Costo Actual" htmlFor="prod-costo-actual">
                  <Input
                    id="prod-costo-actual"
                    type="number"
                    step="0.01"
                    min="0"
                    appearance="outline"
                    size="medium"
                    contentBefore="S/."
                    className={styles.d365ControlFull}
                    value={costoActualStr}
                    onChange={(_, data) => {
                      setCostoActualStr(data.value);
                      const val = parseFloat(data.value);
                      setFormData((prev) => ({ ...prev, costoActual: isNaN(val) ? 0 : val }));
                    }}
                  />
                </D365FormField>

                {/* Costo Estándar */}
                <D365FormField label="Costo Estándar" htmlFor="prod-costo-estandar">
                  <Input
                    id="prod-costo-estandar"
                    type="number"
                    step="0.01"
                    min="0"
                    appearance="outline"
                    size="medium"
                    contentBefore="S/."
                    className={styles.d365ControlFull}
                    value={costoEstandarStr}
                    onChange={(_, data) => {
                      setCostoEstandarStr(data.value);
                      const val = parseFloat(data.value);
                      setFormData((prev) => ({ ...prev, costoEstandar: isNaN(val) ? 0 : val }));
                    }}
                  />
                </D365FormField>
              </Card>
            </div>
          )}

          {/* TAB 3: NOTAS */}
          {selectedTab === 'notas' && (
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Notas</Text>

              <D365FormField label="Notas e Instrucciones" htmlFor="prod-notas" align="top">
                <Textarea
                  id="prod-notas"
                  appearance="outline"
                  size="medium"
                  rows={8}
                  className={styles.d365ControlFull}
                  value={formData.notas || ''}
                  onChange={(_, data) => setFormData({ ...formData, notas: data.value })}
                />
              </D365FormField>
            </Card>
          )}
        </D365FormContent>
      )}

    </div>
  );
};

export default ProductoFormPage;
