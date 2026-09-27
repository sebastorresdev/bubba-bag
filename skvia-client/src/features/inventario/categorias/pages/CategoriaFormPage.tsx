import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
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
  DismissRegular,
  Box16Regular,
  Folder16Regular,
} from '@fluentui/react-icons';
import { CategoriaService } from '../services/categoria.service';
import type { CreateCategoriaProductoDto, CategoriaProductoDto } from '../types/categoria.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';

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
  const styles = useD365FormStyles();
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const effectiveId = propId !== undefined
    ? propId
    : (routeId && routeId !== 'nuevo' ? routeId : null);

  const [currentId, setCurrentId] = useState<string | null>(effectiveId);
  const isEditMode = Boolean(currentId);

  const [categoriasDisponibles, setCategoriasDisponibles] = useState<CategoriaProductoDto[]>([]);

  const [formData, setFormData] = useState<CreateCategoriaProductoDto>({
    nombre: '',
    categoriaPadreId: null,
    descripcion: '',
  });

  const [savedHeader, setSavedHeader] = useState<{
    nombre: string;
    categoriaPadreNombre: string;
    activo: boolean;
  }>({
    nombre: '',
    categoriaPadreNombre: '',
    activo: true,
  });

  const [loading, setLoading] = useState<boolean>(Boolean(effectiveId));
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cargarCategoriasDisponibles = useCallback(async () => {
    try {
      const data = await CategoriaService.getCategorias(undefined, true);
      setCategoriasDisponibles(data);
    } catch (err) {
      console.error('Error al cargar catálogo de categorías padre:', err);
    }
  }, []);

  const handleResetForm = () => {
    setCurrentId(null);
    setFormData({
      nombre: '',
      categoriaPadreId: null,
      descripcion: '',
    });
    setSavedHeader({
      nombre: '',
      categoriaPadreNombre: '',
      activo: true,
    });
    setErrors({});
    setStatusMessage(null);
  };

  // Estado y lógica para TagPicker de Categoría Padre (Estilo Dynamics 365)
  const [categoriaPadreQuery, setCategoriaPadreQuery] = useState('');
  const [quickCreateCatOpen, setQuickCreateCatOpen] = useState(false);
  const [quickCatData, setQuickCatData] = useState({
    nombre: '',
    descripcion: '',
  });
  const [quickCatError, setQuickCatError] = useState('');
  const [quickCatSaving, setQuickCatSaving] = useState(false);

  const categoriaPadreSeleccionada = useMemo(
    () => categoriasDisponibles.find((c) => c.id === formData.categoriaPadreId),
    [categoriasDisponibles, formData.categoriaPadreId]
  );

  const selectedPadreOptions = useMemo(
    () => (formData.categoriaPadreId ? [formData.categoriaPadreId] : []),
    [formData.categoriaPadreId]
  );

  const filteredCategorias = useMemo(() => {
    const disponibles = categoriasDisponibles.filter((c) => c.id !== currentId);
    const q = categoriaPadreQuery.trim().toLowerCase();
    if (!q) return disponibles.filter((c) => c.id !== formData.categoriaPadreId);
    return disponibles.filter(
      (c) =>
        c.id !== formData.categoriaPadreId &&
        (c.nombre.toLowerCase().includes(q) ||
          (c.categoriaPadreNombre && c.categoriaPadreNombre.toLowerCase().includes(q)))
    );
  }, [categoriasDisponibles, currentId, formData.categoriaPadreId, categoriaPadreQuery]);

  const onCategoriaPadreOptionSelect: TagPickerProps['onOptionSelect'] = (_e, data) => {
    setFormData((prev) => ({
      ...prev,
      categoriaPadreId: prev.categoriaPadreId === data.value ? null : data.value,
    }));
    setCategoriaPadreQuery('');
  };

  const handleGuardarCategoriaRapida = async () => {
    if (!quickCatData.nombre.trim()) {
      setQuickCatError('El nombre de la categoría es obligatorio.');
      return;
    }
    try {
      setQuickCatSaving(true);
      setQuickCatError('');
      const res = await CategoriaService.createCategoria({
        nombre: quickCatData.nombre.trim(),
        categoriaPadreId: null,
        descripcion: quickCatData.descripcion.trim() || null,
      });
      await cargarCategoriasDisponibles();
      setFormData((prev) => ({ ...prev, categoriaPadreId: res.id }));
      setQuickCreateCatOpen(false);
      setQuickCatData({ nombre: '', descripcion: '' });
    } catch (err: any) {
      setQuickCatError(err?.message || 'Error al crear la categoría.');
    } finally {
      setQuickCatSaving(false);
    }
  };

  useEffect(() => {
    cargarCategoriasDisponibles();
    if (effectiveId) {
      setCurrentId(effectiveId);
      setLoading(true);
      CategoriaService.getCategoriaById(effectiveId)
        .then((c) => {
          setFormData({
            nombre: c.nombre,
            categoriaPadreId: c.categoriaPadreId || null,
            descripcion: c.descripcion || '',
          });
          setSavedHeader({
            nombre: c.nombre,
            categoriaPadreNombre: c.categoriaPadreNombre || '',
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
  }, [effectiveId, cargarCategoriasDisponibles]);

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

      const padreSeleccionado = categoriasDisponibles.find(
        (c) => c.id === formData.categoriaPadreId
      );

      if (currentId) {
        await CategoriaService.updateCategoria(currentId, {
          nombre: formData.nombre,
          categoriaPadreId: formData.categoriaPadreId,
          descripcion: formData.descripcion,
        });
        setStatusMessage({
          type: 'success',
          text: `Categoría "${formData.nombre}" actualizada con éxito.`,
        });
        await cargarCategoriasDisponibles();
      } else {
        const res = await CategoriaService.createCategoria(formData);
        savedId = res.id;
        setCurrentId(res.id);
        setStatusMessage({
          type: 'success',
          text: `Categoría "${formData.nombre}" creada con éxito.`,
        });
        await cargarCategoriasDisponibles();
        if (!closeAfter) {
          navigate(`/servicio-campo/categorias-producto/${res.id}`, { replace: true });
        }
      }

      setSavedHeader({
        nombre: formData.nombre,
        categoriaPadreNombre: padreSeleccionado ? padreSeleccionado.nombre : '',
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
    cargarCategoriasDisponibles();
  };

  const headerTitle = loading
    ? 'Cargando...'
    : savedHeader.nombre || (isEditMode ? 'Cargando...' : 'Nueva Categoría de Producto');

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
                  <SkeletonItem size={24} className={styles.skeletonTitle} />
                  <SkeletonItem size={16} className={styles.skeletonSub} />
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
                  {savedHeader.categoriaPadreNombre
                    ? `Categoría Padre: ${savedHeader.categoriaPadreNombre}`
                    : 'Categoría principal / raíz • Catálogo de inventario'}
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
          <Tab value="detalles" icon={<Box16Regular />}>
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
                <SkeletonItem size={16} className={styles.skeletonHeader} />
                <div className={styles.fieldColumnFlex}>
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                  <SkeletonItem size={32} className={styles.skeletonFull} />
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
                    <Text size={100} className={styles.fieldErrorText}>{errors.nombre}</Text>
                  )}
                </div>
              </div>

              {/* Categoría Padre (TagPicker Estilo Dynamics 365 con Quick Create) */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label size="medium" htmlFor="cat-padre">
                    Categoría Padre
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <TagPicker
                    onOptionSelect={onCategoriaPadreOptionSelect}
                    selectedOptions={selectedPadreOptions}
                  >
                    <TagPickerControl className={styles.tagPickerControl}>
                      {categoriaPadreSeleccionada && (
                        <TagPickerGroup className={styles.tagPickerGroup} aria-label="Categoría padre seleccionada">
                          <Tag
                            key={categoriaPadreSeleccionada.id}
                            shape="rounded"
                            size="small"
                            media={<Folder16Regular className={styles.categoryIcon} />}
                            value={categoriaPadreSeleccionada.id}
                          >
                            <Link
                              as="span"
                              className={styles.primaryLink}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  `/servicio-campo/categorias-producto/${categoriaPadreSeleccionada.id}`,
                                  '_blank'
                                );
                              }}
                              title="Ver detalles de la categoría padre"
                            >
                              {categoriaPadreSeleccionada.nombre}
                            </Link>
                          </Tag>
                        </TagPickerGroup>
                      )}
                      <TagPickerInput
                        id="cat-padre"
                        className={styles.tagPickerInput}
                        value={categoriaPadreQuery}
                        onChange={(e) => setCategoriaPadreQuery(e.target.value)}
                        placeholder={formData.categoriaPadreId ? '' : 'Buscar categoría padre (o dejar vacío para principal)'}
                        clearable
                      />
                    </TagPickerControl>
                    <TagPickerList>
                      <TagPickerOptionGroup label="Categorías">
                        {filteredCategorias.length > 0 ? (
                          filteredCategorias.map((c) => (
                            <TagPickerOption
                              key={c.id}
                              value={c.id}
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
                          ))
                        ) : (
                          <div className={styles.dropdownEmptyOption}>
                            No se encontraron categorías
                          </div>
                        )}
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

      {/* Diálogo de Creación Rápida de Categoría Padre (Quick Create Estilo Dynamics) */}
      <Dialog open={quickCreateCatOpen} onOpenChange={(_, data) => setQuickCreateCatOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Creación rápida: Categoría de Producto</DialogTitle>
            <DialogContent className={styles.dialogForm}>
              {quickCatError && (
                <MessageBar intent="error">
                  <MessageBarBody>{quickCatError}</MessageBarBody>
                </MessageBar>
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

export default CategoriaFormPage;
