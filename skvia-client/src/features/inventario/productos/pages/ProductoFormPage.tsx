import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
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
  Divider,
  Avatar,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
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
  DismissRegular,
  Cube16Regular,
  Folder16Regular,
} from '@fluentui/react-icons';
import { ProductoService } from '../services/producto.service';
import type { CreateProductoDto, TipoProducto } from '../types/producto.types';
import { CategoriaService } from '../../categorias/services/categoria.service';
import type { CategoriaProductoDto } from '../../categorias/types/categoria.types';
import { UnidadMedidaService } from '../../unidades-medida/services/unidadMedida.service';
import type { UnidadMedidaDto } from '../../unidades-medida/types/unidadMedida.types';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    overflow: 'hidden',
    userSelect: 'none',
  },
  // 0. Full Width Top Notification Banner (Above Command Bar)
  messageBarContainer: {
    width: '100%',
    borderRadius: 0,
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    flexShrink: 0,
    zIndex: 100,
  },
  // 1. D365 Top Command Bar
  commandBar: {
    height: '44px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '8px',
    paddingRight: '16px',
    flexShrink: 0,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  // Icon colors using Fluent UI design tokens
  iconPrimary: {
    color: tokens.colorBrandForeground1,
  },
  iconSaveLilac: {
    color: tokens.colorPaletteLilacBorderActive,
  },
  iconNewGreen: {
    color: tokens.colorPaletteGreenForeground1,
  },
  // 2. Entity Header Summary
  headerContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '16px 24px 0px 24px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
  },
  headerTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.2',
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  // Header Meta Information (Label on top, Value on bottom, with divider line)
  headerMetaRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
  },
  metaLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.5px',
  },
  metaValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.2',
  },
  metaDivider: {
    height: '28px',
  },
  tabList: {
    marginTop: '8px',
  },
  // 3. Form Content Body (Full-width, left to right, non-centered)
  contentBody: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '20px 24px 36px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    margin: '0',
  },
  grid2Cols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '20px',
    width: '100%',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    padding: '20px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    boxSizing: 'border-box',
  },
  cardSectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    paddingBottom: '10px',
    marginBottom: '6px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  // Dynamics 365 Horizontal Form Row Layout using Fluent UI Label (Clean, borderless)
  d365FieldRow: {
    display: 'flex',
    alignItems: 'center',
    minHeight: '44px',
    padding: '2px 0',
    gap: '16px',
  },
  d365FieldRowTop: {
    display: 'flex',
    alignItems: 'flex-start',
    minHeight: '76px',
    padding: '4px 0',
    gap: '16px',
  },
  d365LabelCol: {
    width: '160px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  d365LabelColTop: {
    width: '160px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    paddingTop: '6px',
  },
  d365ControlCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  d365ControlFull: {
    width: '100%',
  },
  tagPickerControl: {
    width: '100%',
    minHeight: '32px',
    height: '32px',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    paddingTop: '0px',
    paddingBottom: '0px',
    flexWrap: 'nowrap',
  },
  tagPickerGroup: {
    paddingTop: '0px',
    paddingBottom: '0px',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  tagPickerInput: {
    paddingTop: '0px',
    paddingBottom: '0px',
    minHeight: '28px',
  },
  unitIcon: {
    color: tokens.colorBrandForeground1,
  },
  categoryIcon: {
    color: tokens.colorBrandForeground1,
  },
  secondaryOptionText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    lineHeight: tokens.lineHeightBase100,
  },
  quickCreateFooter: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldErrorText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorStatusDangerForeground1,
    marginTop: '2px',
  },
  // Loading Container (Prevents empty default data flash during fetch)
  loadingContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 24px',
    gap: '16px',
    width: '100%',
  },
});

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
  const styles = useStyles();
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
    precioBase: 0,
    costoActual: 0,
    costoEstandar: 0,
    afectoImpuesto: true,
    esSerializado: false,
    convertirEnActivoCliente: false,
    codigoBarras: '',
    proveedorDefecto: '',
    descripcion: '',
    notas: '',
  });

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

  const cargarCatalogos = useCallback(() => {
    CategoriaService.getCategorias(undefined, true)
      .then((cats) => setCategoriasList(cats))
      .catch((err) => console.error('Error al cargar catálogo de categorías:', err));

    UnidadMedidaService.getUnidadesMedida(undefined, true)
      .then((ums) => setUnidadesList(ums))
      .catch((err) => console.error('Error al cargar catálogo de unidades de medida:', err));
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
    permiteDecimales: false,
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
        permiteDecimales: quickUnidadData.permiteDecimales,
      });
      cargarCatalogos();
      setFormData((prev) => ({ ...prev, unidadMedida: quickUnidadData.nombre.trim() }));
      setQuickCreateUnidadOpen(false);
      setQuickUnidadData({
        nombre: '',
        codigo: '',
        abreviatura: '',
        permiteDecimales: false,
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
            precioBase: p.precioBase,
            costoActual: p.costoActual ?? 0,
            costoEstandar: p.costoEstandar ?? 0,
            afectoImpuesto: p.afectoImpuesto ?? true,
            esSerializado: p.esSerializado ?? false,
            convertirEnActivoCliente: p.convertirEnActivoCliente ?? false,
            codigoBarras: p.codigoBarras ?? '',
            proveedorDefecto: p.proveedorDefecto ?? '',
            descripcion: p.descripcion ?? '',
            notas: p.notas ?? '',
          });
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
    // Precio unitario es obligatorio y debe ser mayor a 0
    if (formData.precioBase === undefined || formData.precioBase === null || formData.precioBase <= 0) {
      newErrors.precioBase = 'El precio unitario es obligatorio y debe ser mayor a 0';
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
          esSerializado: formData.esSerializado,
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          precioBase: formData.precioBase,
          convertirEnActivoCliente: formData.convertirEnActivoCliente,
          codigoBarras: formData.codigoBarras,
          notas: formData.notas,
          costoActual: formData.costoActual,
          costoEstandar: formData.costoEstandar,
          afectoImpuesto: formData.afectoImpuesto,
          proveedorDefecto: formData.proveedorDefecto,
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
      precioBase: 0,
      costoActual: 0,
      costoEstandar: 0,
      afectoImpuesto: true,
      esSerializado: false,
      convertirEnActivoCliente: false,
      codigoBarras: '',
      proveedorDefecto: '',
      descripcion: '',
      notas: '',
    });
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
    ? 'Cargando producto...'
    : savedHeader.nombre || (isEditMode ? 'Cargando producto...' : 'Nuevo producto');

  const headerSubtitle = loading
    ? 'Obteniendo detalles del servidor...'
    : savedHeader.codigo
      ? `Producto · Código: ${savedHeader.codigo.toUpperCase()}`
      : 'Producto sin guardar';

  const headerInitials = savedHeader.nombre ? getInitials(savedHeader.nombre) : 'NP';

  return (
    <div className={styles.root}>
      {/* 0. FULL WIDTH TOP NOTIFICATION MESSAGEBAR (ABOVE COMMAND BAR CON BOTÓN X) */}
      {statusMessage && (
        <MessageBar
          intent={statusMessage.type === 'success' ? 'success' : 'error'}
          shape="square"
          className={styles.messageBarContainer}
        >
          <MessageBarBody>
            <MessageBarTitle>
              {statusMessage.type === 'success' ? 'Éxito' : 'Atención'}
            </MessageBarTitle>
            {statusMessage.text}
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <Button
                appearance="transparent"
                aria-label="Cerrar notificación"
                icon={<DismissRegular />}
                onClick={() => setStatusMessage(null)}
              />
            }
          />
        </MessageBar>
      )}

      {/* 1. DYNAMICS 365 COMMAND BAR */}
      <Toolbar size="medium" aria-label="Comandos de producto" className={styles.commandBar}>
        <div className={styles.toolbarLeft}>
          <ToolbarButton
            icon={<ArrowLeft16Regular className={styles.iconPrimary} />}
            onClick={handleBack}
            title="Volver al listado"
            aria-label="Volver"
          />
          <ToolbarDivider />

          {/* Guardar: Lilac Border Active */}
          <ToolbarButton
            icon={<Save16Regular className={styles.iconSaveLilac} />}
            onClick={() => handleSave(false)}
            disabled={saving || loading}
            appearance="subtle"
          >
            Guardar
          </ToolbarButton>

          {/* Guardar y cerrar: Lilac Border Active */}
          <ToolbarButton
            icon={<SaveMultiple16Regular className={styles.iconSaveLilac} />}
            onClick={() => handleSave(true)}
            disabled={saving || loading}
            appearance="subtle"
          >
            Guardar y cerrar
          </ToolbarButton>

          {/* Nuevo: Verde D365 */}
          <ToolbarButton
            icon={<Add16Regular className={styles.iconNewGreen} />}
            onClick={handleNew}
            disabled={saving || loading}
            appearance="subtle"
          >
            Nuevo
          </ToolbarButton>

          {/* Deshacer / Refrescar */}
          <ToolbarButton
            icon={<ArrowClockwise16Regular />}
            onClick={handleNew}
            disabled={saving || loading}
            appearance="subtle"
          >
            Deshacer
          </ToolbarButton>
        </div>

        {(saving || loading) && (
          <Spinner size="tiny" label={loading ? 'Cargando producto...' : 'Guardando...'} />
        )}
      </Toolbar>

      {/* 2. ENTITY HEADER SUMMARY */}
      <div className={styles.headerContainer}>
        {loading ? (
          <div className={styles.headerTopRow}>
            <div className={styles.headerLeft}>
              <Skeleton animation="pulse">
                <SkeletonItem shape="circle" size={56} />
              </Skeleton>
              <div className={styles.titleSection}>
                <Skeleton animation="pulse">
                  <SkeletonItem size={24} style={{ width: '280px', marginBottom: '8px' }} />
                  <SkeletonItem size={16} style={{ width: '180px' }} />
                </Skeleton>
              </div>
            </div>

            <div className={styles.headerMetaRight}>
              <div className={styles.metaItem}>
                <Text className={styles.metaLabel}>Estado</Text>
                <Skeleton animation="pulse">
                  <SkeletonItem size={16} style={{ width: '60px', marginTop: '4px' }} />
                </Skeleton>
              </div>
              <Divider vertical className={styles.metaDivider} />
              <div className={styles.metaItem}>
                <Text className={styles.metaLabel}>Tipo de Producto</Text>
                <Skeleton animation="pulse">
                  <SkeletonItem size={16} style={{ width: '80px', marginTop: '4px' }} />
                </Skeleton>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.headerTopRow}>
            <div className={styles.headerLeft}>
              <Avatar
                name={headerTitle}
                initials={headerInitials}
                size={56}
                className={styles.avatar}
              />
              <div className={styles.titleSection}>
                <Text className={styles.title}>{headerTitle}</Text>
                <Text className={styles.subtitle}>{headerSubtitle}</Text>
              </div>
            </div>

            {/* Metadatos: Label Arriba (Estado / Tipo) + Valor Abajo + Fluent UI Divider */}
            <div className={styles.headerMetaRight}>
              <div className={styles.metaItem}>
                <Text className={styles.metaLabel}>Estado</Text>
                <Text className={styles.metaValue}>
                  {savedHeader.activo ? 'Activo' : 'Inactivo'}
                </Text>
              </div>
              <Divider vertical className={styles.metaDivider} />
              <div className={styles.metaItem}>
                <Text className={styles.metaLabel}>Tipo de Producto</Text>
                <Text className={styles.metaValue}>{savedHeader.tipo}</Text>
              </div>
            </div>
          </div>
        )}

        {/* Tabs de Dynamics 365 */}
        <TabList
          className={styles.tabList}
          selectedValue={selectedTab}
          onTabSelect={(_, data) => setSelectedTab(data.value as string)}
        >
          <Tab value="detalles" icon={<Box16Regular />}>
            Detalles del Producto
          </Tab>
          <Tab value="field-service" icon={<Wrench16Regular />}>
            Servicio de Campo
          </Tab>
          <Tab value="notas" icon={<DocumentText16Regular />}>
            Notas
          </Tab>
        </TabList>
      </div>

      {/* 3. D365 FORM SECTIONS (Ocupando de izquierda a derecha sin centrado) */}
      {loading ? (
        <div className={styles.contentBody}>
          <div className={styles.grid2Cols}>
            <Card className={styles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} style={{ width: '120px', marginBottom: '16px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <SkeletonItem size={32} style={{ width: '100%' }} />
                  <SkeletonItem size={32} style={{ width: '100%' }} />
                  <SkeletonItem size={32} style={{ width: '100%' }} />
                  <SkeletonItem size={72} style={{ width: '100%' }} />
                </div>
              </Skeleton>
            </Card>
            <Card className={styles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} style={{ width: '140px', marginBottom: '16px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <SkeletonItem size={32} style={{ width: '100%' }} />
                  <SkeletonItem size={32} style={{ width: '100%' }} />
                  <SkeletonItem size={32} style={{ width: '100%' }} />
                  <SkeletonItem size={32} style={{ width: '100%' }} />
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
              {/* Sección Izquierda: GENERAL */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>General</Text>

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
                    {errors.nombre && <span className={styles.fieldErrorText}>{errors.nombre}</span>}
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
                    {errors.codigo && <span className={styles.fieldErrorText}>{errors.codigo}</span>}
                  </div>
                </div>


                {/* Categoría (TagPicker Estilo Dynamics 365 con Quick Create) */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium" htmlFor="prod-categoria">
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
                                    <span className={styles.secondaryOptionText}>
                                      Padre: {c.categoriaPadreNombre}
                                    </span>
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

              {/* Sección Derecha: PRECIOS Y UNIDADES */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>Precios y Unidades</Text>

                {/* Unidad de Medida (Obligatorio) */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label required size="medium" htmlFor="prod-unidad">
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
                      <span className={styles.fieldErrorText}>{errors.unidadMedida}</span>
                    )}
                  </div>
                </div>

                {/* Precio Unitario / Base (OBLIGATORIO) */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label required size="medium" htmlFor="prod-precio">
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
                      value={formData.precioBase !== undefined && formData.precioBase !== 0 ? formData.precioBase.toString() : ''}
                      placeholder="0.00"
                      onChange={(_, data) => {
                        const val = parseFloat(data.value);
                        const num = isNaN(val) ? 0 : val;
                        setFormData({ ...formData, precioBase: num });
                        if (errors.precioBase && num > 0) {
                          setErrors((prev) => ({ ...prev, precioBase: '' }));
                        }
                      }}
                    />
                    {errors.precioBase && (
                      <span className={styles.fieldErrorText}>{errors.precioBase}</span>
                    )}
                  </div>
                </div>

                {/* Afecto a Impuestos */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium">Afecto a Impuestos (IGV)</Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Switch
                        checked={formData.afectoImpuesto !== false}
                        onChange={(_, data) =>
                          setFormData({ ...formData, afectoImpuesto: data.checked })
                        }
                      />
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {formData.afectoImpuesto !== false ? 'Sí (Afecto a IGV)' : 'No (Exonerado)'}
                      </Text>
                    </div>
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
                      value={formData.costoActual !== undefined ? formData.costoActual.toString() : '0'}
                      placeholder="0.00"
                      onChange={(_, data) => {
                        const val = parseFloat(data.value);
                        setFormData({ ...formData, costoActual: isNaN(val) ? 0 : val });
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
                      value={formData.costoEstandar !== undefined ? formData.costoEstandar.toString() : '0'}
                      placeholder="0.00"
                      onChange={(_, data) => {
                        const val = parseFloat(data.value);
                        setFormData({ ...formData, costoEstandar: isNaN(val) ? 0 : val });
                      }}
                    />
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

                {/* Convertir en Activo de Cliente */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium">Convertir en Activo del Cliente</Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Switch
                        checked={formData.convertirEnActivoCliente || false}
                        onChange={(_, data) =>
                          setFormData({ ...formData, convertirEnActivoCliente: data.checked })
                        }
                      />
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {formData.convertirEnActivoCliente
                          ? 'Sí (Se registrará como activo al instalar en la orden)'
                          : 'No'}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Control Serializado */}
                <div className={styles.d365FieldRow}>
                  <div className={styles.d365LabelCol}>
                    <Label size="medium">Es Serializado</Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Switch
                        checked={formData.esSerializado || false}
                        onChange={(_, data) =>
                          setFormData({ ...formData, esSerializado: data.checked })
                        }
                      />
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {formData.esSerializado ? 'Sí (Exige serie/MAC individual)' : 'No'}
                      </Text>
                    </div>
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

              {/* Sección Derecha: PROVEEDOR Y COMPRAS */}
              <Card className={styles.card}>
                <Text className={styles.cardSectionTitle}>Proveedor</Text>

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
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              {quickUnidadError && (
                <MessageBar intent="error">
                  <MessageBarBody>{quickUnidadError}</MessageBarBody>
                </MessageBar>
              )}
              <div>
                <Label required size="small" style={{ marginBottom: '4px', display: 'block' }}>
                  Nombre
                </Label>
                <Input
                  size="medium"
                  style={{ width: '100%' }}
                  placeholder="Ej: Caja, Bobina, Kilogramo..."
                  value={quickUnidadData.nombre}
                  onChange={(_, d) => setQuickUnidadData((prev) => ({ ...prev, nombre: d.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Label required size="small" style={{ marginBottom: '4px', display: 'block' }}>
                    Código
                  </Label>
                  <Input
                    size="medium"
                    style={{ width: '100%' }}
                    placeholder="Ej: CAJ, BOB, KGM"
                    value={quickUnidadData.codigo}
                    onChange={(_, d) => setQuickUnidadData((prev) => ({ ...prev, codigo: d.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label required size="small" style={{ marginBottom: '4px', display: 'block' }}>
                    Abreviatura
                  </Label>
                  <Input
                    size="medium"
                    style={{ width: '100%' }}
                    placeholder="Ej: cja, bob, kg"
                    value={quickUnidadData.abreviatura}
                    onChange={(_, d) => setQuickUnidadData((prev) => ({ ...prev, abreviatura: d.value }))}
                  />
                </div>
              </div>
              <div style={{ paddingTop: '4px' }}>
                <Switch
                  label="Permite Decimales (fraccionable)"
                  checked={quickUnidadData.permiteDecimales}
                  onChange={(_, d) => setQuickUnidadData((prev) => ({ ...prev, permiteDecimales: d.checked }))}
                />
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
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              {quickCatError && (
                <MessageBar intent="error">
                  <MessageBarBody>{quickCatError}</MessageBarBody>
                </MessageBar>
              )}
              <div>
                <Label required size="small" style={{ marginBottom: '4px', display: 'block' }}>
                  Nombre de la Categoría
                </Label>
                <Input
                  size="medium"
                  style={{ width: '100%' }}
                  placeholder="Ej: Materiales de Red, Equipos Decodificadores..."
                  value={quickCatData.nombre}
                  onChange={(_, d) => setQuickCatData((prev) => ({ ...prev, nombre: d.value }))}
                />
              </div>
              <div>
                <Label size="small" style={{ marginBottom: '4px', display: 'block' }}>
                  Descripción (opcional)
                </Label>
                <Textarea
                  size="medium"
                  rows={3}
                  style={{ width: '100%' }}
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

// Retrocompatibilidad con importaciones previas
export const ProductoCreatePage = ProductoFormPage;
export default ProductoFormPage;
