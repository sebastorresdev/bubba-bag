import React, { useState, useEffect } from 'react';
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
  TabList,
  Tab,
  Card,
  Text,
  Label,
  Avatar,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
  Skeleton,
  SkeletonItem,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  DismissRegular,
  Box24Regular,
} from '@fluentui/react-icons';
import { CategoriaService } from '../services/categoria.service';
import type { CreateCategoriaProductoDto } from '../types/categoria.types';

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
  messageBarContainer: {
    width: '100%',
    borderRadius: 0,
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    flexShrink: 0,
    zIndex: 100,
  },
  // 1. Dynamics 365 Standard Command Bar
  commandBar: {
    height: '44px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 8px',
    flexShrink: 0,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  iconPrimary: {
    color: tokens.colorCompoundBrandForeground1,
  },
  iconSaveLilac: {
    color: tokens.colorPaletteBerryBorderActive,
  },
  iconNewGreen: {
    color: tokens.colorPaletteGreenForeground1,
  },
  // 2. Dynamics 365 Entity Header Summary
  headerContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '12px 24px 0 24px',
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
  headerAvatar: {
    backgroundColor: tokens.colorPaletteDarkOrangeBackground2,
    color: tokens.colorPaletteDarkOrangeForeground2,
    fontWeight: 'bold',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  mainTitle: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.2',
  },
  subTitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  headerMetaRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: tokens.fontWeightSemibold,
  },
  metaValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginTop: '2px',
  },
  metaDivider: {
    height: '28px',
  },
  tabList: {
    marginTop: '8px',
  },
  // 3. Form Content Body
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
    paddingTop: '6px',
    display: 'flex',
    alignItems: 'flex-start',
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
  fieldErrorText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorStatusDangerForeground1,
    marginTop: '2px',
  },
});

export interface CategoriaFormPageProps {
  id?: string | null;
  onBack?: () => void;
  onSaved?: (savedId: string) => void;
  onCreated?: (createdId: string) => void;
}

