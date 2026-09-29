import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Textarea,
  TabList,
  Tab,
  Card,
  Text,
  Label,
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
} from '@fluentui/react-icons';
import { UnidadMedidaService } from '../services/unidadMedida.service';
import type { CreateUnidadMedidaDto } from '../types/unidadMedida.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';

export interface UnidadMedidaFormPageProps {
  id?: string | null;
  onBack?: () => void;
  onSaved?: (savedId: string) => void;
  onCreated?: (createdId: string) => void;
}

export const UnidadMedidaFormPage: React.FC<UnidadMedidaFormPageProps> = ({
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

  const [formData, setFormData] = useState<CreateUnidadMedidaDto>({
    codigo: '',
    nombre: '',
    abreviatura: '',
    descripcion: '',
  });

  const [savedHeader, setSavedHeader] = useState<{
    nombre: string;
    codigo: string;
    activo: boolean;
  }>({
    nombre: '',
    codigo: '',
    activo: true,
  });

  const [loading, setLoading] = useState<boolean>(Boolean(effectiveId));
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleResetForm = () => {
    setCurrentId(null);
    setFormData({
      codigo: '',
      nombre: '',
      abreviatura: '',
      descripcion: '',
    });
    setSavedHeader({
      nombre: '',
      codigo: '',
      activo: true,
    });
    setErrors({});
    setStatusMessage(null);
  };

  useEffect(() => {
    if (effectiveId) {
      setCurrentId(effectiveId);
      setLoading(true);
      UnidadMedidaService.getUnidadMedidaById(effectiveId)
        .then((u) => {
          setFormData({
            codigo: u.codigo,
            nombre: u.nombre,
            abreviatura: u.abreviatura,
            descripcion: u.descripcion || '',
          });
          setSavedHeader({
            nombre: u.nombre,
            codigo: u.codigo,
            activo: u.activo,
          });
        })
        .catch((err) => {
          setStatusMessage({
            type: 'error',
            text: `Error al cargar la unidad de medida: ${err?.message || 'Error desconocido'}`,
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
      newErrors.codigo = 'El código de la unidad es obligatorio (ej: UND, MTR, KGM)';
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la unidad es obligatorio';
    }
    if (!formData.abreviatura.trim()) {
      newErrors.abreviatura = 'La abreviatura es obligatoria (ej: und, m, kg)';
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
        await UnidadMedidaService.updateUnidadMedida(currentId, {
          nombre: formData.nombre,
          abreviatura: formData.abreviatura,
          descripcion: formData.descripcion,
        });
        setStatusMessage({
          type: 'success',
          text: `Unidad de medida "${formData.nombre}" actualizada con éxito.`,
        });
      } else {
        const res = await UnidadMedidaService.createUnidadMedida(formData);
        savedId = res.id;
        setCurrentId(res.id);
        setStatusMessage({
          type: 'success',
          text: `Unidad de medida "${formData.nombre}" creada con éxito.`,
        });
        if (!closeAfter) {
          navigate(`/servicio-campo/unidades-medida/${res.id}`, { replace: true });
        }
      }

      setSavedHeader({
        nombre: formData.nombre,
        codigo: formData.codigo,
        activo: true,
      });

      if (closeAfter) {
        setTimeout(() => {
          if (propOnSaved) propOnSaved(savedId || '');
          if (propOnCreated) propOnCreated(savedId || '');
          navigate('/servicio-campo/unidades-medida');
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
    else navigate('/servicio-campo/unidades-medida');
  };

  const handleNew = () => {
    navigate('/servicio-campo/unidades-medida/nuevo');
    handleResetForm();
  };

  const headerTitle = loading
    ? 'Cargando...'
    : savedHeader.nombre || (isEditMode ? 'Cargando...' : 'Nueva Unidad de Medida');

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
        ariaLabel="Comandos de unidad de medida"

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
        subtitle={savedHeader.codigo
          ? `Código: ${savedHeader.codigo} • Abreviatura: ${formData.abreviatura || '—'}`
          : 'Unidad de medida • Catálogo de inventario'}
        avatarName={savedHeader.nombre || 'U M'}
        avatarSize={56}
        subtleAvatar
        loading={loading}
        metadata={[
          { label: 'Estado', value: savedHeader.activo ? 'Activo' : 'Inactivo' },
        ]}
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
                  <SkeletonItem size={32} className={styles.skeletonFull} />
                </div>
              </Skeleton>
            </Card>
          </div>
        </div>
      ) : (
        <div className={styles.contentBody}>
          <div className={styles.grid2Cols}>
            {/* Sección: Identificación y Parámetros */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Datos Principales</Text>

              {/* Código */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label required size="medium" htmlFor="um-codigo">
                    Código
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Input
                    id="um-codigo"
                    appearance="outline"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.codigo}
                    placeholder="Ej: UND, MTR, KGM, LTR, PZA..."
                    disabled={isEditMode}
                    onChange={(_, data) => {
                      setFormData({ ...formData, codigo: data.value.toUpperCase() });
                      if (errors.codigo && data.value.trim()) {
                        setErrors((prev) => ({ ...prev, codigo: '' }));
                      }
                    }}
                  />
                  {errors.codigo && (
                    <Text size={100} className={styles.fieldErrorText}>{errors.codigo}</Text>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label required size="medium" htmlFor="um-nombre">
                    Nombre
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Input
                    id="um-nombre"
                    appearance="outline"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.nombre}
                    placeholder="Ej: Unidades, Metros, Kilogramos, Rollos..."
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

              {/* Abreviatura */}
              <div className={styles.d365FieldRow}>
                <div className={styles.d365LabelCol}>
                  <Label required size="medium" htmlFor="um-abrev">
                    Abreviatura
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Input
                    id="um-abrev"
                    appearance="outline"
                    size="medium"
                    className={styles.d365ControlFull}
                    value={formData.abreviatura}
                    placeholder="Ej: und, m, kg, ltr, pza..."
                    onChange={(_, data) => {
                      setFormData({ ...formData, abreviatura: data.value });
                      if (errors.abreviatura && data.value.trim()) {
                        setErrors((prev) => ({ ...prev, abreviatura: '' }));
                      }
                    }}
                  />
                  {errors.abreviatura && (
                    <Text size={100} className={styles.fieldErrorText}>{errors.abreviatura}</Text>
                  )}
                </div>
              </div>

            </Card>

            {/* Sección: Descripción rápida */}
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>Información Adicional</Text>

              <div className={styles.d365FieldRowTop}>
                <div className={styles.d365LabelColTop}>
                  <Label size="medium" htmlFor="um-desc">
                    Descripción
                  </Label>
                </div>
                <div className={styles.d365ControlCol}>
                  <Textarea
                    id="um-desc"
                    appearance="outline"
                    size="medium"
                    rows={5}
                    className={styles.d365ControlFull}
                    value={formData.descripcion || ''}
                    placeholder="Observaciones de uso en inventarios, órdenes de trabajo y despacho..."
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

export default UnidadMedidaFormPage;
