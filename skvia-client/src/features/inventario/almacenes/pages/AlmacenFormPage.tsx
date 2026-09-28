import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Button,
  Input,
  Select,
  TabList,
  Tab,
  Text,
  Label,
  Avatar,
  Spinner,
  MessageBar,
  MessageBarBody,
  Badge,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  Building16Regular,
  VehicleTruckProfile16Regular,
  Checkmark16Regular,
  DismissCircle16Regular,
} from '@fluentui/react-icons';
import { AlmacenService } from '../services/almacen.service';
import type {
  CreateAlmacenDto,
  RecursoLookupDto,
  SucursalLookupDto,
} from '../types/almacen.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';

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

  // Form State
  const [formData, setFormData] = useState<CreateAlmacenDto>({
    codigo: '',
    nombre: '',
    tipo: 'Fisico',
    sucursalId: '',
    recursoId: '',
    direccion: '',
    telefono: '',
  });

  const [savedHeader, setSavedHeader] = useState<{
    nombre: string;
    codigo: string;
    tipo: string;
    activo: boolean;
  }>({
    nombre: '',
    codigo: '',
    tipo: 'Fisico',
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

  // Catálogos auxiliares
  const [sucursales, setSucursales] = useState<SucursalLookupDto[]>([]);
  const [recursos, setRecursos] = useState<RecursoLookupDto[]>([]);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [sucursalesData, recursosData] = await Promise.all([
        AlmacenService.getSucursales().catch(() => []),
        AlmacenService.getRecursosDisponibles().catch(() => []),
      ]);
      setSucursales(sucursalesData);
      setRecursos(recursosData);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  }, []);

  const cargarAlmacen = useCallback(
    async (idToLoad: string) => {
      try {
        setLoading(true);
        setStatusMessage(null);
        const data = await AlmacenService.getAlmacenById(idToLoad);

        const tipoNorm =
          data.tipo === 'Movil' || data.tipo === 2 ? 'Movil' : 'Fisico';

        setFormData({
          codigo: data.codigo,
          nombre: data.nombre,
          tipo: tipoNorm,
          sucursalId: data.sucursalId || '',
          recursoId: data.recursoId || data.recursoTecnicoId || '',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
        });

        setSavedHeader({
          nombre: data.nombre,
          codigo: data.codigo,
          tipo: tipoNorm,
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
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    if (effectiveId) {
      cargarAlmacen(effectiveId);
    } else {
      setCurrentId(null);
      setFormData({
        codigo: '',
        nombre: '',
        tipo: 'Fisico',
        sucursalId: '',
        recursoId: '',
        direccion: '',
        telefono: '',
      });
      setSavedHeader({
        nombre: '',
        codigo: '',
        tipo: 'Fisico',
        activo: true,
      });
      setLoading(false);
    }
  }, [effectiveId, cargarAlmacen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código del almacén es obligatorio.';
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre del almacén es obligatorio.';
    }
    if (formData.tipo === 'Movil' && !formData.recursoId) {
      newErrors.recursoId = 'Debe asignar un técnico o cuadrilla responsable para el almacén móvil.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfterSave = false): Promise<string | null> => {
    if (!validate()) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor complete todos los campos requeridos.',
      });
      return null;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      if (isEditMode && currentId) {
        await AlmacenService.updateAlmacen(currentId, {
          nombre: formData.nombre,
          direccion: formData.direccion || null,
          telefono: formData.telefono || null,
          sucursalId: formData.sucursalId || null,
          recursoId: formData.recursoId || null,
        });

        setSavedHeader((prev) => ({
          ...prev,
          nombre: formData.nombre,
          tipo: String(formData.tipo),
        }));

        setStatusMessage({
          type: 'success',
          text: 'Almacén actualizado correctamente.',
        });

        if (propOnSaved) propOnSaved(currentId);

        if (closeAfterSave) {
          if (propOnBack) propOnBack();
          else navigate('/servicio-campo/almacenes');
        }

        return currentId;
      } else {
        const res = await AlmacenService.createAlmacen({
          codigo: formData.codigo,
          nombre: formData.nombre,
          tipo: formData.tipo,
          sucursalId: formData.sucursalId || null,
          direccion: formData.direccion || null,
          telefono: formData.telefono || null,
          recursoId: formData.recursoId || null,
        });

        setCurrentId(res.id);
        setSavedHeader({
          nombre: formData.nombre,
          codigo: formData.codigo,
          tipo: String(formData.tipo),
          activo: true,
        });

        setStatusMessage({
          type: 'success',
          text: 'Almacén creado exitosamente.',
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

  const esMovil = formData.tipo === 'Movil' || formData.tipo === 2;

  return (
    <div className={styles.root}>
      {/* 1. D365 Standard Command Bar */}
      <Toolbar className={styles.commandBar} aria-label="Comandos de Almacén">
        <div className={styles.toolbarLeft}>
          <ToolbarButton
            icon={<ArrowLeft16Regular />}
            onClick={handleBack}
            title="Volver a la lista de almacenes"
          >
            Atrás
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton
            icon={<Save16Regular className={styles.iconPrimary} />}
            appearance="subtle"
            onClick={() => handleSave(false)}
            disabled={saving || loading}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </ToolbarButton>

          <ToolbarButton
            icon={<SaveMultiple16Regular />}
            appearance="subtle"
            onClick={() => handleSave(true)}
            disabled={saving || loading}
          >
            Guardar y cerrar
          </ToolbarButton>

          <ToolbarDivider />

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
              cargarCatalogos();
            }}
            disabled={saving || loading}
          >
            Actualizar
          </ToolbarButton>
        </div>
      </Toolbar>

      {/* Mensajes de Feedback */}
      {statusMessage && (
        <MessageBar
          intent={statusMessage.type}
          className={styles.messageBarContainer}
        >
          <MessageBarBody>{statusMessage.text}</MessageBarBody>
        </MessageBar>
      )}

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
                  name={isEditMode ? savedHeader.nombre : 'Nuevo Almacén'}
                  className={styles.avatar}
                  size={48}
                  icon={
                    esMovil ? (
                      <VehicleTruckProfile16Regular />
                    ) : (
                      <Building16Regular />
                    )
                  }
                />
                <div className={styles.titleSection}>
                  <Text className={styles.mainTitle}>
                    {isEditMode
                      ? savedHeader.nombre || 'Sin Nombre'
                      : 'Nuevo Almacén / Bodega'}
                  </Text>
                  <Text className={styles.subTitle}>
                    {isEditMode
                      ? `${savedHeader.tipo === 'Movil' ? 'Móvil (Vehículo de Ruta)' : 'Físico (Sede Central)'} • Código: ${savedHeader.codigo}`
                      : 'Registro de centro logístico o almacén móvil'}
                  </Text>
                </div>
              </div>

              {/* Header Right Meta Items */}
              <div className={styles.headerMetaRight}>
                <div className={styles.metaItem}>
                  <Text className={styles.metaLabel}>Tipo</Text>
                  <Text className={styles.metaValue}>
                    {esMovil ? 'Móvil' : 'Físico'}
                  </Text>
                </div>

                <div className={styles.metaDivider} />

                <div className={styles.metaItem}>
                  <Text className={styles.metaLabel}>Estado</Text>
                  <div style={{ marginTop: 2 }}>
                    <Badge
                      appearance="filled"
                      color={savedHeader.activo ? 'success' : 'informative'}
                      icon={
                        savedHeader.activo ? (
                          <Checkmark16Regular />
                        ) : (
                          <DismissCircle16Regular />
                        )
                      }
                    >
                      {savedHeader.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* D365 Tabs Navigation */}
            <TabList
              selectedValue={selectedTab}
              onTabSelect={(_e, d) => setSelectedTab(d.value as string)}
              className={styles.tabList}
            >
              <Tab value="general">Información General</Tab>
              {isEditMode && <Tab value="existencias">Existencias & Stock</Tab>}
            </TabList>
          </div>

          {/* 3. D365 Form Body Content */}
          <div className={styles.contentBody}>
            {selectedTab === 'general' ? (
              <div className={styles.grid2Cols}>
                {/* Columna Izquierda: Datos Principales */}
                <div className={styles.card}>
                  <Text className={styles.cardSectionTitle}>
                    Identificación y Clasificación
                  </Text>

                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label required>Código</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.codigo}
                        onChange={(_e, d) =>
                          setFormData((prev) => ({
                            ...prev,
                            codigo: d.value.toUpperCase(),
                          }))
                        }
                        placeholder="Ej: ALM-BASE-LIM, MOVIL-TEC-01"
                        disabled={isEditMode}
                      />
                      {errors.codigo && (
                        <Text className={styles.fieldErrorText}>
                          {errors.codigo}
                        </Text>
                      )}
                    </div>
                  </div>

                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label required>Nombre</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.nombre}
                        onChange={(_e, d) =>
                          setFormData((prev) => ({ ...prev, nombre: d.value }))
                        }
                        placeholder="Ej: Almacén Central Lima, Móvil Huacho"
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
                      <Label required>Tipo Almacén</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <Select
                        className={styles.d365ControlFull}
                        value={String(formData.tipo)}
                        onChange={(_e, d) =>
                          setFormData((prev) => ({
                            ...prev,
                            tipo: d.value as any,
                          }))
                        }
                        disabled={isEditMode}
                      >
                        <option value="Fisico">Físico (Sede / Bodega Central)</option>
                        <option value="Movil">Móvil (Vehículo / Técnico en Ruta)</option>
                      </Select>
                      <Text size={200} style={{ color: '#707070', marginTop: 2 }}>
                        {esMovil
                          ? 'Almacén custodio sobre ruedas para técnicos y cuadrillas.'
                          : 'Instalación física fija vinculable a una sede o sucursal corporativa.'}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Asignación y Ubicación */}
                <div className={styles.card}>
                  <Text className={styles.cardSectionTitle}>
                    {esMovil
                      ? 'Custodia y Técnico Responsable'
                      : 'Ubicación y Sede Corporativa'}
                  </Text>

                  {/* Campo de Sucursal */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label>Sucursal (Sede)</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <Select
                        className={styles.d365ControlFull}
                        value={formData.sucursalId || ''}
                        onChange={(_e, d) =>
                          setFormData((prev) => ({
                            ...prev,
                            sucursalId: d.value || null,
                          }))
                        }
                      >
                        <option value="">(Ninguna sede asignada)</option>
                        {sucursales.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} ({s.codigo})
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Campo de Recurso */}
                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label required={esMovil}>
                        {esMovil
                          ? 'Técnico / Responsable'
                          : 'Responsable (Opcional)'}
                      </Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <Select
                        className={styles.d365ControlFull}
                        value={formData.recursoId || ''}
                        onChange={(_e, d) =>
                          setFormData((prev) => ({
                            ...prev,
                            recursoId: d.value || null,
                          }))
                        }
                      >
                        <option value="">(Seleccione un responsable)</option>
                        {recursos.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nombreCompleto} ({r.codigo})
                          </option>
                        ))}
                      </Select>
                      {errors.recursoId && (
                        <Text className={styles.fieldErrorText}>
                          {errors.recursoId}
                        </Text>
                      )}
                    </div>
                  </div>

                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label>Dirección</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.direccion || ''}
                        onChange={(_e, d) =>
                          setFormData((prev) => ({
                            ...prev,
                            direccion: d.value,
                          }))
                        }
                        placeholder="Ej: Av. Javier Prado Este 444, San Isidro"
                      />
                    </div>
                  </div>

                  <div className={styles.d365FieldRow}>
                    <div className={styles.d365LabelCol}>
                      <Label>Teléfono</Label>
                    </div>
                    <div className={styles.d365ControlCol}>
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.telefono || ''}
                        onChange={(_e, d) =>
                          setFormData((prev) => ({
                            ...prev,
                            telefono: d.value,
                          }))
                        }
                        placeholder="Ej: +51 987 654 321"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Existencias & Stock */
              <div className={styles.card}>
                <Text className={styles.cardSectionTitle}>
                  Monitoreo de Existencias en Este Almacén
                </Text>
                <Text size={300} style={{ color: '#605e5c', marginBottom: 16 }}>
                  Este almacén custodia existencias y materiales serializados. Para consultar el detalle
                  por producto o emitir transferencias de entrada/salida, ingrese a la vista de Control de Stock.
                </Text>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Button
                    appearance="primary"
                    onClick={() => navigate('/servicio-campo/stock')}
                  >
                    Ver Control de Stock Global
                  </Button>
                  {esMovil && (
                    <Button
                      appearance="secondary"
                      onClick={() => navigate('/servicio-campo/stock-tecnicos')}
                    >
                      Ver Saldo de Técnicos en Ruta
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
