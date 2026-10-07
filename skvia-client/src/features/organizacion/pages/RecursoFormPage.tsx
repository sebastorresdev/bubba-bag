import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  Select,
  Tab,
  TabList,
  Spinner,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  ArrowClockwise16Regular,
  People20Regular,
  Clock16Regular,
  History16Regular,
  LockClosed16Regular,
  Person16Regular,
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

export function RecursoFormPage() {
  const styles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const isEditMode = Boolean(id && id !== 'nuevo');

  // Form State
  const [formData, setFormData] = useState<CreateRecursoDto>({
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
  });

  const [headerInfo, setHeaderInfo] = useState<{
    nombre: string;
    tipoNombre: string;
    activo: boolean;
  }>({
    nombre: '',
    tipoNombre: 'Técnico de Campo',
    activo: true,
  });

  // Catálogos
  const [usuarios, setUsuarios] = useState<UsuarioDto[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [sedes, setSedes] = useState<UnidadOrganizativaDto[]>([]);
  const [territorios, setTerritorios] = useState<TerritorioDto[]>([]);
  const [almacenesBase, setAlmacenesBase] = useState<AlmacenDto[]>([]);

  // UI state
  const [selectedTab, setSelectedTab] = useState<'general' | 'despacho' | 'detalle'>('general');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      setLoading(false);
    }
  }, [id, isEditMode, cargarDatos]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.codigo.trim()) newErrors.codigo = 'El código identificador es obligatorio (ej. TEC-001).';
    if (!formData.nombreCompleto.trim()) newErrors.nombreCompleto = 'El nombre completo es obligatorio.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (closeAfterSave = false): Promise<void> => {
    if (!validate()) {
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
          tipoNombre: formData.tipo === 1 ? 'Técnico de Campo' : formData.tipo === 4 ? 'Despachador' : 'Recurso',
        }));
        setStatusMessage({ type: 'success', text: `Recurso "${formData.nombreCompleto.trim()}" actualizado correctamente.` });
        if (closeAfterSave) navigate('/servicio-campo/recursos');
      } else {
        const res = await OrganizacionService.createRecurso({
          ...payload,
          codigo: formData.codigo.trim().toUpperCase(),
        });

        if (closeAfterSave) {
          navigate('/servicio-campo/recursos');
        } else {
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
            onClick={() => navigate('/servicio-campo/recursos/nuevo')}
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
                onTabSelect={(_, d) => setSelectedTab(d.value as 'general' | 'despacho' | 'detalle')}
              >
                <Tab value="general" icon={<People20Regular />}>
                  General
                </Tab>
                <Tab value="despacho" icon={<Clock16Regular />}>
                  Parámetros de Despacho
                </Tab>
                <Tab value="detalle" disabled={!isEditMode} icon={<History16Regular />}>
                  Detalle / Auditoría
                </Tab>
              </TabList>
            }
          />

          <div className={styles.contentBody}>
            {selectedTab === 'general' ? (
              <div className={styles.grid2Cols}>
                <div className={styles.card}>
                  <div className={styles.cardSectionTitle}>Información del Recurso</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <D365FormField label="Código de Recurso" required error={errors.codigo}>
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.codigo}
                        maxLength={20}
                        disabled={isEditMode}
                        onChange={(_, d) => setFormData((p) => ({ ...p, codigo: d.value.toUpperCase() }))}
                      />
                    </D365FormField>

                    <D365FormField label="Nombre Completo" required error={errors.nombreCompleto}>
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.nombreCompleto}
                        maxLength={150}
                        onChange={(_, d) => setFormData((p) => ({ ...p, nombreCompleto: d.value }))}
                      />
                    </D365FormField>

                    <D365FormField label="Rol / Tipo de Recurso" required>
                      <Select
                        className={styles.d365ControlFull}
                        value={String(formData.tipo)}
                        onChange={(_, d) => setFormData((p) => ({ ...p, tipo: Number(d.value) }))}
                      >
                        <option value="1">Técnico de Campo (Individual)</option>
                        <option value="4">Despachador / Coordinador de Servicios</option>
                        <option value="2">Cuadrilla / Equipo Técnico</option>
                        <option value="6">Vehículo / Equipamiento Especial</option>
                      </Select>
                    </D365FormField>

                    <D365FormField label="Unidad Organizativa (Sede)">
                      <Select
                        className={styles.d365ControlFull}
                        value={formData.unidadOrganizativaId || ''}
                        onChange={(_, d) =>
                          setFormData((p) => ({ ...p, unidadOrganizativaId: d.value, zonaOperativaId: '' }))
                        }
                      >
                        <option value="">Seleccione sede...</option>
                        {sedes.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} ({s.codigo})
                          </option>
                        ))}
                      </Select>
                    </D365FormField>

                    <D365FormField label="Territorio Habitual de Operación">
                      <Select
                        className={styles.d365ControlFull}
                        value={formData.zonaOperativaId || ''}
                        onChange={(_, d) => setFormData((p) => ({ ...p, zonaOperativaId: d.value }))}
                      >
                        <option value="">Seleccione territorio / zona...</option>
                        {territorios
                          .filter(
                            (t) =>
                              !formData.unidadOrganizativaId ||
                              t.unidadOrganizativaId === formData.unidadOrganizativaId
                          )
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nombre} ({t.codigo})
                            </option>
                          ))}
                      </Select>
                    </D365FormField>

                    <D365FormField label="Bodega Base (Abastecimiento)">
                      <Select
                        className={styles.d365ControlFull}
                        value={formData.almacenBaseId || ''}
                        onChange={(_, d) => setFormData((p) => ({ ...p, almacenBaseId: d.value }))}
                      >
                        <option value="">Seleccione bodega base...</option>
                        {almacenesBase
                          .filter(
                            (a) =>
                              !formData.unidadOrganizativaId ||
                              !a.unidadOrganizativaId ||
                              a.unidadOrganizativaId === formData.unidadOrganizativaId ||
                              a.id === formData.almacenBaseId
                          )
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nombre}
                            </option>
                          ))}
                      </Select>
                    </D365FormField>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.cardSectionTitle}>Datos de Contacto y Acceso</div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <D365FormField label="Usuario de acceso vinculado" error={errors.usuarioId}>
                      <SelectorEntidadRelacionada
                        etiquetaGrupo="Técnicos"
                        icono={<Person16Regular />}
                        opciones={usuariosTecnicos.map(u => ({ id: u.id, nombre: u.nombreCompleto, detalle: u.email }))}
                        seleccionada={usuariosTecnicos.find(u => u.id === formData.usuarioId) ? { id: formData.usuarioId!, nombre: usuariosTecnicos.find(u => u.id === formData.usuarioId)!.nombreCompleto } : null}
                        textoBusqueda={busquedaUsuario} alCambiarBusqueda={setBusquedaUsuario}
                        alSeleccionar={usuarioId => setFormData(p => ({ ...p, usuarioId: usuarioId ?? '' }))}
                        alNavegar={usuarioId => navigate('/configuracion/usuarios/' + usuarioId)} deshabilitado={saving} />
                    </D365FormField>

                    <D365FormField label="DNI / Documento de Identidad">
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.documentoIdentidad || ''}
                        maxLength={20}
                        onChange={(_, d) => setFormData((p) => ({ ...p, documentoIdentidad: d.value }))}
                      />
                    </D365FormField>

                    <D365FormField label="Teléfono de Contacto">
                      <Input
                        className={styles.d365ControlFull}
                        value={formData.telefono || ''}
                        maxLength={30}
                        onChange={(_, d) => setFormData((p) => ({ ...p, telefono: d.value }))}
                      />
                    </D365FormField>

                    <D365FormField label="Correo Electrónico">
                      <Input
                        className={styles.d365ControlFull}
                        type="email"
                        value={formData.email || ''}
                        maxLength={100}
                        onChange={(_, d) => setFormData((p) => ({ ...p, email: d.value }))}
                      />
                    </D365FormField>
                  </div>
                </div>
              </div>
            ) : selectedTab === 'despacho' ? (
              <div className={styles.card}>
                <div className={styles.grid2Cols}>
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
            ) : (
              <div className={styles.card}>
                <div className={styles.grid2Cols}>
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
