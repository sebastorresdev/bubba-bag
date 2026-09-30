import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Textarea,
  Spinner,
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
  LockClosed16Regular,
} from '@fluentui/react-icons';
import { AlmacenService } from '../services/almacen.service';
import type { CreateAlmacenDto } from '../types/almacen.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { getCurrentUserSession } from '../../../../services/sessionService';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';

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
  const currentUser = useMemo(() => getCurrentUserSession(), []);

  const effectiveId =
    propAlmacenId !== undefined
      ? propAlmacenId
      : routeId && routeId !== 'nuevo'
      ? routeId
      : null;

  const [currentId, setCurrentId] = useState<string | null>(effectiveId);
  const isEditMode = Boolean(currentId);

  // Form State (Estilo Dynamics 365: Nombre y Descripción)
  const [formData, setFormData] = useState<CreateAlmacenDto>({
    nombre: '',
    descripcion: '',
  });

  const [savedHeader, setSavedHeader] = useState<{
    nombre: string;
    activo: boolean;
    creadoPorNombre: string;
  }>({
    nombre: '',
    activo: true,
    creadoPorNombre: currentUser.nombre,
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
        setCurrentId(idToLoad);
        setLoading(true);
        const data = await AlmacenService.getAlmacenById(idToLoad);

        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion || '',
        });

        setSavedHeader({
          nombre: data.nombre,
          activo: data.activo,
          creadoPorNombre: data.creadoPorNombre || '',
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
    if (effectiveId) {
      void cargarAlmacen(effectiveId);
    } else {
      setCurrentId(null);
      setFormData({
        nombre: '',
        descripcion: '',
      });
      setSavedHeader({
        nombre: '',
        activo: true,
        creadoPorNombre: currentUser.nombre,
      });
      setLoading(false);
      setStatusMessage(null);
      setErrors({});
    }
  }, [effectiveId, cargarAlmacen, currentUser.nombre]);

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

        const successMessage = `Almacén "${formData.nombre.trim()}" actualizado correctamente.`;
        setStatusMessage({
          type: 'success',
          text: successMessage,
        });

        if (propOnSaved) propOnSaved(currentId);

        if (closeAfterSave) {
          if (propOnBack) propOnBack();
          else navigate('/servicio-campo/almacenes', { state: { successMessage } });
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
          creadoPorNombre: currentUser.nombre,
        });

        const successMessage = `Almacén "${formData.nombre.trim()}" creado exitosamente.`;
        setStatusMessage({
          type: 'success',
          text: successMessage,
        });

        if (propOnCreated) propOnCreated(res.id);

        if (closeAfterSave) {
          if (propOnBack) propOnBack();
          else navigate('/servicio-campo/almacenes', { state: { successMessage } });
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
        <D365MessageBar
          intent={statusMessage.type}
          className={styles.messageBarContainer}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </D365MessageBar>
      )}

      {/* 1. D365 Standard Command Bar */}
      <D365CommandBar

        ariaLabel="Comandos de Almacén"
        busy={saving || loading}
        busyLabel={loading ? 'Cargando...' : 'Guardando...'}
      >
        <div className={styles.toolbarLeft}>
          {/* Botón de Atrás: Solo Icono */}
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={handleBack}
            title="Volver al listado"
            aria-label="Volver"
          />

          <D365CommandDivider />

          {/* Botón Guardar: Color lila/púrpura oficial D365 */}
          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            appearance="subtle"
            onClick={() => handleSave(false)}
            disabled={saving || loading}
          >
            Guardar
          </D365CommandButton>

          {/* Botón Guardar y cerrar: Color lila/púrpura oficial D365 */}
          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            appearance="subtle"
            onClick={() => handleSave(true)}
            disabled={saving || loading}
          >
            Guardar y cerrar
          </D365CommandButton>

          <D365CommandDivider />

          {/* Botón Nuevo: Verde D365 */}
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            appearance="subtle"
            onClick={handleNew}
            disabled={saving}
          >
            Nuevo
          </D365CommandButton>

          {isEditMode && (
            <D365CommandButton
              tone={savedHeader.activo ? 'danger' : 'create'}
              icon={savedHeader.activo ? <DismissCircle16Regular /> : <Checkmark16Regular />}
              appearance="subtle"
              onClick={handleToggleEstado}
              disabled={saving || loading}
            >
              {savedHeader.activo ? 'Desactivar' : 'Activar'}
            </D365CommandButton>
          )}

          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            appearance="subtle"
            onClick={() => {
              if (currentId) cargarAlmacen(currentId);
            }}
            disabled={saving || loading}
            title="Actualizar registro"
          >
            Actualizar
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner label="Cargando almacén..." size="large" />
        </div>
      ) : (
        <>
          {/* 2. D365 Standard Header Container */}
          <D365EntityHeader
            title={isEditMode ? savedHeader.nombre || 'Almacén' : 'Nuevo Almacén'}
            subtitle="Almacén"
            avatarName={savedHeader.nombre || 'Almacén'}
            avatarIcon={<Building16Regular />}
            avatarSize={48}
            metadata={[{ label: 'Estado', value: savedHeader.activo ? 'Activo' : 'Inactivo' }]}
          />

          {/* 3. D365 Form Body Content */}
          <div className={styles.contentBody}>
            <div className={styles.card}>
              <div className={styles.grid2Cols}>
                <D365FormField label="Nombre" required error={errors.nombre}>
                  <Input
                    className={styles.d365ControlFull}
                    value={formData.nombre}
                    maxLength={150}
                    onChange={(_e, d) => {
                      setFormData((prev) => ({ ...prev, nombre: d.value }));
                      if (errors.nombre) {
                        setErrors((prev) => ({ ...prev, nombre: '' }));
                      }
                    }}
                    placeholder="---"
                  />
                </D365FormField>

                <D365FormField label="Creado por">
                  <Input
                    className={styles.d365ControlFull}
                    value={savedHeader.creadoPorNombre || 'Usuario no disponible'}
                    appearance="filled-darker"
                    readOnly
                    contentAfter={(
                      <LockClosed16Regular title="Campo de solo lectura" aria-label="Campo de solo lectura" />
                    )}
                  />
                </D365FormField>
              </div>

              <D365FormField label="Descripción" align="top">
                <Textarea
                  className={styles.d365ControlFull}
                  rows={5}
                  maxLength={500}
                  value={formData.descripcion || ''}
                  onChange={(_e, d) =>
                    setFormData((prev) => ({ ...prev, descripcion: d.value }))
                  }
                  placeholder="---"
                />
              </D365FormField>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
