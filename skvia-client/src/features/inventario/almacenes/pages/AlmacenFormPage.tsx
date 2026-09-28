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
  Text,
  Label,
  Avatar,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
  Tag,
  Link,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  Building16Regular,
  Checkmark16Regular,
  DismissCircle16Regular,
  Dismiss12Regular,
  DismissRegular,
  Search16Regular,
  Box16Regular,
  Person16Regular,
} from '@fluentui/react-icons';
import { AlmacenService } from '../services/almacen.service';
import type { CreateAlmacenDto } from '../types/almacen.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { getCurrentUserSession } from '../../../../services/sessionService';

export interface AlmacenFormPageProps {
  almacenId?: string | null;
  onBack?: () => void;
  onSaved?: (savedId: string) => void;
  onCreated?: (createdId: string) => void;
}

export const AlmacenFormPage: React.FC<AlmacenFormPageProps> = ({
  almacenId: propAlmacenId,
  onBack: propOnBack,
  onSaved: propOnSaved,
  onCreated: propOnCreated,
}) => {
  const styles = useD365FormStyles();
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const effectiveId =
    propAlmacenId !== undefined
      ? propAlmacenId
      : routeId && routeId !== 'nuevo'
      ? routeId
      : null;

  const [currentId, setCurrentId] = useState<string | null>(effectiveId);
  const isEditMode = Boolean(currentId);

  const [selectedTab, setSelectedTab] = useState<string>('general');
  const currentUser = useMemo(() => getCurrentUserSession(), []);

  // Form State (Estilo Dynamics 365: Nombre y Descripción)
  const [formData, setFormData] = useState<CreateAlmacenDto>({
    nombre: '',
    descripcion: '',
  });

  const [savedHeader, setSavedHeader] = useState<{
    nombre: string;
    activo: boolean;
  }>({
    nombre: '',
    activo: true,
  });

  // UI state
  const [loading, setLoading] = useState<boolean>(Boolean(effectiveId));
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cargarAlmacen = useCallback(
    async (idToLoad: string) => {
      try {
        setLoading(true);
        setStatusMessage(null);
        const data = await AlmacenService.getAlmacenById(idToLoad);

        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion || '',
        });

        setSavedHeader({
          nombre: data.nombre,
          activo: data.activo,
        });
      } catch (err: any) {
        console.error('Error al cargar almacén:', err);
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Error al obtener la información del almacén.',
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (effectiveId && effectiveId !== currentId) {
      cargarAlmacen(effectiveId);
    } else if (!effectiveId) {
      setCurrentId(null);
      setFormData({
        nombre: '',
        descripcion: '',
      });
      setSavedHeader({
        nombre: '',
        activo: true,
      });
      setLoading(false);
    }
  }, [effectiveId, currentId, cargarAlmacen]);

  // Auto-cerrar mensaje de éxito tras 5 segundos
  useEffect(() => {
    if (statusMessage?.type === 'success') {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del almacén es obligatorio.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfterSave = false): Promise<string | null> => {
    if (!validate()) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor complete todos los campos obligatorios.',
      });
      return null;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      if (isEditMode && currentId) {
        await AlmacenService.updateAlmacen(currentId, {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion?.trim() || null,
        });

        setSavedHeader((prev) => ({
          ...prev,
          nombre: formData.nombre.trim(),
        }));

        setStatusMessage({
          type: 'success',
          text: `Almacén "${formData.nombre.trim()}" actualizado correctamente.`,
        });

        if (propOnSaved) propOnSaved(currentId);

        if (closeAfterSave) {
          if (propOnBack) propOnBack();
          else navigate('/servicio-campo/almacenes');
        }

        return currentId;
      } else {
        const res = await AlmacenService.createAlmacen({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion?.trim() || null,
        });

        setCurrentId(res.id);
        setSavedHeader({
          nombre: formData.nombre.trim(),
          activo: true,
        });

        setStatusMessage({
          type: 'success',
          text: `Almacén "${formData.nombre.trim()}" creado exitosamente.`,
        });

        if (propOnCreated) propOnCreated(res.id);

        if (closeAfterSave) {
          if (propOnBack) propOnBack();
          else navigate('/servicio-campo/almacenes');
        } else {
          navigate(`/servicio-campo/almacenes/${res.id}`, { replace: true });
        }

        return res.id;
      }
    } catch (err: any) {
      console.error('Error al guardar almacén:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al guardar el almacén.',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async () => {
    if (!currentId) return;
    try {
      setSaving(true);
      const nuevoEstado = !savedHeader.activo;
      await AlmacenService.cambiarEstado(currentId, nuevoEstado);
      setSavedHeader((prev) => ({ ...prev, activo: nuevoEstado }));
      setStatusMessage({
        type: 'success',
        text: `Almacén ${nuevoEstado ? 'activado' : 'desactivado'} con éxito.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al cambiar el estado del almacén.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate('/servicio-campo/almacenes');
    }
  };

  const handleNew = () => {
    navigate('/servicio-campo/almacenes/nuevo');
  };

  return (
    <div className={styles.root}>
      {/* 0. Fluent UI MessageBar para notificaciones */}
      {statusMessage && (
        <MessageBar
          intent={statusMessage.type}
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

      {/* 1. D365 Standard Command Bar */}
      <Toolbar className={styles.commandBar} aria-label="Comandos de Almacén">
        <div className={styles.toolbarLeft}>
          {/* Botón de Atrás: Solo Icono */}
          <ToolbarButton
            icon={<ArrowLeft16Regular className={styles.iconPrimary} />}
            onClick={handleBack}
            title="Volver al listado"
            aria-label="Volver"
          />

          <ToolbarDivider />

          {/* Botón Guardar: Color lila/púrpura oficial D365 */}
          <ToolbarButton
            icon={<Save16Regular className={styles.iconSaveLilac} />}
            appearance="subtle"
            onClick={() => handleSave(false)}
            disabled={saving || loading}
          >
            Guardar
          </ToolbarButton>

          {/* Botón Guardar y cerrar: Color lila/púrpura oficial D365 */}
          <ToolbarButton
            icon={<SaveMultiple16Regular className={styles.iconSaveLilac} />}
            appearance="subtle"
            onClick={() => handleSave(true)}
            disabled={saving || loading}
          >
            Guardar y cerrar
          </ToolbarButton>

          <ToolbarDivider />

          {/* Botón Nuevo: Verde D365 */}
          <ToolbarButton
            icon={<Add16Regular className={styles.iconNewGreen} />}
            appearance="subtle"
            onClick={handleNew}
            disabled={saving}
          >
            Nuevo
          </ToolbarButton>

          {isEditMode && (
            <ToolbarButton
              icon={savedHeader.activo ? <DismissCircle16Regular /> : <Checkmark16Regular />}
              appearance="subtle"
              onClick={handleToggleEstado}
              disabled={saving || loading}
            >
              {savedHeader.activo ? 'Desactivar' : 'Activar'}
            </ToolbarButton>
          )}

          <ToolbarButton
            icon={<ArrowClockwise16Regular />}
            appearance="subtle"
            onClick={() => {
              if (currentId) cargarAlmacen(currentId);
            }}
            disabled={saving || loading}
            title="Actualizar registro"
          >
            Actualizar
          </ToolbarButton>
        </div>

        {(saving || loading) && (
          <Spinner size="tiny" label={loading ? 'Cargando...' : 'Guardando...'} />
        )}
      </Toolbar>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner label="Cargando almacén..." size="large" />
        </div>
      ) : (
        <>
          {/* 2. D365 Standard Header Container */}
          <div className={styles.headerContainer}>
            <div className={styles.headerTopRow}>
              <div className={styles.headerLeft}>
                <Avatar
                  name={savedHeader.nombre || 'Almacén'}
                  className={styles.avatar}
                  size={48}
                  icon={<Building16Regular />}
                />
                <div className={styles.titleSection}>
                  <Text className={styles.mainTitle}>
                    {isEditMode
                      ? savedHeader.nombre || 'Almacén'
                      : 'Nuevo Almacén'}
                  </Text>
                  <Text className={styles.subTitle}>Almacén</Text>
                </div>
              </div>

              {/* Header Right Meta Items (Estado en solo texto) */}
              <div className={styles.headerMetaRight}>
                <div className={styles.metaItem}>
                  <Text className={styles.metaLabel}>ESTADO</Text>
                  <Text className={styles.metaValue}>
                    {savedHeader.activo ? 'Activo' : 'Inactivo'}
                  </Text>
                </div>
              </div>
            </div>

            {/* D365 Tabs Navigation */}
            <TabList
              selectedValue={selectedTab}
              onTabSelect={(_e, d) => setSelectedTab(d.value as string)}
              className={styles.tabList}
            >
              <Tab value="general">General</Tab>
              {isEditMode && <Tab value="existencias">Existencias de Producto</Tab>}
            </TabList>
          </div>

          {/* 3. D365 Form Body Content */}
          <div className={styles.contentBody}>
            {selectedTab === 'general' ? (
              <div className={styles.card}>
                {/* Fila 1: Nombre (Izquierda) | Propietario (Derecha) */}
                <div className={styles.grid2Cols}>
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label required>Nombre</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.nombre}
                        onChange={(_e, d) => {
                          setFormData((prev) => ({ ...prev, nombre: d.value }));
                          if (errors.nombre) {
                            setErrors((prev) => ({ ...prev, nombre: '' }));
                          }
                        }}
                        placeholder="---"
                      />
                      {errors.nombre && (
                        <Text className={styles.fieldErrorText}>
                          {errors.nombre}
                        </Text>
                      )}
                    </div>
                  </div>

                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label required>Propietario</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <div className={styles.lookupContainer}>
                        <Tag
                          appearance="brand"
                          shape="rounded"
                          size="small"
                          media={<Person16Regular />}
                          dismissible
                          dismissIcon={<Dismiss12Regular />}
                          value={currentUser.nombre}
                        >
                          <Link
                            as="span"
                            className={styles.primaryLink}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            title={`Usuario: ${currentUser.nombre} (${currentUser.username})`}
                          >
                            {currentUser.nombre}
                          </Link>
                        </Tag>

                        <Search16Regular
                          className={styles.lookupSearchIcon}
                          title="Búsqueda de registros de Usuario"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fila 2: Descripción (Multilínea estilo Dynamics 365) */}
                <div className={styles.d365FieldRow} style={{ marginTop: 16 }}>
                  <div className={styles.d365LabelCol}>
                    <Label>Descripción</Label>
                  </div>
                  <div className={styles.d365ControlCol}>
                    <Textarea
                      className={styles.d365ControlFull}
                      rows={5}
                      value={formData.descripcion || ''}
                      onChange={(_e, d) =>
                        setFormData((prev) => ({ ...prev, descripcion: d.value }))
                      }
                      placeholder="---"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Tab: Existencias & Stock */
              <div className={styles.card}>
                <Text className={styles.cardSectionTitle}>
                  Existencias e Inventario en Este Almacén
                </Text>
                <Text size={300} style={{ color: '#605e5c', marginBottom: 16 }}>
                  Consulte las cantidades disponibles, reservadas y en tránsito de productos en esta ubicación de inventario.
                </Text>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Button
                    appearance="primary"
                    icon={<Box16Regular />}
                    onClick={() => navigate('/servicio-campo/stock')}
                  >
                    Ver Inventario de Productos
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
