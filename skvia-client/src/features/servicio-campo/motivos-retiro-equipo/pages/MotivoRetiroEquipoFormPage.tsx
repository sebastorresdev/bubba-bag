import React, { useState, useEffect, useCallback } from 'react';
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
} from '@fluentui/react-icons';
import { MotivoRetiroEquipoService } from '../services/motivoRetiroEquipo.service';
import type {
  TipoRetiroEquipo,
} from '../types/motivoRetiroEquipo.types';
import { TIPOS_RETIRO_EQUIPO_INFO } from '../types/motivoRetiroEquipo.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365FormContent } from '../../../../components/common/D365FormContent';

export interface MotivoRetiroEquipoFormPageProps {
  motivoId?: string | null;
  onBack?: () => void;
  onSaved?: (savedId: string) => void;
  onCreated?: (createdId: string) => void;
}

export const MotivoRetiroEquipoFormPage: React.FC<MotivoRetiroEquipoFormPageProps> = ({
  motivoId: propMotivoId,
  onBack: propOnBack,
  onSaved: propOnSaved,
  onCreated: propOnCreated,
}) => {
  const styles = useD365FormStyles();
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const toasterId = useId('motivo-retiro-toaster');
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

  const effectiveId =
    propMotivoId !== undefined
      ? propMotivoId
      : routeId && routeId !== 'nuevo'
        ? routeId
        : null;

  const [currentId, setCurrentId] = useState<string | null>(effectiveId);
  const isEditMode = Boolean(currentId);

  const [selectedTab, setSelectedTab] = useState<string>('general');

  // Form State - SIN CÓDIGO (No solicitado por usuario)
  const [formData, setFormData] = useState<{
    nombre: string;
    tipoRetiro: TipoRetiroEquipo;
    descripcion: string;
    activo: boolean;
  }>({
    nombre: '',
    tipoRetiro: 'AveriaTecnica',
    descripcion: '',
    activo: true,
  });

  // Saved Header State (static until save)
  const [savedHeader, setSavedHeader] = useState<{
    nombre: string;
    tipoRetiro: TipoRetiroEquipo;
    tipoRetiroLabel: string;
    activo: boolean;
  }>({
    nombre: '',
    tipoRetiro: 'AveriaTecnica',
    tipoRetiroLabel: 'Avería Técnica',
    activo: true,
  });

  const [loading, setLoading] = useState<boolean>(Boolean(effectiveId));
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!effectiveId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    MotivoRetiroEquipoService.getMotivoPorId(effectiveId)
      .then((data) => {
        if (!isMounted) return;
        setFormData({
          nombre: data.nombre,
          tipoRetiro: data.tipoRetiro,
          descripcion: data.descripcion || '',
          activo: data.activo,
        });

        const tipoInfo = TIPOS_RETIRO_EQUIPO_INFO[data.tipoRetiro];
        setSavedHeader({
          nombre: data.nombre,
          tipoRetiro: data.tipoRetiro,
          tipoRetiroLabel: tipoInfo?.badgeLabel || data.tipoRetiro,
          activo: data.activo,
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error al cargar motivo:', err);
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Error al cargar los datos del motivo de retiro.',
        });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del motivo de retiro es obligatorio.';
    }
    if (!formData.tipoRetiro) {
      newErrors.tipoRetiro = 'Debe seleccionar la naturaleza o tipo de retiro.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfter: boolean = false) => {
    if (!validate()) return;

    try {
      setSaving(true);
      setStatusMessage(null);

      let savedId = currentId;

      if (isEditMode && currentId) {
        await MotivoRetiroEquipoService.actualizarMotivo(currentId, {
          nombre: formData.nombre.trim(),
          tipoRetiro: formData.tipoRetiro,
          descripcion: formData.descripcion.trim() || null,
        });
        if (formData.activo !== savedHeader.activo) {
          await MotivoRetiroEquipoService.cambiarEstado(currentId, formData.activo);
        }
        notifySuccess(`Motivo "${formData.nombre}" actualizado exitosamente.`);
      } else {
        const res = await MotivoRetiroEquipoService.crearMotivo({
          nombre: formData.nombre.trim(),
          tipoRetiro: formData.tipoRetiro,
          descripcion: formData.descripcion.trim() || null,
        });
        savedId = res.id;
        setCurrentId(res.id);
        notifySuccess(`Motivo "${formData.nombre}" creado exitosamente.`);
        if (!closeAfter) {
          navigate(`/servicio-campo/motivos-retiro/${res.id}`, { replace: true });
        }
      }

      const tipoInfo = TIPOS_RETIRO_EQUIPO_INFO[formData.tipoRetiro];
      setSavedHeader({
        nombre: formData.nombre,
        tipoRetiro: formData.tipoRetiro,
        tipoRetiroLabel: tipoInfo?.badgeLabel || formData.tipoRetiro,
        activo: formData.activo,
      });

      if (closeAfter) {
        setTimeout(() => {
          if (propOnSaved && savedId) propOnSaved(savedId);
          if (propOnCreated && savedId) propOnCreated(savedId);
          navigate('/servicio-campo/motivos-retiro');
        }, 600);
      }
    } catch (err: any) {
      console.error('Error al guardar motivo:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al comunicarse con el servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    setCurrentId(null);
    setFormData({
      nombre: '',
      tipoRetiro: 'AveriaTecnica',
      descripcion: '',
      activo: true,
    });
    setSavedHeader({
      nombre: '',
      tipoRetiro: 'AveriaTecnica',
      tipoRetiroLabel: 'Avería Técnica',
      activo: true,
    });
    setErrors({});
    setStatusMessage(null);
  };

  const handleBack = () => {
    if (propOnBack) {
      propOnBack();
    } else {
      navigate('/servicio-campo/motivos-retiro');
    }
  };

  const handleNew = () => {
    navigate('/servicio-campo/motivos-retiro/nuevo');
    handleResetForm();
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
    : savedHeader.nombre || (isEditMode ? 'Cargando...' : 'Nuevo motivo de retiro');

  const headerSubtitle = loading
    ? 'Cargando...'
    : isEditMode
      ? `Motivo de Retiro · Naturaleza: ${savedHeader.tipoRetiroLabel}`
      : 'Motivo sin guardar';

  const headerInitials = savedHeader.nombre ? getInitials(savedHeader.nombre) : 'MR';

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />

      {/* 0. Notification Message Bar */}
      {statusMessage && (
        <D365MessageBar
          intent={statusMessage.type === 'success' ? 'success' : 'error'}
          className={styles.messageBarContainer}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </D365MessageBar>
      )}

      {/* 1. Dynamics 365 Standard Command Bar */}
      <D365CommandBar
        ariaLabel="Comandos de motivo de retiro"
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
            onClick={() => {
              if (currentId) {
                setLoading(true);
                MotivoRetiroEquipoService.getMotivoPorId(currentId)
                  .then((d) => {
                    setFormData({
                      nombre: d.nombre,
                      tipoRetiro: d.tipoRetiro,
                      descripcion: d.descripcion || '',
                      activo: d.activo,
                    });
                  })
                  .finally(() => setLoading(false));
              } else {
                handleResetForm();
              }
            }}
            disabled={saving || loading}
            appearance="subtle"
          >
            Deshacer
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. D365 Entity Header (Static until save) */}
      <D365EntityHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        avatarName={headerTitle}
        avatarInitials={headerInitials}
        avatarSize={56}
        loading={loading}
        metadata={[
          {
            label: 'Naturaleza',
            value: savedHeader.tipoRetiroLabel || 'Avería Técnica',
          },
          {
            label: 'Estado',
            value: savedHeader.activo ? 'Activo' : 'Inactivo',
          },
        ]}
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as string)}
          >
            <Tab value="general">General</Tab>
          </TabList>
        }
      />

      {/* 3. Form Content Layout - Minimalista y limpio */}
      <D365FormContent busy={saving} className={styles.contentBody}>
        <div style={{ maxWidth: '820px' }}>
          <Card className={styles.card}>
            <Text className={styles.cardSectionTitle}>
              Información General
            </Text>

            {/* Nombre del Motivo (Sin Código) */}
            <D365FormField
              label="Nombre"
              required
              htmlFor="motivo-nombre"
              error={errors.nombre}
            >
              <Input
                id="motivo-nombre"
                size="medium"
                value={formData.nombre}
                onChange={(_, data) => handleInputChange('nombre', data.value)}
                disabled={saving || loading}
                className={styles.d365ControlFull}
              />
            </D365FormField>

            {/* Tipo / Naturaleza de Retiro */}
            <D365FormField
              label="Naturaleza"
              required
              htmlFor="motivo-tipo"
              error={errors.tipoRetiro}
            >
              <Select
                id="motivo-tipo"
                size="medium"
                value={formData.tipoRetiro}
                onChange={(_, data) =>
                  handleInputChange('tipoRetiro', data.value as TipoRetiroEquipo)
                }
                disabled={saving || loading}
                className={styles.d365ControlFull}
              >
                {Object.values(TIPOS_RETIRO_EQUIPO_INFO).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </D365FormField>

            {/* Estado */}
            <D365FormField
              label="Estado"
              htmlFor="motivo-activo"
            >
              <Switch
                id="motivo-activo"
                checked={formData.activo}
                onChange={(_, data) => handleInputChange('activo', data.checked)}
                disabled={saving || loading}
                label={formData.activo ? 'Activo' : 'Inactivo'}
              />
            </D365FormField>

            {/* Descripción */}
            <D365FormField
              label="Descripción"
              htmlFor="motivo-descripcion"
              align="top"
            >
              <Textarea
                id="motivo-descripcion"
                value={formData.descripcion}
                onChange={(_, data) => handleInputChange('descripcion', data.value)}
                disabled={saving || loading}
                rows={3}
                className={styles.d365ControlFull}
              />
            </D365FormField>
          </Card>
        </div>
      </D365FormContent>
    </div>
  );
};
