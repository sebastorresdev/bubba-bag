import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Textarea,
  Select,
  Spinner,
  TabList,
  Tab,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Badge,
  tokens,
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
  Box16Regular,
  Info16Regular,
  DocumentBulletList16Regular,
  Location16Regular,
  People16Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { AlmacenConfiguracion } from '../components/AlmacenConfiguracion';
import { AlmacenService } from '../services/almacen.service';
import type {
  CreateAlmacenDto,
  UnidadOrganizativaDto,
  RecursoTecnicoDto,
  TipoAlmacen,
} from '../types/almacen.types';
import { InventarioProductoService } from '../../inventario-productos/services/inventario-producto.service';
import type { InventarioProductoDto } from '../../inventario-productos/types/inventario-producto.types';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { getCurrentUserSession } from '../../../../services/sessionService';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { useCurrentUser } from '../../../../hooks/useCurrentUser';

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
  const user = useCurrentUser();
  const esAdminAlmacenes =
    user.isAuthenticated &&
    user.roles.some((r) =>
      ['SuperAdmin', 'ServicioCampoAdmin', 'InventarioAdmin'].includes(r)
    );

  const effectiveId =
    propAlmacenId !== undefined
      ? propAlmacenId
      : routeId && routeId !== 'nuevo'
      ? routeId
      : null;

  const [currentId, setCurrentId] = useState<string | null>(effectiveId);
  const isEditMode = Boolean(currentId);

  // Tab State: standard D365 tabs
  const [selectedTab, setSelectedTab] = useState<
    'general' | 'existencias' | 'detalle' | 'configuracion' | 'ubicaciones' | 'autorizados'
  >('general');

  // Catálogos reales desde la API
  const [unidades, setUnidades] = useState<UnidadOrganizativaDto[]>([]);
  const [puedeSupervisar, setPuedeSupervisar] = useState(false);
  const [recursos, setRecursos] = useState<RecursoTecnicoDto[]>([]);

  // Form State
  const [formData, setFormData] = useState<CreateAlmacenDto>({
    nombre: '',
    descripcion: '',
    codigo: '',
    tipo: 1 as TipoAlmacen,
    unidadOrganizativaId: '',
    recursoId: '',
  });

  const [savedHeader, setSavedHeader] = useState<{
    id?: string;
    nombre: string;
    tipo: TipoAlmacen;
    activo: boolean;
    creadoPorNombre: string;
    fechaCreacion?: string;
  }>({
    nombre: '',
    tipo: 1,
    activo: true,
    creadoPorNombre: currentUser.nombre,
  });

  // Stock / Existencias en este almacén
  const [existencias, setExistencias] = useState<InventarioProductoDto[]>([]);
  const [cargandoExistencias, setCargandoExistencias] = useState<boolean>(false);
  const [filtroStock, setFiltroStock] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar catálogos reales
  const cargarCatalogos = useCallback(async () => {
    try {
      const [unids, recs] = await Promise.all([
        AlmacenService.getUnidadesOrganizativas(),
        AlmacenService.getRecursosTecnicos(),
      ]);
      setUnidades(unids || []);
      setRecursos(recs || []);
    } catch (err) {
      console.error('Error al cargar catálogos organizacionales:', err);
    }
  }, []);

  useEffect(() => {
    void cargarCatalogos();
  }, [cargarCatalogos]);

  // Si se está creando un almacén o es de tipo custodia personal, restringir pestañas inactivas
  useEffect(() => {
    if (!currentId && selectedTab !== 'general') {
      setSelectedTab('general');
    } else if (formData.tipo === 2 && selectedTab === 'autorizados') {
      setSelectedTab('general');
    }
  }, [currentId, formData.tipo, selectedTab]);

  // Cargar existencias cuando se selecciona la pestaña
  const cargarExistencias = useCallback(async (almacenId: string) => {
    if (!almacenId) return;
    try {
      setCargandoExistencias(true);
      const stock = await InventarioProductoService.obtener(almacenId);
      setExistencias(stock || []);
    } catch (err) {
      console.error('Error al cargar existencias del almacén:', err);
    } finally {
      setCargandoExistencias(false);
    }
  }, []);

  const cargarAlmacen = useCallback(
    async (idToLoad: string) => {
      try {
        setCurrentId(idToLoad);
        setLoading(true);
        const data = await AlmacenService.getAlmacenById(idToLoad);

        setPuedeSupervisar(Boolean(data.esSupervisor));
        setFormData({
          nombre: data.nombre,
          descripcion: data.descripcion || '',
          codigo: data.codigo || '',
          tipo: (data.tipo || 1) as TipoAlmacen,
          unidadOrganizativaId: data.unidadOrganizativaId || '',
          recursoId: data.recursoId || '',
        });

        setSavedHeader({
          id: data.id,
          nombre: data.nombre,
          tipo: (data.tipo || 1) as TipoAlmacen,
          activo: data.activo,
          creadoPorNombre: data.creadoPorNombre || 'Sistema',
          fechaCreacion: data.createdAt,
        });

        // Pre-cargar existencias
        void cargarExistencias(idToLoad);
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
    [cargarExistencias]
  );

  useEffect(() => {
    if (effectiveId) {
      void cargarAlmacen(effectiveId);
    } else {
      setCurrentId(null);
      setFormData({
        nombre: '',
        descripcion: '',
        codigo: '',
        tipo: 1,
        unidadOrganizativaId: '',
        recursoId: '',
      });
      setSavedHeader({
        nombre: '',
        tipo: 1,
        activo: true,
        creadoPorNombre: currentUser.nombre,
      });
      setExistencias([]);
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

    if (!formData.unidadOrganizativaId) newErrors.unidadOrganizativaId = 'Seleccione una unidad organizativa.';
    if (formData.tipo === 2) {
      if (!formData.recursoId) {
        newErrors.recursoId = 'La custodia personal requiere un recurso técnico responsable.';
      } else {
        const rec = recursos.find((r) => r.id === formData.recursoId);
        if (rec?.almacenMovilId && rec.almacenMovilId !== currentId) {
          newErrors.recursoId = 'Este técnico ya cuenta con un almacén de custodia personal activo.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfterSave = false): Promise<string | null> => {
    if (!validate()) {
      setSelectedTab('general');
      setStatusMessage({
        type: 'error',
        text: 'Por favor complete todos los campos obligatorios en la pestaña General.',
      });
      return null;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        codigo: formData.codigo?.trim() || null,
        tipo: formData.tipo,
        unidadOrganizativaId: formData.unidadOrganizativaId || null,
        recursoId: formData.recursoId || null,
      };

      if (isEditMode && currentId) {
        await AlmacenService.updateAlmacen(currentId, payload);

        setSavedHeader((prev) => ({
          ...prev,
          nombre: formData.nombre.trim(),
          tipo: formData.tipo || 1,
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
        const res = await AlmacenService.createAlmacen(payload);

        setCurrentId(res.id);
        setSavedHeader({
          id: res.id,
          nombre: formData.nombre.trim(),
          tipo: formData.tipo || 1,
          activo: true,
          creadoPorNombre: currentUser.nombre,
          fechaCreacion: new Date().toISOString(),
        });

        const successMessage = `Almacén "${formData.nombre.trim()}" creado exitosamente.`;
        setStatusMessage({
          type: 'success',
          text: successMessage,
        });

        if (propOnCreated) propOnCreated(res.id);
        if (propAlmacenId !== undefined && propOnCreated) return res.id;

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
    if (propAlmacenId !== undefined) {
      setCurrentId(null);
      setFormData({
        nombre: '',
        descripcion: '',
        codigo: '',
        tipo: 1,
        unidadOrganizativaId: '',
        recursoId: '',
      });
      setErrors({});
      setStatusMessage(null);
      setSelectedTab('general');
      return;
    }
    navigate('/servicio-campo/almacenes/nuevo');
  };

  // Filtrar recursos según el tipo de almacén y la unidad organizativa
  const recursosDisponibles = useMemo(() => {
    return recursos.filter((r) => {
      // Si el almacén es móvil, debe ser tipo 1 (Técnico)
      if (formData.tipo === 2 && (r as any).tipo && (r as any).tipo !== 1) {
        return false;
      }
      // Si tiene unidad seleccionada, dar preferencia o filtrar
      if (formData.unidadOrganizativaId && r.unidadOrganizativaId) {
        return r.unidadOrganizativaId === formData.unidadOrganizativaId;
      }
      return true;
    });
  }, [recursos, formData.tipo, formData.unidadOrganizativaId]);

  // Filtrar solo líneas con stock positivo real
  const existenciasConStock = useMemo(() => {
    return existencias.filter((e) => e.cantidadTotal > 0 || e.cantidadDisponible > 0);
  }, [existencias]);

  // Filtrado en memoria de existencias
  const existenciasFiltradas = useMemo(() => {
    if (!filtroStock.trim()) return existenciasConStock;
    const term = filtroStock.toLowerCase();
    return existenciasConStock.filter(
      (e) =>
        e.nombreProducto.toLowerCase().includes(term) ||
        (e.codigoProducto && e.codigoProducto.toLowerCase().includes(term))
    );
  }, [existenciasConStock, filtroStock]);

  return (
    <div className={styles.root}>
      {statusMessage && (
        <D365MessageBar
          intent={statusMessage.type}
          className={styles.messageBarContainer}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </D365MessageBar>
      )}

      <D365CommandBar
        ariaLabel="Comandos de Almacén"
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
            appearance="subtle"
            onClick={() => handleSave(false)}
            disabled={saving || loading}
          >
            Guardar
          </D365CommandButton>

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
              void cargarCatalogos();
              if (currentId) void cargarAlmacen(currentId);
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
          <D365EntityHeader
            title={isEditMode ? savedHeader.nombre || 'Almacén' : 'Nuevo Almacén'}
            subtitle={savedHeader.tipo === 2 ? 'Custodia personal de Técnico de Campo' : 'Bodega'}
            avatarName={savedHeader.nombre || 'Almacén'}
            avatarIcon={<Building16Regular />}
            avatarSize={48}
            metadata={[
              {
                label: 'Tipo',
                value: savedHeader.tipo === 2 ? 'Custodia personal' : 'Bodega',
              },
              { label: 'Estado', value: savedHeader.activo ? 'Activo' : 'Inactivo' },
              ...(isEditMode
                ? [{ label: 'Artículos en stock', value: String(existenciasConStock.length) }]
                : []),
            ]}
            tabs={
              <TabList
                selectedValue={selectedTab}
                onTabSelect={(_, data) =>
                  setSelectedTab(
                    data.value as
                      | 'general'
                      | 'existencias'
                      | 'detalle'
                      | 'configuracion'
                      | 'ubicaciones'
                      | 'autorizados'
                  )
                }
              >
                <Tab value="general" icon={<Box16Regular />}>
                  General
                </Tab>
                {currentId && (
                  <Tab value="existencias" icon={<DocumentBulletList16Regular />}>
                    Existencias / Stock
                  </Tab>
                )}
                {currentId && (
                  <Tab value="ubicaciones" icon={<Location16Regular />}>
                    Ubicaciones
                  </Tab>
                )}
                {currentId && formData.tipo !== 2 && (esAdminAlmacenes || puedeSupervisar) && (
                  <Tab value="autorizados" icon={<People16Regular />}>
                    Usuarios autorizados
                  </Tab>
                )}
                {currentId && (
                  <Tab value="detalle" icon={<Info16Regular />}>
                    Detalle / Auditoría
                  </Tab>
                )}
              </TabList>
            }
          />

          <div className={styles.contentBody}>
            {/* PESTAÑA: UBICACIONES */}
            {selectedTab === 'ubicaciones' && currentId && (
              <AlmacenConfiguracion
                almacenId={currentId}
                puedeSupervisar={puedeSupervisar}
                vista="ubicaciones"
                tipoAlmacen={formData.tipo}
              />
            )}

            {/* PESTAÑA: USUARIOS AUTORIZADOS */}
            {selectedTab === 'autorizados' && currentId && formData.tipo !== 2 && (
              <AlmacenConfiguracion
                almacenId={currentId}
                puedeSupervisar={puedeSupervisar}
                vista="autorizaciones"
                tipoAlmacen={formData.tipo}
              />
            )}

            {/* RETROCOMPATIBILIDAD CONFIGURACIÓN */}
            {selectedTab === 'configuracion' && currentId && (
              <AlmacenConfiguracion
                almacenId={currentId}
                puedeSupervisar={puedeSupervisar}
                vista="todas"
                tipoAlmacen={formData.tipo}
              />
            )}
            {/* PESTAÑA 1: GENERAL */}
            {selectedTab === 'general' && (
              <div className={styles.card}>
                <div className={styles.grid2Cols}>
                  <D365FormField label="Nombre del almacén" required error={errors.nombre}>
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
                    />
                  </D365FormField>

                  <D365FormField label="Código identificador">
                    <Input
                      className={styles.d365ControlFull}
                      value={formData.codigo || ''}
                      maxLength={30}
                      onChange={(_e, d) => setFormData((prev) => ({ ...prev, codigo: d.value }))}
                    />
                  </D365FormField>

                  <D365FormField label="Tipo de almacén" required>
                    <Select
                      className={styles.d365ControlFull}
                      value={String(formData.tipo || 1)}
                      disabled={isEditMode}
                      onChange={(_e, d) => {
                        const nuevoTipo = Number(d.value) as TipoAlmacen;
                        setFormData((prev) => ({
                          ...prev,
                          tipo: nuevoTipo,
                          recursoId: nuevoTipo === 1 ? '' : prev.recursoId,
                        }));
                      }}
                    >
                      <option value="1">Bodega</option>
                      <option value="2">Custodia personal</option>
                    </Select>
                  </D365FormField>

                  <D365FormField label="Unidad organizativa" required error={errors.unidadOrganizativaId}>
                    <Select
                      className={styles.d365ControlFull}
                      value={formData.unidadOrganizativaId || ''}
                      disabled={isEditMode}
                      onChange={(_e, d) =>
                        setFormData((prev) => ({ ...prev, unidadOrganizativaId: d.value }))
                      }
                    >
                      <option value="">Seleccione sede organizacional...</option>
                      {unidades.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.codigo})
                        </option>
                      ))}
                    </Select>
                  </D365FormField>

                  {formData.tipo === 2 && (
                    <D365FormField
                      label="Técnico responsable de custodia"
                      required
                      error={errors.recursoId}
                    >
                      <Select
                        className={styles.d365ControlFull}
                        value={formData.recursoId || ''}
                        disabled={isEditMode}
                        onChange={(_e, d) => {
                          setFormData((prev) => ({ ...prev, recursoId: d.value }));
                          if (errors.recursoId) {
                            setErrors((prev) => ({ ...prev, recursoId: '' }));
                          }
                        }}
                      >
                        <option value="">Seleccione el recurso técnico asignado...</option>
                        {recursosDisponibles.map((r) => {
                          const tieneCustodia = Boolean(r.almacenMovilId && r.almacenMovilId !== currentId);
                          return (
                            <option key={r.id} value={r.id} disabled={tieneCustodia}>
                              {r.nombreCompleto} ({r.codigo}){tieneCustodia ? ' — [Ya tiene custodia activa]' : ''}
                            </option>
                          );
                        })}
                      </Select>
                    </D365FormField>
                  )}
                </div>

                <div style={{ marginTop: 16 }}>
                  <D365FormField label="Descripción u observaciones" align="top">
                    <Textarea
                      className={styles.d365ControlFull}
                      rows={4}
                      maxLength={500}
                      value={formData.descripcion || ''}
                      onChange={(_e, d) =>
                        setFormData((prev) => ({ ...prev, descripcion: d.value }))
                      }
                    />
                  </D365FormField>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: EXISTENCIAS / STOCK */}
            {selectedTab === 'existencias' && currentId && (
              <div className={styles.card}>
                {!isEditMode ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    <Box16Regular style={{ fontSize: 32, marginBottom: 8 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Guarde el almacén para consultar existencias.</p>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <span style={{ fontSize: 13, color: tokens.colorNeutralForeground3 }}>
                        Total líneas con stock: <strong>{existenciasFiltradas.length}</strong>
                      </span>
                      <Input
                        contentBefore={<Search16Regular />}
                        placeholder="Buscar por producto o código..."
                        aria-label="Buscar producto o código"
                        value={filtroStock}
                        onChange={(_e, d) => setFiltroStock(d.value)}
                        style={{ width: 280 }}
                      />
                    </div>

                    {cargandoExistencias ? (
                      <div style={{ padding: 24, textAlign: 'center' }}>
                        <Spinner label="Cargando existencias..." size="small" />
                      </div>
                    ) : existenciasFiltradas.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                        <p style={{ margin: 0, fontWeight: 500 }}>{filtroStock ? 'Sin resultados.' : 'No hay existencias.'}</p>
                      </div>
                    ) : (
                      <Table aria-label="Existencias del almacén">
                        <TableHeader>
                          <TableRow>
                            <TableHeaderCell>Código</TableHeaderCell>
                            <TableHeaderCell>Producto</TableHeaderCell>
                            <TableHeaderCell>Ubicación</TableHeaderCell>
                            <TableHeaderCell>Condición</TableHeaderCell>
                            <TableHeaderCell>Control</TableHeaderCell>
                            <TableHeaderCell style={{ textAlign: 'right' }}>Disponible</TableHeaderCell>
                            <TableHeaderCell style={{ textAlign: 'right' }}>Reservado</TableHeaderCell>
                            <TableHeaderCell style={{ textAlign: 'right' }}>Total</TableHeaderCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {existenciasFiltradas.map((item) => (
                            <TableRow key={item.stockId || item.productoId}>
                              <TableCell>
                                <TableCellLayout>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                    {item.codigoProducto || '—'}
                                  </span>
                                </TableCellLayout>
                              </TableCell>
                              <TableCell>
                                <TableCellLayout>
                                  <strong>{item.nombreProducto}</strong>
                                </TableCellLayout>
                              </TableCell>
                              <TableCell>{item.nombreUbicacion || '—'}</TableCell>
                              <TableCell>
                                {item.condicion === 'Utilizable' ? (
                                  <Badge appearance="tint" shape="rounded" color="success">
                                    Utilizable
                                  </Badge>
                                ) : item.condicion ? (
                                  <Badge appearance="tint" shape="rounded" color="danger">
                                    {item.condicion}
                                  </Badge>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                              <TableCell>
                                {item.esSerializado ? (
                                  <Badge appearance="tint" shape="rounded" color="brand">
                                    Seriado
                                  </Badge>
                                ) : (
                                  <Badge appearance="tint" shape="rounded" color="subtle">
                                    No seriado
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell style={{ textAlign: 'right' }}>
                                <Badge
                                  appearance="tint"
                                  shape="rounded"
                                  color={item.cantidadDisponible > 0 ? 'success' : 'subtle'}
                                >
                                  {item.cantidadDisponible} {item.nombreUnidadMedida || 'UND'}
                                </Badge>
                              </TableCell>
                              <TableCell style={{ textAlign: 'right' }}>
                                {item.cantidadReservada > 0 ? (
                                  <Badge appearance="tint" shape="rounded" color="warning">
                                    {item.cantidadReservada} {item.nombreUnidadMedida || 'UND'}
                                  </Badge>
                                ) : (
                                  `0 ${item.nombreUnidadMedida || 'UND'}`
                                )}
                              </TableCell>
                              <TableCell style={{ textAlign: 'right', fontWeight: 600 }}>
                                {item.cantidadTotal} {item.nombreUnidadMedida || 'UND'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: DETALLE / AUDITORÍA */}
            {selectedTab === 'detalle' && currentId && (
              <div className={styles.card}>
                <div className={styles.grid2Cols}>
                  <D365FormField label="Creado por">
                    <Input
                      className={styles.d365ControlFull}
                      value={savedHeader.creadoPorNombre || currentUser.nombre || 'SuperAdmin'}
                      appearance="filled-darker"
                      readOnly
                      contentAfter={
                        <LockClosed16Regular
                          title="Campo de auditoría del sistema"
                          aria-label="Campo de solo lectura"
                        />
                      }
                    />
                  </D365FormField>

                  <D365FormField label="Estado del registro">
                    <Input
                      className={styles.d365ControlFull}
                      value={savedHeader.activo ? 'Activo' : 'Inactivo'}
                      appearance="filled-darker"
                      readOnly
                      contentAfter={
                        <LockClosed16Regular
                          title="Gestionado con los comandos de estado"
                          aria-label="Campo de solo lectura"
                        />
                      }
                    />
                  </D365FormField>

                  {savedHeader.fechaCreacion && (
                    <D365FormField label="Fecha de registro">
                      <Input
                        className={styles.d365ControlFull}
                        value={new Date(savedHeader.fechaCreacion).toLocaleString()}
                        appearance="filled-darker"
                        readOnly
                        contentAfter={
                          <LockClosed16Regular
                            title="Fecha generada por el sistema"
                            aria-label="Campo de solo lectura"
                          />
                        }
                      />
                    </D365FormField>
                  )}

                  {savedHeader.id && (
                    <D365FormField label="Identificador del sistema (ID)">
                      <Input
                        className={styles.d365ControlFull}
                        value={savedHeader.id}
                        appearance="filled-darker"
                        readOnly
                        contentAfter={
                          <LockClosed16Regular
                            title="Clave primaria única"
                            aria-label="Campo de solo lectura"
                          />
                        }
                      />
                    </D365FormField>
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