export const CategoriaFormPage: React.FC<CategoriaFormPageProps> = ({
  id: propId,
  onBack: propOnBack,
  onSaved: propOnSaved,
  onCreated: propOnCreated,
}) => {
  const styles = useStyles();
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const effectiveId = propId !== undefined
    ? propId
    : (routeId && routeId !== 'nuevo' ? routeId : null);

  const [currentId, setCurrentId] = useState<string | null>(effectiveId);
  const isEditMode = Boolean(currentId);

  const [formData, setFormData] = useState<CreateCategoriaProductoDto>({
    nombre: '',
    familia: '',
    descripcion: '',
  });

  const [savedHeader, setSavedHeader] = useState<{
    nombre: string;
    familia: string;
    activo: boolean;
  }>({
    nombre: '',
    familia: '',
    activo: true,
  });

  const [loading, setLoading] = useState<boolean>(Boolean(effectiveId));
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleResetForm = () => {
    setCurrentId(null);
    setFormData({
      nombre: '',
      familia: '',
      descripcion: '',
    });
    setSavedHeader({
      nombre: '',
      familia: '',
      activo: true,
    });
    setErrors({});
    setStatusMessage(null);
  };

  useEffect(() => {
    if (effectiveId) {
      setCurrentId(effectiveId);
      setLoading(true);
      CategoriaService.getCategoriaById(effectiveId)
        .then((c) => {
          setFormData({
            nombre: c.nombre,
            familia: c.familia || '',
            descripcion: c.descripcion || '',
          });
          setSavedHeader({
            nombre: c.nombre,
            familia: c.familia || '',
            activo: c.activo,
          });
        })
        .catch((err) => {
          setStatusMessage({
            type: 'error',
            text: `Error al cargar la categoría: ${err?.message || 'Error desconocido'}`,
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
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la categoría es obligatorio';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfter: boolean = false) => {
    if (!validate()) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor completa todos los campos requeridos antes de guardar.',
      });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);
      let savedId = currentId;

      if (currentId) {
        await CategoriaService.updateCategoria(currentId, {
          nombre: formData.nombre,
          familia: formData.familia,
          descripcion: formData.descripcion,
        });
        setStatusMessage({
          type: 'success',
          text: `Categoría "${formData.nombre}" actualizada con éxito.`,
        });
      } else {
        const res = await CategoriaService.createCategoria(formData);
        savedId = res.id;
        setCurrentId(res.id);
        setStatusMessage({
          type: 'success',
          text: `Categoría "${formData.nombre}" creada con éxito.`,
        });
        if (!closeAfter) {
          navigate(`/servicio-campo/categorias-producto/${res.id}`, { replace: true });
        }
      }

      setSavedHeader({
        nombre: formData.nombre,
        familia: formData.familia || '',
        activo: true,
      });

      if (closeAfter) {
        setTimeout(() => {
          if (propOnSaved) propOnSaved(savedId || '');
          if (propOnCreated) propOnCreated(savedId || '');
          navigate('/servicio-campo/categorias-producto');
        }, 800);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al comunicarse con el servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (propOnBack) propOnBack();
    else navigate('/servicio-campo/categorias-producto');
  };

  const handleNew = () => {
    navigate('/servicio-campo/categorias-producto/nuevo');
    handleResetForm();
  };

  const headerTitle = loading
    ? 'Cargando categoría...'
    : savedHeader.nombre || (isEditMode ? 'Cargando categoría...' : 'Nueva Categoría de Producto');

  return (
    <div className={styles.root}>
      {/* 0. Notification Bar */}
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

      {/* 1. Command Bar */}
      <Toolbar size="medium" aria-label="Comandos de categoría" className={styles.commandBar}>
        <div className={styles.toolbarLeft}>
          <ToolbarButton
            icon={<ArrowLeft16Regular className={styles.iconPrimary} />}
            onClick={handleBack}
            title="Volver al listado"
            aria-label="Volver"
          />
          <ToolbarDivider />

          <ToolbarButton
            icon={<Save16Regular className={styles.iconSaveLilac} />}
            onClick={() => handleSave(false)}
            disabled={saving || loading}
            appearance="subtle"
          >
            Guardar
          </ToolbarButton>

          <ToolbarButton
            icon={<SaveMultiple16Regular className={styles.iconSaveLilac} />}
            onClick={() => handleSave(true)}
            disabled={saving || loading}
            appearance="subtle"
          >
            Guardar y cerrar
          </ToolbarButton>

          <ToolbarButton
            icon={<Add16Regular className={styles.iconNewGreen} />}
            onClick={handleNew}
            disabled={saving || loading}
            appearance="subtle"
          >
            Nuevo
          </ToolbarButton>

          <ToolbarButton
            icon={<ArrowClockwise16Regular />}
            onClick={handleResetForm}
            disabled={saving || loading}
            appearance="subtle"
          >
            Deshacer
          </ToolbarButton>
        </div>

        {(saving || loading) && (
          <Spinner size="tiny" label={loading ? 'Cargando...' : 'Guardando...'} />
        )}
      </Toolbar>

      {/* 2. Header Summary */}
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
          </div>
        ) : (
          <div className={styles.headerTopRow}>
            <div className={styles.headerLeft}>
              <Avatar
                size={56}
                name={savedHeader.nombre || 'C P'}
                className={styles.headerAvatar}
              />
              <div className={styles.titleSection}>
                <Text className={styles.mainTitle}>{headerTitle}</Text>
                <Text className={styles.subTitle}>
                  {savedHeader.familia
                    ? `Familia: ${savedHeader.familia}`
                    : 'Categoría taxonómica • Catálogo de inventario'}
                </Text>
              </div>
            </div>

            <div className={styles.headerMetaRight}>
              <div className={styles.metaItem}>
                <Text className={styles.metaLabel}>Estado</Text>
                <Text className={styles.metaValue}>
                  {savedHeader.activo ? 'Activo' : 'Inactivo'}
                </Text>
              </div>
            </div>
          </div>
        )}

        <TabList
          className={styles.tabList}
          selectedValue="detalles"
        >
          <Tab value="detalles" icon={<Box24Regular style={{ fontSize: 16 }} />}>
            General
          </Tab>
        </TabList>
      </div>

      {/* 3. Form Body */}
      {loading ? (
        <div className={styles.contentBody}>
          <div className={styles.grid2Cols}>
            <Card className={styles.card}>
              <Skeleton animation="pulse">
                <SkeletonItem size={16} style={{ width: '120px', marginBottom: '16px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <SkeletonItem size={32} style={{ width: '100%' }} />
                  <SkeletonItem size={32} style={{ width: '100%' }} />
                </div>
              </Skeleton>
            </Card>
          </div>
        </div>
      ) : (
        <div className={styles.contentBody}>
          <div className={styles.grid2Cols}>
            {/* Sección: Identificación */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Datos de la Categoría</Text>

              {/* Nombre */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label required size="medium" htmlFor="cat-nombre">
                    Nombre
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Input
                    id="cat-nombre"
                    appearance="outline"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.nombre}
                    placeholder="Ej: Materiales de Red, Equipos Decodificadores, Conectores..."
                    onChange={(_, data) => {
                      setFormData({ ...formData, nombre: data.value });
                      if (errors.nombre && data.value.trim()) {
                        setErrors((prev) => ({ ...prev, nombre: '' }));
                      }
                    }}
                  />
                  {errors.nombre && (
                    <span className={styles.fieldErrorText}>{errors.nombre}</span>
                  )}
                </div>
              </div>

              {/* Familia / Grupo */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label size="medium" htmlFor="cat-familia">
                    Familia / Grupo
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Input
                    id="cat-familia"
                    appearance="outline"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.familia || ''}
                    placeholder="Ej: Telecomunicaciones, Herramientas, Ferretería, Insumos..."
                    onChange={(_, data) =>
                      setFormData({ ...formData, familia: data.value })
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Sección: Descripción */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Información Adicional</Text>

              <div className={styles.d365FieldRowTop}>
                <div className={styles.d365LabelColTop}>
                  <Label size="medium" htmlFor="cat-desc">
                    Descripción
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Textarea
                    id="cat-desc"
                    appearance="outline"
                    size="medium"
                    rows={5}
                    className={styles.d365ControlFull}
                    value={formData.descripcion || ''}
                    placeholder="Propósito, clasificación y criterios de asignación a productos..."
                    onChange={(_, data) =>
                      setFormData({ ...formData, descripcion: data.value })
                    }
                  />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriaFormPage;
