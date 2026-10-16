import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Textarea,
  Spinner,
  Text,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
  useId,
  Checkbox,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  Delete16Regular,
  ArrowClockwise16Regular,
  ClipboardTask20Regular,
} from '@fluentui/react-icons';
import { D365FormContent } from '../../../../components/common/D365FormContent';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { useValidationFocus } from '../../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { confirmAction } from '../../../../services/uiFeedback';
import { TareaService } from '../services/tarea.service';
import type { GuardarTareaDto } from '../../configuraciones-servicio/types/configuracionServicio.types';

export function TareaFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const toasterId = useId('tarea-form-toaster');
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

  const isEditMode = Boolean(id && id !== 'nuevo');

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [duracionEstimadaMinutos, setDuracionEstimadaMinutos] = useState(30);
  const [requiereEvidenciaFotografica, setRequiereEvidenciaFotografica] = useState(false);
  const [activo, setActivo] = useState(true);

  const [savedTitle, setSavedTitle] = useState(isEditMode ? '' : 'Nueva Tarea');
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges(
    { codigo, nombre, descripcion, duracionEstimadaMinutos, requiereEvidenciaFotografica, activo },
    !loading
  );

  const cargarDatos = useCallback(async () => {
    if (!isEditMode || !id) return;
    try {
      setLoading(true);
      setStatusMessage(null);
      const data = await TareaService.getTareaById(id);
      setCodigo(data.codigo || '');
      setNombre(data.nombre || '');
      setDescripcion(data.descripcion || '');
      setDuracionEstimadaMinutos(data.duracionEstimadaMinutos || 30);
      setRequiereEvidenciaFotografica(Boolean(data.requiereEvidenciaFotografica));
      setActivo(data.activo !== false);
      setSavedTitle(data.nombre || 'Tarea');
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'No se pudo cargar la información de la tarea.',
      });
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const validarFormulario = (): boolean => {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) {
      errs.nombre = 'El nombre de la tarea es obligatorio.';
    }
    if (!duracionEstimadaMinutos || duracionEstimadaMinutos <= 0) {
      errs.duracionEstimadaMinutos = 'La duración estimada debe ser mayor a 0 minutos.';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusValidation();
      return false;
    }
    return true;
  };

  const handleGuardar = async (cerrar = false) => {
    if (!validarFormulario()) return;

    try {
      setSaving(true);
      setStatusMessage(null);

      const payload: GuardarTareaDto = {
        codigo: codigo.trim() || undefined,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        duracionEstimadaMinutos,
        requiereEvidenciaFotografica,
      };

      if (isEditMode && id) {
        await TareaService.actualizarTarea(id, payload);
        draft.markSaved();
        notifySuccess(`Tarea "${payload.nombre}" actualizada correctamente.`);
        setSavedTitle(payload.nombre);
        if (cerrar) {
          navigate('/servicio-campo/tareas');
        }
      } else {
        const res = await TareaService.crearTarea(payload);
        draft.markSaved();
        notifySuccess(`Tarea "${payload.nombre}" creada con éxito.`);
        if (cerrar) {
          navigate('/servicio-campo/tareas');
        } else if (res?.id) {
          navigate(`/servicio-campo/tareas/${res.id}`, { replace: true });
        } else {
          navigate('/servicio-campo/tareas');
        }
      }
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Ocurrió un error al guardar la tarea.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!isEditMode || !id) return;
    const confirm = await confirmAction(
      `¿Está seguro de que desea eliminar la tarea "${savedTitle}" del catálogo maestro?`,
      { title: 'Eliminar Tarea', action: 'Eliminar', danger: true }
    );
    if (!confirm) return;

    try {
      setSaving(true);
      await TareaService.eliminarTarea(id);
      draft.markSaved();
      notifySuccess(`Tarea "${savedTitle}" eliminada.`);
      navigate('/servicio-campo/tareas');
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'No se pudo eliminar la tarea.',
      });
      setSaving(false);
    }
  };

  const headerMetadata = useMemo(
    () => [
      {
        label: 'Estado',
        value: activo ? 'Activo' : 'Inactivo',
      },
      {
        label: 'Duración Est.',
        value: `${duracionEstimadaMinutos} min`,
      },
      {
        label: 'Evidencia Fotográfica',
        value: requiereEvidenciaFotografica ? 'Exigida' : 'Opcional',
      },
    ],
    [activo, duracionEstimadaMinutos, requiereEvidenciaFotografica]
  );

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 16,
        }}
      >
        <Spinner size="large" label="Cargando tarea..." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} />

      {/* 1. Command Bar */}
      <D365CommandBar ariaLabel="Comandos de formulario de tarea">
        <D365CommandButton
          icon={<ArrowLeft16Regular />}
          onClick={() => void draft.discardAndRun(() => navigate('/servicio-campo/tareas'))}
        >
          Volver a Tareas
        </D365CommandButton>
        <D365CommandDivider />
        <D365CommandButton
          icon={<Save16Regular />}
          tone="save"
          disabled={saving}
          onClick={() => void handleGuardar(false)}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </D365CommandButton>
        <D365CommandButton
          icon={<SaveMultiple16Regular />}
          disabled={saving}
          onClick={() => void handleGuardar(true)}
        >
          Guardar y cerrar
        </D365CommandButton>
        <D365CommandButton
          icon={<Add16Regular />}
          tone="create"
          onClick={() => void draft.discardAndRun(() => navigate('/servicio-campo/tareas/nuevo'))}
        >
          Nuevo
        </D365CommandButton>
        {isEditMode && (
          <D365CommandButton
            icon={<Delete16Regular />}
            tone="danger"
            disabled={saving}
            onClick={() => void handleEliminar()}
          >
            Eliminar
          </D365CommandButton>
        )}
        <D365CommandDivider />
        <D365CommandButton
          icon={<ArrowClockwise16Regular />}
          disabled={saving}
          onClick={() => void cargarDatos()}
          title="Actualizar datos del servidor"
        >
          Actualizar
        </D365CommandButton>
      </D365CommandBar>

      {/* 2. Feedback Alert */}
      {statusMessage && (
        <div style={{ padding: '0 24px', marginTop: 12 }}>
          <D365MessageBar
            intent={statusMessage.type}
            onDismiss={() => setStatusMessage(null)}
          >
            {statusMessage.text}
          </D365MessageBar>
        </div>
      )}

      {/* 3. Entity Header */}
      <D365EntityHeader
        avatarIcon={<ClipboardTask20Regular />}
        title={savedTitle || (isEditMode ? 'Tarea' : 'Nueva Tarea')}
        subtitle="Catálogo Maestro de Tareas • Operaciones de Servicio de Campo"
        metadata={headerMetadata}
      />

      {/* 4. Form Content */}
      <D365FormContent busy={saving} className={styles.contentBody}>
        <div
          className={styles.halfCardWrapper}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 20,
          }}
        >
          {/* Columna Izquierda: Información General */}
          <div className={styles.card}>
            <Text
              size={400}
              weight="semibold"
              style={{
                borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                paddingBottom: 8,
                display: 'block',
              }}
            >
              Información de la Tarea
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              <D365FormField
                label="Código Técnico"
                info="Código alfanumérico o identificador técnico de la tarea (opcional)"
              >
                <Input
                  value={codigo}
                  placeholder="Ej: TAR-001, INST-ODU, REP-CBL"
                  onChange={(_, d) => setCodigo(d.value)}
                />
              </D365FormField>

              <D365FormField
                label="Nombre de la Tarea"
                required
                error={errors.nombre}
                info="Nombre descriptivo de la labor operativa que realizará el técnico"
              >
                <Input
                  value={nombre}
                  placeholder="Ej: Instalación de Antena ODU, Cableado Coaxial RG6"
                  onChange={(_, d) => {
                    setNombre(d.value);
                    if (errors.nombre) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.nombre;
                        return next;
                      });
                    }
                  }}
                />
              </D365FormField>

              <D365FormField
                label="Duración Estimada (minutos)"
                required
                error={errors.duracionEstimadaMinutos}
                info="Tiempo estándar calculado para la ejecución de esta labor en campo"
              >
                <Input
                  type="number"
                  min={1}
                  step={5}
                  value={String(duracionEstimadaMinutos)}
                  onChange={(_, d) => {
                    const num = parseInt(d.value, 10);
                    setDuracionEstimadaMinutos(isNaN(num) ? 0 : Math.max(1, num));
                    if (errors.duracionEstimadaMinutos) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.duracionEstimadaMinutos;
                        return next;
                      });
                    }
                  }}
                />
              </D365FormField>

              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Checkbox
                  checked={requiereEvidenciaFotografica}
                  onChange={(_, d) => setRequiereEvidenciaFotografica(Boolean(d.checked))}
                  label="Exigir evidencia fotográfica obligatoria en la App Móvil"
                />

                <Checkbox
                  checked={activo}
                  onChange={(_, d) => setActivo(Boolean(d.checked))}
                  label="Tarea activa (disponible para plantillas y órdenes de trabajo)"
                />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Descripción y Alcance */}
          <div className={styles.card}>
            <Text
              size={400}
              weight="semibold"
              style={{
                borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                paddingBottom: 8,
                display: 'block',
              }}
            >
              Descripción y Alcance Técnico
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
              <D365FormField
                label="Alcance / Procedimiento Operativo"
                info="Instrucciones técnicas para el técnico en campo, criterios de aceptación o detalles del procedimiento."
              >
                <Textarea
                  value={descripcion}
                  rows={8}
                  style={{ resize: 'vertical' }}
                  placeholder="Detalle el procedimiento estándar, herramientas necesarias o validaciones que debe cumplir el técnico antes de dar por completada la tarea..."
                  onChange={(_, d) => setDescripcion(d.value)}
                />
              </D365FormField>

              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  backgroundColor: tokens.colorNeutralBackground2,
                  borderRadius: 4,
                  fontSize: 12,
                  color: tokens.colorNeutralForeground3,
                  lineHeight: '1.4',
                }}
              >
                <strong>Nota operativa:</strong> Esta tarea podrá ser agregada a múltiples
                Configuraciones de Servicio (Plantillas). Al asociarla a una orden de trabajo, el
                sistema generará las líneas de trabajo con la duración y requisitos definidos aquí.
              </div>
            </div>
          </div>
        </div>
      </D365FormContent>
    </div>
  );
}
