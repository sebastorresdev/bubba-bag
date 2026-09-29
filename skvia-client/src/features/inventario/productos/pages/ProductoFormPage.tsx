import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Textarea,
  Select,
  Switch,
  TabList,
  Tab,
  Card,
  Text,
  Label,
  Skeleton,
  SkeletonItem,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  TagPickerOptionGroup,
  Tag,
  Link,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  type TagPickerProps,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  Box16Regular,
  Wrench16Regular,
  DocumentText16Regular,
  Cube16Regular,
  Folder16Regular,
  Money16Regular,
} from '@fluentui/react-icons';
import { ProductoService } from '../services/producto.service';
import type { CreateProductoDto, TipoProducto } from '../types/producto.types';
import { CategoriaService } from '../../categorias/services/categoria.service';
import type { CategoriaProductoDto } from '../../categorias/types/categoria.types';
import { UnidadMedidaService } from '../../unidades-medida/services/unidadMedida.service';
import type { UnidadMedidaDto } from '../../unidades-medida/types/unidadMedida.types';
import { ListaPreciosService } from '../../listas-precios/services/listaPrecios.service';
import type { ListaPreciosDto } from '../../listas-precios/types/listaPrecios.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';

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
    categoria: '', // Opcional
    unidadMedida: 'Unidades',
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
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Catálogos dinámicos
  const [categoriasList, setCategoriasList] = useState<CategoriaProductoDto[]>([]);
  const [unidadesList, setUnidadesList] = useState<UnidadMedidaDto[]>([]);
  const [listasPreciosList, setListasPreciosList] = useState<ListaPreciosDto[]>([]);

  const cargarCatalogos = useCallback(() => {
    CategoriaService.getCategorias(undefined, true)
      .then((cats) => setCategoriasList(cats))
      .catch((err) => console.error('Error al cargar catálogo de categorías:', err));

    UnidadMedidaService.getUnidadesMedida(undefined, true)
      .then((ums) => setUnidadesList(ums))
      .catch((err) => console.error('Error al cargar catálogo de unidades de medida:', err));

    ListaPreciosService.getListasPrecios(undefined, true)
      .then((lps) => setListasPreciosList(lps))
      .catch((err) => console.error('Error al cargar listas de precios:', err));
  }, []);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  // Estado y lógica para TagPicker de Unidad de Medida (Estilo Dynamics 365)
  const [unidadQuery, setUnidadQuery] = useState('');
  const [quickCreateUnidadOpen, setQuickCreateUnidadOpen] = useState(false);
  const [quickUnidadData, setQuickUnidadData] = useState({
    nombre: '',
    codigo: '',
    abreviatura: '',
  });
  const [quickUnidadError, setQuickUnidadError] = useState('');
  const [quickUnidadSaving, setQuickUnidadSaving] = useState(false);

  const filteredUnidades = useMemo(() => {
    const q = unidadQuery.trim().toLowerCase();
    if (!q) return unidadesList;
    return unidadesList.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        (u.codigo && u.codigo.toLowerCase().includes(q)) ||
        (u.abreviatura && u.abreviatura.toLowerCase().includes(q))
    );
  }, [unidadesList, unidadQuery]);

  const selectedUnidadOptions = useMemo(
    () => (formData.unidadMedida ? [formData.unidadMedida] : []),
    [formData.unidadMedida]
  );

  const onUnidadOptionSelect: TagPickerProps['onOptionSelect'] = (_e, data) => {
    setFormData((prev) => ({
      ...prev,
      unidadMedida: prev.unidadMedida === data.value ? '' : data.value,
    }));
    setUnidadQuery('');
    if (errors.unidadMedida) {
      setErrors((prev) => ({ ...prev, unidadMedida: '' }));
    }
  };

  // Estado y lógica para TagPicker de Categoría (Estilo Dynamics 365)
  const [categoriaQuery, setCategoriaQuery] = useState('');
  const [quickCreateCatOpen, setQuickCreateCatOpen] = useState(false);
  const [quickCatData, setQuickCatData] = useState({
    nombre: '',
    descripcion: '',
  });
  const [quickCatError, setQuickCatError] = useState('');
  const [quickCatSaving, setQuickCatSaving] = useState(false);

  const categoriaSeleccionadaObj = useMemo(
    () => categoriasList.find((c) => c.nombre === formData.categoria),
    [categoriasList, formData.categoria]
  );

  const selectedCategoriaOptions = useMemo(
    () => (formData.categoria ? [formData.categoria] : []),
    [formData.categoria]
  );

  const filteredCategoriasList = useMemo(() => {
    const q = categoriaQuery.trim().toLowerCase();
    if (!q) return categoriasList;
    return categoriasList.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.categoriaPadreNombre && c.categoriaPadreNombre.toLowerCase().includes(q))
    );
  }, [categoriasList, categoriaQuery]);

  const onCategoriaOptionSelect: TagPickerProps['onOptionSelect'] = (_e, data) => {
    setFormData((prev) => ({
      ...prev,
      categoria: prev.categoria === data.value ? '' : data.value,
    }));
    setCategoriaQuery('');
  };

  // Estado y lógica para TagPicker de Lista de Precios Predeterminada (Estilo Dynamics 365)
  const [listaPreciosQuery, setListaPreciosQuery] = useState('');

  const listaPreciosSeleccionadaObj = useMemo(
    () => listasPreciosList.find((lp) => lp.id === formData.listaPreciosPredeterminadaId),
    [listasPreciosList, formData.listaPreciosPredeterminadaId]
  );

  const selectedListaPreciosOptions = useMemo(
    () => (formData.listaPreciosPredeterminadaId ? [formData.listaPreciosPredeterminadaId] : []),
    [formData.listaPreciosPredeterminadaId]
  );

  const filteredListasPrecios = useMemo(() => {
    const q = listaPreciosQuery.trim().toLowerCase();
    if (!q) return listasPreciosList;
    return listasPreciosList.filter(
      (lp) =>
        lp.nombre.toLowerCase().includes(q) ||
        (lp.moneda && lp.moneda.toLowerCase().includes(q))
    );
  }, [listasPreciosList, listaPreciosQuery]);

  const onListaPreciosOptionSelect: TagPickerProps['onOptionSelect'] = (_e, data) => {
    setFormData((prev) => ({
      ...prev,
      listaPreciosPredeterminadaId: prev.listaPreciosPredeterminadaId === data.value ? null : data.value,
    }));
    setListaPreciosQuery('');
  };

  const handleGuardarCategoriaRapida = async () => {
    if (!quickCatData.nombre.trim()) {
      setQuickCatError('El nombre de la categoría es obligatorio.');
      return;
    }
    try {
      setQuickCatSaving(true);
      setQuickCatError('');
      await CategoriaService.createCategoria({
        nombre: quickCatData.nombre.trim(),
        categoriaPadreId: null,
        descripcion: quickCatData.descripcion.trim() || null,
      });
      await cargarCatalogos();
      setFormData((prev) => ({ ...prev, categoria: quickCatData.nombre.trim() }));
      setQuickCreateCatOpen(false);
      setQuickCatData({ nombre: '', descripcion: '' });
    } catch (err: any) {
      setQuickCatError(err?.message || 'Error al crear la categoría.');
    } finally {
      setQuickCatSaving(false);
    }
  };

  const handleGuardarUnidadRapida = async () => {
    if (!quickUnidadData.nombre.trim() || !quickUnidadData.codigo.trim() || !quickUnidadData.abreviatura.trim()) {
      setQuickUnidadError('Nombre, código y abreviatura son obligatorios.');
      return;
    }
    try {
      setQuickUnidadSaving(true);
      setQuickUnidadError('');
      await UnidadMedidaService.createUnidadMedida({
        nombre: quickUnidadData.nombre.trim(),
        codigo: quickUnidadData.codigo.trim().toUpperCase(),
        abreviatura: quickUnidadData.abreviatura.trim(),
      });
      cargarCatalogos();
      setFormData((prev) => ({ ...prev, unidadMedida: quickUnidadData.nombre.trim() }));
      setQuickCreateUnidadOpen(false);
      setQuickUnidadData({
        nombre: '',
        codigo: '',
        abreviatura: '',
      });
      if (errors.unidadMedida) {
        setErrors((prev) => ({ ...prev, unidadMedida: '' }));
      }
    } catch (err: any) {
      setQuickUnidadError(err?.message || 'Error al crear la unidad de medida.');
    } finally {
      setQuickUnidadSaving(false);
    }
  };

  // Cargar producto si estamos en modo edición
  useEffect(() => {
    if (effectiveId) {
      setCurrentId(effectiveId);
      setLoading(true);
      ProductoService.getProductoById(effectiveId)
        .then((p) => {
          setFormData({
            codigo: p.codigo,
            nombre: p.nombre,
            tipo: p.tipo,
            categoria: p.categoria || '',
            unidadMedida: p.unidadMedida,
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
          const tipoStr =
            p.tipo === 1 || p.tipo === 'Inventario'
              ? 'Inventario'
              : p.tipo === 2 || p.tipo === 'Servicio'
                ? 'Servicio'
                : p.tipo === 3 || p.tipo === 'NoInventariable'
                  ? 'NoInventariable'
                  : String(p.tipo || 'Inventario');

          setSavedHeader({
            nombre: p.nombre,
            codigo: p.codigo,
            tipo: tipoStr,
            activo: p.activo,
          });
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
    const decimalesCantidad = formData.decimalesCantidad ?? 0;
    if (!Number.isInteger(decimalesCantidad) || decimalesCantidad < 0 || decimalesCantidad > 5) {
      newErrors.decimalesCantidad = 'Indica un número entero entre 0 y 5.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfter: boolean) => {
    if (!validate()) {
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
          categoria: formData.categoria || '',
          unidadMedida: formData.unidadMedida,
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
        setStatusMessage({ type: 'success', text: `Producto "${formData.nombre}" actualizado exitosamente.` });
      } else {
        const res = await ProductoService.createProducto(formData);
        savedId = res.id;
        setCurrentId(res.id);
        setStatusMessage({ type: 'success', text: `Producto "${formData.nombre}" creado exitosamente.` });
        if (!closeAfter) {
          navigate(`/servicio-campo/productos/${res.id}`, { replace: true });
        }
      }

      // Solo aquí actualizamos los textos y avatar de la cabecera
      setSavedHeader({
        nombre: formData.nombre,
        codigo: formData.codigo,
        tipo: String(formData.tipo || 'Inventario'),
        activo: true,
      });

      if (closeAfter) {
        setTimeout(() => {
          if (propOnSaved) propOnSaved(savedId || '');
          if (propOnCreated) propOnCreated(savedId || '');
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
      categoria: '',
      unidadMedida: 'Unidades',
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
            <Tab value="detalles" icon={<Box16Regular />}>Detalles del Producto</Tab>
            <Tab value="field-service" icon={<Wrench16Regular />}>Servicio de Campo</Tab>
            <Tab value="notas" icon={<DocumentText16Regular />}>Notas</Tab>
          </TabList>
        )}
      />

      {/* 3. D365 FORM SECTIONS (Ocupando de izquierda a derecha sin centrado) */}
      {loading ? (
        <div className={styles.contentBody}>
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
        </div>
      ) : (
        <div className={styles.contentBody}>
          {/* TAB 1: DETALLES DEL PRODUCTO (GENERAL) */}
          {selectedTab === 'detalles' && (
            <div className={styles.grid2Cols}>
              {/* Sección Izquierda: DETALLES DEL PRODUCTO */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>Detalles del Producto</Text>

                {/* Nombre (Obligatorio) */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label required size="medium" htmlFor="prod-nombre">
                      Nombre
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <Input
                      id="prod-nombre"
                      appearance="outline"
                      size="medium"
                      className={styles.d365ControlFull}
                      value={formData.nombre}
                      placeholder="Ej: Universal Network Card"
                      onChange={(_, data) => {
                        setFormData({ ...formData, nombre: data.value });
                        if (errors.nombre && data.value.trim()) {
                          setErrors((prev) => ({ ...prev, nombre: '' }));
                        }
                      }}
                    />
                    {errors.nombre && <Text size={100} className={styles.fieldErrorText}>{errors.nombre}</Text>}
                  </div>
                </div>

                {/* Código / Product ID (Obligatorio) */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label required size="medium" htmlFor="prod-codigo">
                      ID de Producto
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <Input
                      id="prod-codigo"
                      appearance="outline"
                      size="medium"
                      className={styles.d365ControlFull}
                      value={formData.codigo}
                      placeholder="Ej: CMPNTNetworkCard, CBL-RG6"
                      disabled={isEditMode}
                      onChange={(_, data) => {
                        const val = data.value.toUpperCase();
                        setFormData({ ...formData, codigo: val });
                        if (errors.codigo && val.trim()) {
                          setErrors((prev) => ({ ...prev, codigo: '' }));
                        }
                      }}
                    />
                    {errors.codigo && <Text size={100} className={styles.fieldErrorText}>{errors.codigo}</Text>}
                  </div>
                </div>


                {/* Categoría (TagPicker Estilo Dynamics 365 con Quick Create) */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium">
                      Categoría
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <TagPicker
                      onOptionSelect={onCategoriaOptionSelect}
                      selectedOptions={selectedCategoriaOptions}
                    >
                      <TagPickerControl className={styles.tagPickerControl}>
                        {formData.categoria && (
                          <TagPickerGroup className={styles.tagPickerGroup} aria-label="Categoría seleccionada">
                            <Tag
                              key={formData.categoria}
                              shape="rounded"
                              size="small"
                              media={<Folder16Regular className={styles.categoryIcon} />}
                              value={formData.categoria}
                            >
                              <Link
                                as="span"
                                className={styles.primaryLink}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (categoriaSeleccionadaObj) {
                                    window.open(
                                      `/servicio-campo/categorias-producto/${categoriaSeleccionadaObj.id}`,
                                      '_blank'
                                    );
                                  }
                                }}
                                title="Ver detalles de la categoría"
                              >
                                {formData.categoria}
                              </Link>
                            </Tag>
                          </TagPickerGroup>
                        )}
                        <TagPickerInput
                          id="prod-categoria"
                          className={styles.tagPickerInput}
                          value={categoriaQuery}
                          onChange={(e) => setCategoriaQuery(e.target.value)}
                          placeholder={formData.categoria ? '' : 'Buscar categoría'}
                          clearable
                        />
                      </TagPickerControl>
                      <TagPickerList>
                        <TagPickerOptionGroup label="Categorías">
                          {filteredCategoriasList
                            .filter((c) => c.nombre !== formData.categoria)
                            .map((c) => (
                              <TagPickerOption
                                key={c.id}
                                value={c.nombre}
                                media={<Folder16Regular className={styles.categoryIcon} />}
                                secondaryContent={
                                  c.categoriaPadreNombre ? (
                                    <Text size={100} className={styles.secondaryOptionText}>
                                      Padre: {c.categoriaPadreNombre}
                                    </Text>
                                  ) : undefined
                                }
                              >
                                {c.nombre}
                              </TagPickerOption>
                            ))}
                        </TagPickerOptionGroup>
                        <div className={styles.quickCreateFooter}>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Add16Regular />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickCreateCatOpen(true);
                            }}
                          >
                            Nuevo
                          </Button>
                        </div>
                      </TagPickerList>
                    </TagPicker>
                  </div>
                </div>

                {/* Control Serializado */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium">Es Serializado</Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <div className={styles.fieldRowFlex}>
                      <Switch
                        checked={formData.esSerializado || false}
                        onChange={(_, data) =>
                          setFormData({ ...formData, esSerializado: data.checked })
                        }
                      />
                      <Text size={200} className={styles.fieldHint}>
                        {formData.esSerializado ? 'Sí (Exige serie/MAC individual)' : 'No'}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className={styles.d365FieldRowTop}>
                  <div className={styles.d365LabelColTop}>
                    <Label size="medium" htmlFor="prod-descripcion">
                      Descripción
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <Textarea
                      id="prod-descripcion"
                      appearance="outline"
                      size="medium"
                      rows={3}
                      className={styles.d365ControlFull}
                      value={formData.descripcion || ''}
                      placeholder="Descripción comercial para cotizaciones y órdenes de trabajo..."
                      onChange={(_, data) => setFormData({ ...formData, descripcion: data.value })}
                    />
                  </div>
                </div>
              </Card>

              {/* Sección Derecha: UNIDADES Y LISTA DE PRECIOS */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>Unidades y Lista de Precios</Text>

                {/* Unidad de Medida (Obligatorio) */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label required size="medium">
                      Unidad Predeterminada
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <TagPicker
                      onOptionSelect={onUnidadOptionSelect}
                      selectedOptions={selectedUnidadOptions}
                    >
                      <TagPickerControl className={styles.tagPickerControl}>
                        {formData.unidadMedida && (
                          <TagPickerGroup className={styles.tagPickerGroup} aria-label="Unidad seleccionada">
                            <Tag
                              key={formData.unidadMedida}
                              shape="rounded"
                              size="small"
                              media={<Cube16Regular className={styles.unitIcon} />}
                              value={formData.unidadMedida}
                            >
                              <Link
                                as="span"
                                className={styles.primaryLink}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const foundUnit = unidadesList.find(
                                    (u) => u.nombre === formData.unidadMedida
                                  );
                                  if (foundUnit) {
                                    window.open(
                                      `/servicio-campo/unidades-medida/${foundUnit.id}`,
                                      '_blank'
                                    );
                                  }
                                }}
                                title="Ver detalles de la unidad de medida"
                              >
                                {formData.unidadMedida}
                              </Link>
                            </Tag>
                          </TagPickerGroup>
                        )}
                        <TagPickerInput
                          id="prod-unidad"
                          className={styles.tagPickerInput}
                          value={unidadQuery}
                          onChange={(e) => setUnidadQuery(e.target.value)}
                          placeholder={formData.unidadMedida ? '' : 'Buscar Unidad predeterminada'}
                          clearable
                        />
                      </TagPickerControl>
                      <TagPickerList>
                        <TagPickerOptionGroup label="Unidades">
                          {filteredUnidades
                            .filter((u) => u.nombre !== formData.unidadMedida)
                            .map((u) => (
                              <TagPickerOption
                                key={u.id}
                                value={u.nombre}
                                media={<Cube16Regular className={styles.unitIcon} />}
                                secondaryContent={u.codigo ? `(${u.codigo})` : undefined}
                              >
                                {u.nombre}
                              </TagPickerOption>
                            ))}
                        </TagPickerOptionGroup>
                        <div className={styles.quickCreateFooter}>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Add16Regular />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickCreateUnidadOpen(true);
                            }}
                          >
                            Nuevo
                          </Button>
                        </div>
                      </TagPickerList>
                    </TagPicker>
                    {errors.unidadMedida && (
                      <Text size={100} className={styles.fieldErrorText}>{errors.unidadMedida}</Text>
                    )}
                  </div>
                </div>

                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium" htmlFor="prod-decimales-cantidad">
                      Decimales de cantidad
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <Input
                      id="prod-decimales-cantidad"
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
                    <Text size={200} className={styles.fieldHint}>
                      Cifras decimales permitidas para este producto: 0 para cantidades enteras, 2 para cantidades como 1.25.
                    </Text>
                    {errors.decimalesCantidad && (
                      <Text size={100} className={styles.fieldErrorText}>{errors.decimalesCantidad}</Text>
                    )}
                  </div>
                </div>

                {/* Lista de Precios Predeterminada (TagPicker Estilo Dynamics 365) */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium">
                      Lista de Precios Predeterminada
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <TagPicker
                      onOptionSelect={onListaPreciosOptionSelect}
                      selectedOptions={selectedListaPreciosOptions}
                    >
                      <TagPickerControl className={styles.tagPickerControl}>
                        {listaPreciosSeleccionadaObj && (
                          <TagPickerGroup className={styles.tagPickerGroup} aria-label="Lista de precios seleccionada">
                            <Tag
                              key={listaPreciosSeleccionadaObj.id}
                              shape="rounded"
                              size="small"
                              media={<Money16Regular className={styles.iconBrand} />}
                              value={listaPreciosSeleccionadaObj.id}
                            >
                              <Link
                                as="span"
                                className={styles.primaryLink}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    `/servicio-campo/listas-precios/${listaPreciosSeleccionadaObj.id}`,
                                    '_blank'
                                  );
                                }}
                                title="Ver detalles de la lista de precios"
                              >
                                {listaPreciosSeleccionadaObj.nombre} ({listaPreciosSeleccionadaObj.moneda})
                              </Link>
                            </Tag>
                          </TagPickerGroup>
                        )}
                        <TagPickerInput
                          id="prod-lista-precios"
                          className={styles.tagPickerInput}
                          value={listaPreciosQuery}
                          onChange={(e) => setListaPreciosQuery(e.target.value)}
                          placeholder={formData.listaPreciosPredeterminadaId ? '' : 'Buscar lista de precios predeterminada...'}
                          clearable
                        />
                      </TagPickerControl>
                      <TagPickerList>
                        <TagPickerOptionGroup label="Listas de Precios">
                          {filteredListasPrecios
                            .filter((lp) => lp.id !== formData.listaPreciosPredeterminadaId)
                            .map((lp) => (
                              <TagPickerOption
                                key={lp.id}
                                value={lp.id}
                                media={<Money16Regular className={styles.iconBrand} />}
                                secondaryContent={lp.moneda}
                              >
                                {lp.nombre}
                              </TagPickerOption>
                            ))}
                        </TagPickerOptionGroup>
                        <div className={styles.quickCreateFooter}>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Add16Regular />}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open('/servicio-campo/listas-precios/nuevo', '_blank');
                            }}
                          >
                            Nueva Lista de Precios
                          </Button>
                        </div>
                      </TagPickerList>
                    </TagPicker>
                  </div>
                </div>

                {/* Afecto a Impuestos */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium">Afecto a Impuestos (IGV)</Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <div className={styles.fieldRowFlex}>
                      <Switch
                        checked={formData.afectoImpuesto !== false}
                        onChange={(_, data) =>
                          setFormData({ ...formData, afectoImpuesto: data.checked })
                        }
                      />
                      <Text size={200} className={styles.fieldHint}>
                        {formData.afectoImpuesto !== false ? 'Sí (Afecto a IGV)' : 'No (Exonerado)'}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: FIELD SERVICE */}
          {selectedTab === 'field-service' && (
            <div className={styles.grid2Cols}>
              {/* Sección Izquierda: GENERAL FIELD SERVICE */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>General</Text>

                {/* Tipo de Producto de Field Service */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium" htmlFor="prod-tipo-fs">
                      Tipo de Producto
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
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
                      <option value="Inventario">Inventario (Almacenable y cuantificable)</option>
                      <option value="Servicio">Servicio (Mano de obra o trabajo técnico)</option>
                      <option value="NoInventariable">No Inventariable (Insumo o gasto fungible)</option>
                    </Select>
                  </div>
                </div>

                {/* Precio de Lista (Field Service) */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium" htmlFor="prod-precio">
                      Precio de Lista
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
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
                      placeholder="0.00 (Precio base si no está en lista de precios)"
                      onChange={(_, data) => {
                        setPrecioBaseStr(data.value);
                        const val = parseFloat(data.value);
                        setFormData((prev) => ({ ...prev, precioBase: isNaN(val) ? 0 : val }));
                      }}
                    />
                  </div>
                </div>

                {/* Código de Barras / UPC */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium" htmlFor="prod-upc">
                      Código UPC / Barras
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <Input
                      id="prod-upc"
                      appearance="outline"
                      size="medium"
                      className={styles.d365ControlFull}
                      value={formData.codigoBarras || ''}
                      placeholder="Código UPC / EAN para lector láser o cámara..."
                      onChange={(_, data) => setFormData({ ...formData, codigoBarras: data.value })}
                    />
                  </div>
                </div>
              </Card>

              {/* Sección Derecha: COSTOS Y PROVEEDOR */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>Costos y Proveedor</Text>

                {/* Proveedor por Defecto */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium" htmlFor="prod-proveedor">
                      Proveedor Habitual
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <Input
                      id="prod-proveedor"
                      appearance="outline"
                      size="medium"
                      className={styles.d365ControlFull}
                      value={formData.proveedorDefecto || ''}
                      placeholder="Ej: DIRECTV Perú S.R.L., Huawei, CommScope..."
                      onChange={(_, data) =>
                        setFormData({ ...formData, proveedorDefecto: data.value })
                      }
                    />
                  </div>
                </div>

                {/* Costo Actual */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium" htmlFor="prod-costo-actual">
                      Costo Actual
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
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
                      placeholder="0.00"
                      onChange={(_, data) => {
                        setCostoActualStr(data.value);
                        const val = parseFloat(data.value);
                        setFormData((prev) => ({ ...prev, costoActual: isNaN(val) ? 0 : val }));
                      }}
                    />
                  </div>
                </div>

                {/* Costo Estándar */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium" htmlFor="prod-costo-estandar">
                      Costo Estándar
                    </Label>
                  </div>
                  <div className={styles.d365ControlCol}>
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
                      placeholder="0.00"
                      onChange={(_, data) => {
                        setCostoEstandarStr(data.value);
                        const val = parseFloat(data.value);
                        setFormData((prev) => ({ ...prev, costoEstandar: isNaN(val) ? 0 : val }));
                      }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: NOTAS */}
          {selectedTab === 'notas' && (
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Notas</Text>

              <div className={styles.d365FieldRowTop}>
                <div className={styles.d365LabelColTop}>
                  <Label size="medium" htmlFor="prod-notas">
                    Notas e Instrucciones
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Textarea
                    id="prod-notas"
                    appearance="outline"
                    size="medium"
                    rows={8}
                    className={styles.d365ControlFull}
                    value={formData.notas || ''}
                    placeholder="Instrucciones técnicas de servicio en campo, precauciones de manipulación, compatibilidad de firmware y observaciones internas..."
                    onChange={(_, data) => setFormData({ ...formData, notas: data.value })}
                  />
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Diálogo de Creación Rápida de Unidad de Medida (Quick Create Estilo Dynamics) */}
      <Dialog open={quickCreateUnidadOpen} onOpenChange={(_, data) => setQuickCreateUnidadOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Creación rápida: Unidad de Medida</DialogTitle>
            <DialogContent className={styles.dialogForm}>
              {quickUnidadError && (
                <D365MessageBar intent="error">{quickUnidadError}</D365MessageBar>
              )}
              <div className={styles.dialogRow}>
                <Label required size="small" className={styles.labelSmallBlock}>
                  Nombre
                </Label>
                <Input
                  size="medium"
                  className={styles.d365ControlFull}
                  placeholder="Ej: Caja, Bobina, Kilogramo..."
                  value={quickUnidadData.nombre}
                  onChange={(_, d) => setQuickUnidadData((prev) => ({ ...prev, nombre: d.value }))}
                />
              </div>
              <div className={styles.dialogGrid2}>
                <div>
                  <Label required size="small" className={styles.labelSmallBlock}>
                    Código
                  </Label>
                  <Input
                    size="medium"
                    className={styles.d365ControlFull}
                    placeholder="Ej: CAJ, BOB, KGM"
                    value={quickUnidadData.codigo}
                    onChange={(_, d) => setQuickUnidadData((prev) => ({ ...prev, codigo: d.value }))}
                  />
                </div>
                <div>
                  <Label required size="small" className={styles.labelSmallBlock}>
                    Abreviatura
                  </Label>
                  <Input
                    size="medium"
                    className={styles.d365ControlFull}
                    placeholder="Ej: cja, bob, kg"
                    value={quickUnidadData.abreviatura}
                    onChange={(_, d) => setQuickUnidadData((prev) => ({ ...prev, abreviatura: d.value }))}
                  />
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={quickUnidadSaving}
                onClick={() => setQuickCreateUnidadOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                disabled={quickUnidadSaving}
                onClick={handleGuardarUnidadRapida}
              >
                {quickUnidadSaving ? 'Guardando...' : 'Guardar y seleccionar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      {/* Diálogo de Creación Rápida de Categoría (Quick Create Estilo Dynamics) */}
      <Dialog open={quickCreateCatOpen} onOpenChange={(_, data) => setQuickCreateCatOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Creación rápida: Categoría de Producto</DialogTitle>
            <DialogContent className={styles.dialogForm}>
              {quickCatError && (
                <D365MessageBar intent="error">{quickCatError}</D365MessageBar>
              )}
              <div className={styles.dialogRow}>
                <Label required size="small" className={styles.labelSmallBlock}>
                  Nombre de la Categoría
                </Label>
                <Input
                  size="medium"
                  className={styles.d365ControlFull}
                  placeholder="Ej: Materiales de Red, Equipos Decodificadores..."
                  value={quickCatData.nombre}
                  onChange={(_, d) => setQuickCatData((prev) => ({ ...prev, nombre: d.value }))}
                />
              </div>
              <div className={styles.dialogRow}>
                <Label size="small" className={styles.labelSmallBlock}>
                  Descripción (opcional)
                </Label>
                <Textarea
                  size="medium"
                  rows={3}
                  className={styles.d365ControlFull}
                  placeholder="Descripción de la categoría..."
                  value={quickCatData.descripcion}
                  onChange={(_, d) => setQuickCatData((prev) => ({ ...prev, descripcion: d.value }))}
                />
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                disabled={quickCatSaving}
                onClick={() => setQuickCreateCatOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                disabled={quickCatSaving}
                onClick={handleGuardarCategoriaRapida}
              >
                {quickCatSaving ? 'Guardando...' : 'Guardar y seleccionar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ProductoFormPage;
