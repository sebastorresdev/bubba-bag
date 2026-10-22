import { D365FormContent } from '../../../components/common/D365FormContent';
import { useValidationFocus } from '../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Select,
  Switch,
  Tab,
  TabList,
  Spinner,
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
  LockClosed16Regular,
  Person16Regular,
  People20Regular,
  Building16Regular,
  Location16Regular,
} from '@fluentui/react-icons';
import { SeguridadService, type UsuarioDto } from '../../seguridad';
import { SelectorEntidadRelacionada } from '../../../components/common/SelectorEntidadRelacionada';
import { OrganizacionService } from '../services/organizacion.service';
import type {
  CreateRecursoDto,
  UnidadOrganizativaDto,
  TerritorioDto,
} from '../types/organizacion.types';
import { AlmacenService } from '../../inventario/almacenes/services/almacen.service';
import type { AlmacenDto } from '../../inventario/almacenes/types/almacen.types';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../components/common/D365CommandBar';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { D365EntityHeader } from '../../../components/common/D365EntityHeader';

const DEFAULT_RECURSO_FORM_DATA: CreateRecursoDto = {
  codigo: '',
  nombreCompleto: '',
  tipo: 1, // 1: Técnico, 4: Despachador
  unidadOrganizativaId: '',
  zonaOperativaId: '',
  almacenBaseId: '',
  almacenMovilId: '',
  telefono: '',
  documentoIdentidad: '',
  email: '',
  capacidadMaximaOrdenesPorDia: 6,
  colorHex: '#0078d4',
  notas: '',
  usuarioId: '',
};

const DEFAULT_HEADER_INFO = {
  nombre: '',
  tipoNombre: 'Usuario',
  activo: true,
};

