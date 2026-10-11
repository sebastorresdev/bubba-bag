import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Checkbox,
  Textarea,
  Spinner,
  Text,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
  useId,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  Delete16Regular,
  ClipboardTask20Regular,
} from '@fluentui/react-icons';
import { TipoOrdenService } from '../services/tipoOrden.service';
import type { GuardarTipoOrdenTrabajoDto } from '../types/tipoOrden.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';

const PRESET_COLORS = [
  '#0f6cbd', // Brand Blue
  '#107c41', // Green
  '#d83b01', // Orange / Alert
  '#5c2d91', // Purple
  '#008272', // Teal
  '#a4262c', // Red / Critical
  '#69797e', // Neutral / Gray
  '#4f6bed', // Indigo
];

export function TipoOrdenFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const toasterId = useId('tipo-orden-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const notifySuccess = useCallback((title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  const isEditMode = Boolean(id && id !== 'nuevo');

  const [formData, setFormData] = useState<GuardarTipoOrdenTrabajoDto>({
    nombre: '',
    requiereVisitaCampo: true,
    exigeFirmaCliente: true,
    exigeEvidenciasFotograficas: true,
    descripcion: '',
    colorHex: '#0f6cbd',
  });

  const [savedTitle, setSavedTitle] = useState(isEditMode ? '' : 'Nuevo');
  const savedSubtitle = 'Configuración Operativa • Naturaleza de Servicio';

  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cargarDatos = useCallback(async (tipoId: string) => {
    try {
      setLoading(true);
      const data = await TipoOrdenService.getTipoOrdenById(tipoId);
      setFormData({
        nombre: data.nombre,
        requiereVisitaCampo: data.requiereVisitaCampo,
        exigeFirmaCliente: data.exigeFirmaCliente,
        exigeEvidenciasFotograficas: data.exigeEvidenciasFotograficas,
        descripcion: data.descripcion || '',
        colorHex: data.colorHex || '#0f6cbd',
      });
      setSavedTitle(data.nombre);
      setActivo(data.activo);
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al cargar tipo de orden.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      void cargarDatos(id);
    }
  }, [isEditMode, id, cargarDatos]);

  const validar = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.nombre.trim()) {
      errs.nombre = 'El nombre del tipo de orden es obligatorio.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const guardar = async (cerrarAlFinal = false): Promise<string | null> => {
    if (!validar()) {
      setStatusMessage({ type: 'error', text: 'Por favor complete todos los campos obligatorios.' });
      return null;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      let savedId = id;
      if (isEditMode && id) {
        await TipoOrdenService.actualizarTipoOrden(id, formData);
        setSavedTitle(formData.nombre.trim());
        notifySuccess('Tipo de orden actualizado correctamente.');
      } else {
        const res = await TipoOrdenService.crearTipoOrden(formData);
        savedId = res.id;
        setSavedTitle(formData.nombre.trim());
        notifySuccess('Tipo de orden registrado exitosamente.');
      }

      if (cerrarAlFinal) {
        navigate('/servicio-campo/tipos-orden');
      } else if (!isEditMode && savedId) {
        navigate(`/servicio-campo/tipos-orden/${savedId}`, { replace: true });
      }

      return savedId ?? null;
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al guardar tipo de orden.',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstado = async () => {
    if (!id || !isEditMode) return;
    try {
      setSaving(true);
      await TipoOrdenService.cambiarEstado(id, !activo);
      setActivo(!activo);
      setStatusMessage({
        type: 'success',
        text: `Tipo de orden ${!activo ? 'activado' : 'desactivado'} correctamente.`,
      });
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al cambiar estado.',
      });
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!id || !isEditMode) return;
    if (!window.confirm('¿Está seguro de eliminar este tipo de orden de trabajo?')) return;
    try {
      setSaving(true);
      await TipoOrdenService.eliminarTipoOrden(id);
      navigate('/servicio-campo/tipos-orden');
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Error al eliminar tipo de orden.',
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner label="Cargando tipo de orden..." size="large" />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} />

      {/* Barra de Comandos */}
      <D365CommandBar ariaLabel="Barra de comandos de tipo de orden">
        <D365CommandButton
          icon={<ArrowLeft16Regular />}
          tone="brand"
          aria-label="Atrás"
          title="Atrás"
          onClick={() => navigate('/servicio-campo/tipos-orden')}
        />
        <D365CommandDivider />
        <D365CommandButton
          icon={<Save16Regular />}
          tone="save"
          disabled={saving}
          onClick={() => void guardar(false)}
        >
          Guardar
        </D365CommandButton>
        <D365CommandButton
          icon={<SaveMultiple16Regular />}
          tone="save"
          disabled={saving}
          onClick={() => void guardar(true)}
        >
          Guardar y cerrar
        </D365CommandButton>
        <D365CommandDivider />
        <D365CommandButton
          icon={<Add16Regular />}
          tone="create"
          onClick={() => navigate('/servicio-campo/tipos-orden/nuevo')}
        >
          Nuevo
        </D365CommandButton>
        {isEditMode && (
          <>
            <D365CommandButton
              disabled={saving}
              onClick={() => void cambiarEstado()}
            >
              {activo ? 'Desactivar' : 'Activar'}
            </D365CommandButton>
            <D365CommandButton
              icon={<Delete16Regular />}
              tone="danger"
              disabled={saving}
              onClick={() => void eliminar()}
            >
              Eliminar
            </D365CommandButton>
          </>
        )}
      </D365CommandBar>

      {/* Alerta de Estado */}
      {statusMessage && (
        <div style={{ padding: '8px 16px' }}>
          <D365MessageBar intent={statusMessage.type} onDismiss={() => setStatusMessage(null)}>
            {statusMessage.text}
          </D365MessageBar>
        </div>
      )}

      {/* Encabezado D365 */}
      <D365EntityHeader
        title={savedTitle || (isEditMode ? 'Tipo de Orden' : 'Nuevo')}
        subtitle={savedSubtitle}
        avatarIcon={<ClipboardTask20Regular />}
        avatarSize={48}
        metadata={[
          {
            label: 'Visita de Campo',
            value: formData.requiereVisitaCampo ? 'Requerida' : 'Remota',
          },
          {
            label: 'Firma Cliente',
            value: formData.exigeFirmaCliente ? 'Obligatoria' : 'Opcional',
          },
          {
            label: 'Estado',
            value: activo ? 'Activo' : 'Inactivo',
          },
        ]}
      />

      {/* Formulario */}
      <div className={styles.contentBody}>
        <div className={styles.halfCardWrapper}>
          <div className={styles.card}>
            <Text size={400} weight="semibold" style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, paddingBottom: 8, display: 'block' }}>
              Información General
            </Text>

            <D365FormField
              label="Nombre del Tipo de Orden"
              required
              error={errors.nombre}
              info="Identificador público del tipo de orden (ej: 'Instalación Residencial (DTH)', 'Mantenimiento Correctivo')."
            >
              <Input
                value={formData.nombre}
                onChange={(_, d) => setFormData((prev) => ({ ...prev, nombre: d.value }))}
                placeholder="Ej: Instalación Fibra Óptica"
              />
            </D365FormField>

            <D365FormField
              label="Color Identificador"
              info="Color visual distintivo en tableros de programación, calendario y badges."
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <input
                  type="color"
                  value={formData.colorHex}
                  onChange={(e) => setFormData((prev) => ({ ...prev, colorHex: e.target.value }))}
                  style={{
                    width: 38,
                    height: 38,
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    borderRadius: tokens.borderRadiusMedium,
                    cursor: 'pointer',
                    padding: 2,
                  }}
                />
                <Input
                  value={formData.colorHex}
                  onChange={(_, d) => setFormData((prev) => ({ ...prev, colorHex: d.value }))}
                  style={{ width: 120 }}
                />
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, colorHex: col }))}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: col,
                        border: formData.colorHex.toLowerCase() === col.toLowerCase() ? `2px solid ${tokens.colorBrandBackground}` : '1px solid rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        outline: 'none',
                      }}
                      title={col}
                    />
                  ))}
                </div>
              </div>
            </D365FormField>

            <D365FormField
              label="Descripción"
              info="Instrucciones, alcance técnico o notas operativas para este tipo de orden."
            >
              <Textarea
                value={formData.descripcion}
                onChange={(_, d) => setFormData((prev) => ({ ...prev, descripcion: d.value }))}
                rows={3}
                placeholder="Detalle el alcance de esta tipología..."
              />
            </D365FormField>

            <Text size={400} weight="semibold" style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, paddingBottom: 8, marginTop: 16, display: 'block' }}>
              Reglas Operativas
            </Text>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              <Checkbox
                checked={formData.requiereVisitaCampo}
                onChange={(_, d) => setFormData((prev) => ({ ...prev, requiereVisitaCampo: Boolean(d.checked) }))}
                label={
                  <Text>
                    <strong>Requiere Desplazamiento / Visita de Campo</strong> — Activa la reserva de técnicos de campo, asignación de vehículos y georreferenciación en mapa.
                  </Text>
                }
              />

              <Checkbox
                checked={formData.exigeFirmaCliente}
                onChange={(_, d) => setFormData((prev) => ({ ...prev, exigeFirmaCliente: Boolean(d.checked) }))}
                label={
                  <Text>
                    <strong>Exige Firma de Conformidad del Cliente</strong> — Impide que el operario finalice la orden en la app móvil si no se captura la firma digital.
                  </Text>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
