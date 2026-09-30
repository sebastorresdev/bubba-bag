import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Textarea,
  TabList,
  Tab,
  Card,
  Text,
  Skeleton,
  SkeletonItem,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  Box16Regular,
  Folder16Regular,
} from '@fluentui/react-icons';
import { CategoriaService } from '../services/categoria.service';
import type { CreateCategoriaProductoDto, CategoriaProductoDto } from '../types/categoria.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { LookupDropdownWithQuickCreate } from '../../../../components/common/LookupDropdownWithQuickCreate';
import { CrearCategoriaDrawer } from '../components/CrearCategoriaDrawer';

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

  const categoriaPadreSeleccionada = useMemo(
    () => categoriasDisponibles.find((c) => c.id === formData.categoriaPadreId),
    [categoriasDisponibles, formData.categoriaPadreId]
  );

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
        <D365MessageBar
          intent={statusMessage.type === 'success' ? 'success' : 'error'}
          className={styles.messageBarContainer}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </D365MessageBar>
      )}

      {/* 1. Command Bar */}
      <D365CommandBar
        ariaLabel="Comandos de categoría"

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

          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            onClick={() => handleSave(false)}
            disabled={saving || loading}
            appearance="subtle"
          >
            Guardar
          </D365CommandButton>

          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            onClick={() => handleSave(true)}
            disabled={saving || loading}
            appearance="subtle"
          >
            Guardar y cerrar
          </D365CommandButton>

          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            onClick={handleNew}
            disabled={saving || loading}
            appearance="subtle"
          >
            Nuevo
          </D365CommandButton>

          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            onClick={handleResetForm}
            disabled={saving || loading}
            appearance="subtle"
          >
            Deshacer
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. Header Summary */}
      <D365EntityHeader
        title={headerTitle}
        subtitle={savedHeader.categoriaPadreNombre
          ? `Categoría Padre: ${savedHeader.categoriaPadreNombre}`
          : 'Categoría principal / raíz • Catálogo de inventario'}
        avatarName={savedHeader.nombre || 'C P'}
        avatarSize={56}
        subtleAvatar
        loading={loading}
        metadata={[{ label: 'Estado', value: savedHeader.activo ? 'Activo' : 'Inactivo' }]}
        tabs={(
          <TabList selectedValue="detalles">
            <Tab value="detalles" icon={<Box16Regular />}>General</Tab>
          </TabList>
        )}
      />

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
          <Card className={styles.card}>
            <Text className={styles.cardSectionTitle}>Datos de la Categoría</Text>

              {/* Nombre */}
              <D365FormField label="Nombre" required htmlFor="cat-nombre" size="medium" error={errors.nombre}>
                <Input
                  id="cat-nombre"
                  appearance="outline"
                  size="medium"
                  className={styles.d365ControlFull}
                  value={formData.nombre}
                  placeholder="---"
                  onChange={(_, data) => {
                    setFormData({ ...formData, nombre: data.value });
                    if (errors.nombre && data.value.trim()) {
                      setErrors((prev) => ({ ...prev, nombre: '' }));
                    }
                  }}
                />
              </D365FormField>

              {/* Categoría Padre (TagPicker Estilo Dynamics 365 con Quick Create) */}
              <D365FormField label="Categoría Padre" htmlFor="cat-padre" size="medium">
                <LookupDropdownWithQuickCreate
                  idEntrada="cat-padre"
                  etiquetaGrupo="Categorías"
                  opciones={categoriasDisponibles
                    .filter((categoria) => categoria.id !== currentId)
                    .map((categoria) => ({
                      id: categoria.id,
                      nombre: categoria.nombre,
                      detalle: categoria.categoriaPadreNombre
                        ? `Padre: ${categoria.categoriaPadreNombre}`
                        : null,
                    }))}
                  seleccionada={categoriaPadreSeleccionada ? {
                    id: categoriaPadreSeleccionada.id,
                    nombre: categoriaPadreSeleccionada.nombre,
                  } : null}
                  textoBusqueda={categoriaPadreQuery}
                  alCambiarBusqueda={setCategoriaPadreQuery}
                  alSeleccionar={(id) => setFormData((prev) => ({ ...prev, categoriaPadreId: id }))}
                  alNavegar={(id) => window.open(`/servicio-campo/categorias-producto/${id}`, '_blank')}
                  icono={<Folder16Regular className={styles.categoryIcon} />}
                  textoVacio="No se encontraron categorías"
                  tituloEnlace="Ver detalles de la categoría padre"
                  renderizarCreacionRapida={({ abierto, nombreInicial, cerrar }) => (
                    <CrearCategoriaDrawer
                      abierto={abierto}
                      nombreInicial={nombreInicial}
                      alCerrar={cerrar}
                      alGuardar={(categoriaCreada) => {
                        setCategoriasDisponibles((actual) => [
                          categoriaCreada,
                          ...actual.filter((categoria) => categoria.id !== categoriaCreada.id),
                        ]);
                        setFormData((actual) => ({ ...actual, categoriaPadreId: categoriaCreada.id }));
                      }}
                    />
                  )}
                />
              </D365FormField>

            <D365FormField label="Descripción" htmlFor="cat-desc" size="medium" align="top">
              <Textarea
                id="cat-desc"
                appearance="outline"
                size="medium"
                rows={5}
                className={styles.d365ControlFull}
                value={formData.descripcion || ''}
                placeholder="---"
                onChange={(_, data) =>
                  setFormData({ ...formData, descripcion: data.value })
                }
              />
            </D365FormField>
          </Card>
        </div>
      )}

    </div>
  );
};

export default CategoriaFormPage;