export function RecursoFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const toasterId = useId('recurso-toaster');
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

  // Form State
  const [formData, setFormData] = useState<CreateRecursoDto>(DEFAULT_RECURSO_FORM_DATA);

  const [headerInfo, setHeaderInfo] = useState<{
    nombre: string;
    tipoNombre: string;
    activo: boolean;
  }>(DEFAULT_HEADER_INFO);

  // Catálogos
  const [usuarios, setUsuarios] = useState<UsuarioDto[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [sedes, setSedes] = useState<UnidadOrganizativaDto[]>([]);
  const [busquedaSede, setBusquedaSede] = useState('');
  const [territorios, setTerritorios] = useState<TerritorioDto[]>([]);
  const [busquedaTerritorio, setBusquedaTerritorio] = useState('');
  const [almacenesBase, setAlmacenesBase] = useState<AlmacenDto[]>([]);
  const [busquedaAlmacenBase, setBusquedaAlmacenBase] = useState('');

  // UI state
  const [selectedTab, setSelectedTab] = useState<'general' | 'scheduling' | 'fieldService' | 'detalle'>('general');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges({ formData }, !loading);


  useEffect(() => {
    let activo = true;
    Promise.all([
      OrganizacionService.getUnidadesOrganizativas(true),
      OrganizacionService.getTerritorios(undefined, true),
      AlmacenService.getAlmacenes(true),
      SeguridadService.usuariosVinculables(id),
    ])
      .then(([seds, terrs, alms, cuentas]) => {
        if (!activo) return;
        setSedes(seds);
        setUsuarios(cuentas);
        setTerritorios(terrs);
        setAlmacenesBase(
          alms.filter(
            (a) =>
              a.tipo === 1 ||
              String(a.tipo).toLowerCase().includes('bodega') ||
              (!a.tipo && !a.recursoId)
          )
        ); // Bodegas base
      })
      .catch((e) => setStatusMessage({ type: 'error', text: e.message }));

    return () => {
      activo = false;
    };
  }, [id]);

  const usuariosTecnicos = useMemo(() => {
    return usuarios.filter(
      (u) =>
        u.id === formData.usuarioId ||
        !u.roles ||
        u.roles.length === 0 ||
        u.roles.some(
          (r) =>
            r.toLowerCase().includes('tecnico') ||
            r.toLowerCase().includes('técnico') ||
            r === 'ServicioCampoTecnico'
        )
    );
  }, [usuarios, formData.usuarioId]);

  const cargarDatos = useCallback(async (recId: string) => {
    try {
      setLoading(true);
      const rec = await OrganizacionService.getRecursoById(recId);

      setFormData({
        codigo: rec.codigo,
        nombreCompleto: rec.nombreCompleto,
        tipo: rec.tipo,
        unidadOrganizativaId: rec.unidadOrganizativaId || '',
        zonaOperativaId: rec.zonaOperativaId || '',
        almacenBaseId: rec.almacenBaseId || '',
        usuarioId: rec.usuarioId || '',
        almacenMovilId: rec.almacenMovilId || '',
        telefono: rec.telefono || '',
        documentoIdentidad: rec.documentoIdentidad || '',
        email: rec.email || '',
        capacidadMaximaOrdenesPorDia: rec.capacidadMaximaOrdenesPorDia || 6,
        colorHex: rec.colorHex || '#0078d4',
        notas: '',
      });

      setHeaderInfo({
        nombre: rec.nombreCompleto,
        tipoNombre: rec.tipoNombre,
        activo: rec.activo,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error al obtener datos del recurso.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      void cargarDatos(id);
    } else {
      setFormData(DEFAULT_RECURSO_FORM_DATA);
      setHeaderInfo(DEFAULT_HEADER_INFO);
      setBusquedaSede('');
      setBusquedaUsuario('');
      setBusquedaTerritorio('');
      setBusquedaAlmacenBase('');
      setSelectedTab('general');
      setErrors({});
      setStatusMessage(null);
      setLoading(false);
      draft.markSaved();
    }
  }, [id, isEditMode, cargarDatos]);

  const handleNuevo = () => {
    setFormData(DEFAULT_RECURSO_FORM_DATA);
    setHeaderInfo(DEFAULT_HEADER_INFO);
    setBusquedaSede('');
    setBusquedaUsuario('');
    setBusquedaTerritorio('');
    setBusquedaAlmacenBase('');
    setSelectedTab('general');
    setErrors({});
    setStatusMessage(null);
    draft.markSaved();
    navigate('/servicio-campo/recursos/nuevo');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombreCompleto.trim()) newErrors.nombreCompleto = 'El nombre completo es obligatorio.';
    if (!formData.usuarioId) newErrors.usuarioId = 'Debe vincular un usuario del sistema.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfterSave = false): Promise<void> => {
    const savedDraft = draft.capture();
    if (!validate()) {
      setSelectedTab('general'); focusValidation();
      setStatusMessage({ type: 'error', text: 'Por favor complete todos los campos obligatorios.' });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const payload = {
        nombreCompleto: formData.nombreCompleto.trim(),
        tipo: formData.tipo,
        unidadOrganizativaId: formData.unidadOrganizativaId || null,
        zonaOperativaId: formData.zonaOperativaId || null,
        almacenBaseId: formData.almacenBaseId || null,
        usuarioId: formData.usuarioId || null,
        telefono: formData.telefono?.trim() || null,
        documentoIdentidad: formData.documentoIdentidad?.trim() || null,
        email: formData.email?.trim() || null,
        capacidadMaximaOrdenesPorDia: Number(formData.capacidadMaximaOrdenesPorDia) || 6,
        colorHex: formData.colorHex || '#0078d4',
        notas: formData.notas?.trim() || null,
      };

      if (isEditMode && id) {
        await OrganizacionService.updateRecurso(id, payload);
        setHeaderInfo((p) => ({
          ...p,
          nombre: formData.nombreCompleto.trim(),
          tipoNombre: formData.tipo === 1 ? 'Usuario' : 'Recurso',
        }));
        draft.markSaved(savedDraft);
        notifySuccess(`Recurso "${formData.nombreCompleto.trim()}" actualizado correctamente.`);
        setStatusMessage(null);
        if (closeAfterSave) { draft.markSaved(savedDraft);
navigate('/servicio-campo/recursos'); }
      } else {
        const res = await OrganizacionService.createRecurso({
          ...payload,
          codigo: formData.codigo?.trim() ? formData.codigo.trim().toUpperCase() : undefined,
        });

        draft.markSaved(savedDraft);

        notifySuccess(`Recurso "${formData.nombreCompleto.trim()}" creado exitosamente.`);
        setStatusMessage(null);

        if (closeAfterSave) {
          draft.markSaved(savedDraft);
          navigate('/servicio-campo/recursos');
        } else {
          draft.markSaved(savedDraft);
          navigate(`/servicio-campo/recursos/${res.id}`, { replace: true });
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error al guardar el recurso.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />
      {statusMessage && (
        <D365MessageBar intent={statusMessage.type} onDismiss={() => setStatusMessage(null)}>
          {statusMessage.text}
        </D365MessageBar>
      )}

      <D365CommandBar
        ariaLabel="Comandos de Recurso"
        busy={saving || loading}
        busyLabel={loading ? 'Cargando...' : 'Guardando...'}
      >
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={() => navigate('/servicio-campo/recursos')}
            title="Volver al listado"
          />
          <D365CommandDivider />
          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            disabled={saving || loading}
            onClick={() => void handleSave(false)}
          >
            Guardar
          </D365CommandButton>
          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            disabled={saving || loading}
            onClick={() => void handleSave(true)}
          >
            Guardar y cerrar
          </D365CommandButton>
          <D365CommandDivider />
          <D365CommandButton
            icon={<Add16Regular />}
            tone="create"
            disabled={saving}
            onClick={handleNuevo}
          >
            Nuevo
          </D365CommandButton>
          {isEditMode && (
            <D365CommandButton
              icon={<ArrowClockwise16Regular />}
              disabled={saving || loading}
              onClick={() => {
                if (id) void cargarDatos(id);
              }}
            >
              Actualizar
            </D365CommandButton>
          )}
        </div>
      </D365CommandBar>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner label="Cargando recurso..." size="large" />
        </div>
      ) : (
        <>
          <D365EntityHeader
            title={isEditMode ? headerInfo.nombre || 'Recurso' : 'Nuevo Recurso Reservable'}
            subtitle={headerInfo.tipoNombre || 'Recurso de Servicio de Campo'}
            avatarName={isEditMode ? headerInfo.nombre : 'Recurso'}
            avatarIcon={<People20Regular />}
            avatarSize={48}
            metadata={[
              { label: 'Rol', value: headerInfo.tipoNombre },
              { label: 'Estado', value: headerInfo.activo ? 'Activo' : 'Inactivo' },
            ]}
            tabs={
              <TabList
                selectedValue={selectedTab}
                onTabSelect={(_, d) => setSelectedTab(d.value as 'general' | 'scheduling' | 'fieldService' | 'detalle')}
              >
                <Tab value="general">General</Tab>
                <Tab value="scheduling">Programación</Tab>
                <Tab value="fieldService">Servicio de Campo</Tab>
                <Tab value="detalle" disabled={!isEditMode}>Detalle / Auditoría</Tab>
              </TabList>
            }
          />

          <D365FormContent busy={saving} className={styles.contentBody}>
            {/* PESTAÑA 1: GENERAL (Idéntica a Dynamics 365) */}
            {selectedTab === 'general' ? (
              <div className={styles.halfCardWrapper}>
                <div className={styles.card}>
                  <div className={styles.cardSectionTitle}>Información del Recurso</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <D365FormField label="Tipo de Recurso" required>
                      <Select
                        className={styles.d365ControlFull}
                        value={String(formData.tipo)}
                        onChange={(_, d) => setFormData((p) => ({ ...p, tipo: Number(d.value) }))}
                      >
                        <option value="1">Usuario</option>
                      </Select>
                    </D365FormField>

                    <D365FormField label="Usuario" required error={errors.usuarioId}>
                      <SelectorEntidadRelacionada
                        idEntrada="recurso-usuario"
                        etiquetaGrupo="Usuarios"
                        icono={<Person16Regular />}
                        opciones={usuariosTecnicos.map((u) => ({
                          id: u.id,
                          nombre: u.nombreCompleto,
                          detalle: u.email,
                        }))}
                        seleccionada={
                          usuariosTecnicos.find((u) => u.id === formData.usuarioId)
                            ? {
                                id: formData.usuarioId!,
                                nombre: usuariosTecnicos.find((u) => u.id === formData.usuarioId)!.nombreCompleto,
                              }
                            : null
                        }
                        textoBusqueda={busquedaUsuario}
                        alCambiarBusqueda={setBusquedaUsuario}
                        alSeleccionar={(usuarioId) => {
                          const u = usuariosTecnicos.find((item) => item.id === usuarioId);
                          setFormData((p) => ({
                            ...p,
                            usuarioId: usuarioId ?? '',
                            nombreCompleto: p.nombreCompleto.trim() ? p.nombreCompleto : (u?.nombreCompleto || ''),
                            email: p.email.trim() ? p.email : (u?.email || ''),
                          }));
                          if (errors.usuarioId && usuarioId) {
                            setErrors((p) => ({ ...p, usuarioId: '' }));
                          }
                          if (errors.nombreCompleto && (formData.nombreCompleto || u?.nombreCompleto)) {
                            setErrors((p) => ({ ...p, nombreCompleto: '' }));
                          }
                        }}
                        alNavegar={(usuarioId) => navigate('/configuracion/usuarios/' + usuarioId)}
                        deshabilitado={saving}
                      />
                    </D365FormField>

                    <D365FormField label="Nombre" required error={errors.nombreCompleto}>
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.nombreCompleto}
                        maxLength={150}
                        onChange={(_, d) => setFormData((p) => ({ ...p, nombreCompleto: d.value }))}
                      />
                    </D365FormField>

                    <D365FormField label="Zona Horaria">
                      <Select className={styles.d365ControlFull} value="America/Lima" disabled>
                        <option value="America/Lima">(GMT-05:00) Bogotá, Lima, Quito, Rio Branco</option>
                      </Select>
                    </D365FormField>

                    {isEditMode && formData.codigo && (
                      <D365FormField label="Código de Recurso">
                        <Input
                          className={styles.d365ControlFull}
                          value={formData.codigo}
                          readOnly
                          appearance="filled-darker"
                        />
                      </D365FormField>
                    )}
                  </div>
                </div>
              </div>
            ) : selectedTab === 'scheduling' ? (
              /* PESTAÑA 2: PROGRAMACIÓN / SCHEDULING (Idéntica a Dynamics 365) */
              <div className={styles.grid2Cols}>
                <div className={styles.card}>
                  <div className={styles.cardSectionTitle}>Ubicación y Base Operativa</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <D365FormField label="Unidad Organizativa" error={errors.unidadOrganizativaId}>
                      <SelectorEntidadRelacionada
                        idEntrada="recurso-unidad-org"
                        etiquetaGrupo="Unidades Organizativas"
                        icono={<Building16Regular />}
                        deshabilitado={saving}
                        tituloEnlace="Ver detalles de la sede"
                        alNavegar={(sedeId) => navigate(`/servicio-campo/unidades-organizativas/${sedeId}`)}
                        opciones={sedes.map((s) => ({
                          id: s.id,
                          nombre: `${s.nombre} (${s.codigo})`,
                          detalle: s.ciudad || undefined,
                        }))}
                        seleccionada={
                          formData.unidadOrganizativaId
                            ? (() => {
                                const s = sedes.find((item) => item.id === formData.unidadOrganizativaId);
                                return s ? { id: s.id, nombre: `${s.nombre} (${s.codigo})` } : null;
                              })()
                            : null
                        }
                        textoBusqueda={busquedaSede}
                        alCambiarBusqueda={setBusquedaSede}
                        alSeleccionar={(sedeId) => {
                          setFormData((p) => ({
                            ...p,
                            unidadOrganizativaId: sedeId || '',
                            zonaOperativaId: '',
                          }));
                          if (errors.unidadOrganizativaId && sedeId) {
                            setErrors((p) => ({ ...p, unidadOrganizativaId: '' }));
                          }
                        }}
                      />
                    </D365FormField>

                    <D365FormField label="Territorio Habitual de Operación">
                      <SelectorEntidadRelacionada
                        etiquetaGrupo="Territorios"
                        icono={<Location16Regular />}
                        deshabilitado={saving}
                        opciones={territorios
                          .filter(
                            (t) =>
                              !formData.unidadOrganizativaId ||
                              t.unidadOrganizativaId === formData.unidadOrganizativaId
                          )
                          .map((t) => ({
                            id: t.id,
                            nombre: `${t.nombre} (${t.codigo})`,
                          }))}
                        seleccionada={
                          formData.zonaOperativaId
                            ? (() => {
                                const t = territorios.find((item) => item.id === formData.zonaOperativaId);
                                return t ? { id: t.id, nombre: `${t.nombre} (${t.codigo})` } : null;
                              })()
                            : null
                        }
                        textoBusqueda={busquedaTerritorio}
                        alCambiarBusqueda={setBusquedaTerritorio}
                        alSeleccionar={(territorioId) => {
                          setFormData((p) => ({ ...p, zonaOperativaId: territorioId || '' }));
                        }}
                      />
                    </D365FormField>

                    <D365FormField label="Ubicación de Inicio y Fin de Jornada">
                      <Select className={styles.d365ControlFull} value="org" disabled>
                        <option value="org">Dirección de la Unidad Organizativa</option>
                        <option value="resource">Dirección del Recurso</option>
                        <option value="agnostic">Ubicación independiente</option>
                      </Select>
                    </D365FormField>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardSectionTitle}>Parámetros de Programación</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                      <div>
                        <Text weight="semibold" size={200} block>Mostrar en Tablero de Programación</Text>
                        <Text size={100} style={{ color: 'var(--colorNeutralForeground3)' }}>Habilita al recurso en el tablero de programación</Text>
                      </div>
                      <Switch checked={true} disabled />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                      <div>
                        <Text weight="semibold" size={200} block>Habilitar para Búsqueda de Disponibilidad</Text>
                        <Text size={100} style={{ color: 'var(--colorNeutralForeground3)' }}>Aparece en el asistente de programación automática</Text>
                      </div>
                      <Switch checked={true} disabled />
                    </div>

                    <D365FormField label="Capacidad máxima de órdenes por día">
                      <Input
                        className={styles.d365ControlFull}
                        type="number"
                        min={1}
                        max={30}
                        value={String(formData.capacidadMaximaOrdenesPorDia || 6)}
                        onChange={(_, d) =>
                          setFormData((p) => ({ ...p, capacidadMaximaOrdenesPorDia: Number(d.value) }))
                        }
                      />
                    </D365FormField>

                    <D365FormField label="Color identificador en Tablero Gantt">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="color"
                          value={formData.colorHex || '#0078d4'}
                          onChange={(e) => setFormData((p) => ({ ...p, colorHex: e.target.value }))}
                          style={{ width: '40px', height: '32px', border: 'none', cursor: 'pointer' }}
                        />
                        <Input
                          value={formData.colorHex || '#0078d4'}
                          onChange={(_, d) => setFormData((p) => ({ ...p, colorHex: d.value }))}
                          style={{ width: '120px' }}
                        />
                      </div>
                    </D365FormField>
                  </div>
                </div>
              </div>
            ) : selectedTab === 'fieldService' ? (
              /* PESTAÑA 3: FIELD SERVICE (Idéntica a Dynamics 365) */
              <div className={styles.halfCardWrapper}>
                <div className={styles.card}>
                  <div className={styles.cardSectionTitle}>Configuración de Servicio de Campo</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <D365FormField label="Almacén">
                      <SelectorEntidadRelacionada
                        etiquetaGrupo="Almacenes"
                        icono={<Building16Regular />}
                        deshabilitado={saving}
                        opciones={almacenesBase
                          .filter(
                            (a) =>
                              !formData.unidadOrganizativaId ||
                              !a.unidadOrganizativaId ||
                              a.unidadOrganizativaId === formData.unidadOrganizativaId ||
                              a.id === formData.almacenBaseId
                          )
                          .map((a) => ({
                            id: a.id,
                            nombre: a.nombre,
                            detalle: a.codigo || undefined,
                          }))}
                        seleccionada={
                          formData.almacenBaseId
                            ? (() => {
                                const a = almacenesBase.find((item) => item.id === formData.almacenBaseId);
                                return a ? { id: a.id, nombre: a.nombre } : null;
                              })()
                            : null
                        }
                        textoBusqueda={busquedaAlmacenBase}
                        alCambiarBusqueda={setBusquedaAlmacenBase}
                        alSeleccionar={(almacenId) => {
                          setFormData((p) => ({ ...p, almacenBaseId: almacenId || '' }));
                        }}
                      />
                    </D365FormField>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                      <div>
                        <Text weight="semibold" size={200} block>Habilitado para Field Service Mobile</Text>
                        <Text size={100} style={{ color: 'var(--colorNeutralForeground3)' }}>Permite al técnico sincronizar y liquidar desde la app móvil</Text>
                      </div>
                      <Switch checked={true} disabled />
                    </div>

                    <D365FormField label="Tarifa por Hora">
                      <Input
                        className={styles.d365ControlFull}
                        type="number"
                        min={0}
                        step={0.5}
                        defaultValue="0.00"
                        contentBefore={<Text size={200}>S/</Text>}
                      />
                    </D365FormField>
                  </div>
                </div>
              </div>
            ) : (
              /* PESTAÑA 4: DETALLE / AUDITORÍA */
              <div className={styles.halfCardWrapper}>
                <div className={styles.card}>
                  <div className={styles.cardSectionTitle}>Información de Auditoría y Estado</div>
                  <D365FormField label="Estado Operativo">
                    <Input
                      className={styles.d365ControlFull}
                      value={headerInfo.activo ? 'Activo para agendamiento' : 'Inactivo'}
                      readOnly
                      appearance="filled-darker"
                      contentAfter={<LockClosed16Regular />}
                    />
                  </D365FormField>
                </div>
              </div>
            )}</D365FormContent>
        </>
      )}
    </div>
  );
}
