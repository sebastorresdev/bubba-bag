import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Select,
  Spinner,
  Tab,
  TabList,
  Text,
  Textarea,
  Switch,
  tokens,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  PersonDelete16Regular,
  PersonAvailable16Regular,
  Person20Regular,
  Briefcase20Regular,
  Payment20Regular,
  DismissCircle20Regular,
  EyeOff16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365FormContent } from '../../../../components/common/D365FormContent';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { useAuthSession } from '../../../../services/authSession';
import { RecursosHumanosService } from '../../services/recursosHumanos.service';
import type {
  EmpleadoDto,
  CrearEmpleadoDto,
  ActualizarEmpleadoDto,
  CatalogosRrhhDto,
  EstadoEmpleado,
} from '../../types/recursosHumanos.types';

export const EmpleadoFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNuevo = !id || id === 'nuevo';
  const navigate = useNavigate();
  const formStyles = useD365FormStyles();
  const { permisos } = useAuthSession();

  const parseIsoDate = (val?: string | null): Date | null => {
    if (!val) return null;
    const parts = val.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  const formatToIsoDate = (d?: Date | null): string => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const canManage = permisos?.includes('rrhh.colaboradores.gestionar') ?? true;
  const canViewSalarios = permisos?.includes('rrhh.salarios.confidencial') ?? false;

  const [loading, setLoading] = useState<boolean>(!isNuevo);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'laboral' | 'compensacion' | 'cese'>('personal');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Catálogos
  const [catalogos, setCatalogos] = useState<CatalogosRrhhDto | null>(null);

  // Datos del Empleado
  const [empleado, setEmpleado] = useState<EmpleadoDto | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    direccion: '',
    fotoUrl: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    departamentoId: '',
    cargoId: '',
    tipoContrato: 'Plazo Indeterminado',
    tieneAsignacionFamiliar: false,
    salarioBase: '',
    monedaSalario: 'PEN',
    regimenPensionario: 'AFP Integra',
    cuspp: '',
    entidadFinanciera: 'BCP',
    cuentaBancaria: '',
    cuentaInterbancaria: '',
    estado: 'Activo' as EstadoEmpleado,
    turnoId: '',
  });

  // Modal Dar de Baja
  const [bajaModalOpen, setBajaModalOpen] = useState(false);
  const [bajaFecha, setBajaFecha] = useState(new Date().toISOString().split('T')[0]);
  const [bajaMotivo, setBajaMotivo] = useState('Renuncia Voluntaria');
  const [bajaObservaciones, setBajaObservaciones] = useState('');
  const [bajaLoading, setBajaLoading] = useState(false);

  // Cargar Catálogos
  useEffect(() => {
    RecursosHumanosService.obtenerCatalogos()
      .then((cat) => setCatalogos(cat))
      .catch((err) => console.error('Error cargando catálogos de RRHH:', err));
  }, []);

  // Cargar Empleado
  useEffect(() => {
    if (!isNuevo && id) {
      setLoading(true);
      RecursosHumanosService.obtenerEmpleadoPorId(id)
        .then((data) => {
          setEmpleado(data);
          setFormData({
            nombres: data.nombres || '',
            apellidos: data.apellidos || '',
            tipoDocumento: data.tipoDocumento || 'DNI',
            numeroDocumento: data.numeroDocumento || '',
            email: data.email || '',
            telefono: data.telefono || '',
            fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.split('T')[0] : '',
            direccion: data.direccion || '',
            fotoUrl: data.fotoUrl || '',
            fechaIngreso: data.fechaIngreso ? data.fechaIngreso.split('T')[0] : '',
            departamentoId: data.departamentoId || '',
            cargoId: data.cargoId || '',
            tipoContrato: data.tipoContrato || 'Plazo Indeterminado',
            tieneAsignacionFamiliar: !!data.tieneAsignacionFamiliar,
            salarioBase: data.salarioBase != null ? String(data.salarioBase) : '',
            monedaSalario: data.monedaSalario || 'PEN',
            regimenPensionario: data.regimenPensionario || 'AFP Integra',
            cuspp: data.cuspp || '',
            entidadFinanciera: data.entidadFinanciera || 'BCP',
            cuentaBancaria: data.cuentaBancaria || '',
            cuentaInterbancaria: data.cuentaInterbancaria || '',
            estado: (data.estado as EstadoEmpleado) || 'Activo',
            turnoId: data.turnoId || '',
          });
        })
        .catch((err) => {
          setErrorMessage(err.message || 'Error al cargar información del colaborador');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNuevo]);

  // Cargos filtrados según departamento seleccionado
  const cargosDisponibles = useMemo(() => {
    if (!catalogos || !formData.departamentoId) {
      return [];
    }
    const depto = catalogos.departamentos.find((d) => d.id === formData.departamentoId);
    return depto ? depto.cargos : [];
  }, [catalogos, formData.departamentoId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'departamentoId') {
        const depto = catalogos?.departamentos.find((d) => d.id === value);
        if (depto && !depto.cargos.some((c) => c.id === prev.cargoId)) {
          updated.cargoId = '';
        }
      }
      return updated;
    });
  };

  const handleGuardar = async (cerrarDespues: boolean = false) => {
    if (!canManage) {
      setErrorMessage('No cuentas con permisos para registrar o actualizar colaboradores.');
      return;
    }
    if (!formData.nombres.trim() || !formData.apellidos.trim()) {
      setErrorMessage('Los nombres y apellidos son requeridos.');
      return;
    }
    if (!formData.numeroDocumento.trim()) {
      setErrorMessage('El número de documento es obligatorio.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      const payload: CrearEmpleadoDto = {
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento.trim(),
        email: formData.email.trim() || null,
        telefono: formData.telefono.trim() || null,
        fechaNacimiento: formData.fechaNacimiento ? formData.fechaNacimiento : null,
        direccion: formData.direccion.trim() || null,
        fotoUrl: formData.fotoUrl.trim() || null,
        fechaIngreso: formData.fechaIngreso ? formData.fechaIngreso : null,
        departamentoId: formData.departamentoId || null,
        cargoId: formData.cargoId || null,
        tipoContrato: formData.tipoContrato || null,
        tieneAsignacionFamiliar: formData.tieneAsignacionFamiliar,
        salarioBase: canViewSalarios && formData.salarioBase ? Number(formData.salarioBase) : null,
        monedaSalario: canViewSalarios ? formData.monedaSalario : null,
        regimenPensionario: formData.regimenPensionario || null,
        cuspp: formData.cuspp.trim() || null,
        entidadFinanciera: formData.entidadFinanciera || null,
        cuentaBancaria: formData.cuentaBancaria.trim() || null,
        cuentaInterbancaria: formData.cuentaInterbancaria.trim() || null,
        turnoId: formData.turnoId || null,
      };

      if (isNuevo) {
        const newId = await RecursosHumanosService.crearEmpleado(payload);
        setSuccessMessage('Colaborador creado exitosamente.');
        if (cerrarDespues) {
          navigate('/rrhh/empleados');
        } else {
          navigate(`/rrhh/empleados/${newId}`, { replace: true });
        }
      } else {
        const updatePayload: ActualizarEmpleadoDto = {
          ...payload,
          id: id!,
          estado: formData.estado,
        };
        await RecursosHumanosService.actualizarEmpleado(id!, updatePayload);
        setSuccessMessage('Colaborador actualizado correctamente.');
        if (cerrarDespues) {
          navigate('/rrhh/empleados');
        } else {
          const refreshed = await RecursosHumanosService.obtenerEmpleadoPorId(id!);
          setEmpleado(refreshed);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar los datos del colaborador.');
    } finally {
      setSaving(false);
    }
  };

  const handleDarDeBaja = async () => {
    if (!id || isNuevo) return;
    try {
      setBajaLoading(true);
      await RecursosHumanosService.darDeBaja(id, {
        fechaCese: bajaFecha,
        motivoCese: bajaMotivo,
        observacionesCese: bajaObservaciones.trim() || undefined,
      });
      setBajaModalOpen(false);
      setSuccessMessage('Colaborador dado de baja correctamente.');
      const refreshed = await RecursosHumanosService.obtenerEmpleadoPorId(id);
      setEmpleado(refreshed);
      setFormData((prev) => ({ ...prev, estado: 'Cesado' }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la baja del colaborador.');
    } finally {
      setBajaLoading(false);
    }
  };

  const handleReactivar = async () => {
    if (!id || isNuevo) return;
    try {
      setSaving(true);
      await RecursosHumanosService.reactivar(id);
      setSuccessMessage('Colaborador reactivado a estado Activo.');
      const refreshed = await RecursosHumanosService.obtenerEmpleadoPorId(id);
      setEmpleado(refreshed);
      setFormData((prev) => ({ ...prev, estado: 'Activo' }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al reactivar colaborador.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <Spinner size="large" label="Cargando ficha del colaborador..." />
      </div>
    );
  }

  const deptoNombre = catalogos?.departamentos.find((d) => d.id === formData.departamentoId)?.nombre || empleado?.departamentoNombre;
  const cargoNombre = cargosDisponibles.find((c) => c.id === formData.cargoId)?.nombre || empleado?.cargoNombre;
  const esCesado = formData.estado === 'Cesado';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Barra de Comandos Estilo Dynamics 365 */}
      <D365CommandBar ariaLabel="Comandos de ficha de colaborador">
        <D365CommandButton
          icon={<ArrowLeft16Regular />}
          tone="brand"
          aria-label="Atrás"
          title="Atrás"
          onClick={() => navigate('/rrhh/empleados')}
        />
        <D365CommandDivider />
        <D365CommandButton
          icon={<Save16Regular />}
          onClick={() => handleGuardar(false)}
          disabled={saving || !canManage}
        >
          Guardar
        </D365CommandButton>
        <D365CommandButton
          icon={<SaveMultiple16Regular />}
          onClick={() => handleGuardar(true)}
          disabled={saving || !canManage}
        >
          Guardar y cerrar
        </D365CommandButton>
        {!isNuevo && canManage && !esCesado && (
          <D365CommandButton
            icon={<PersonDelete16Regular />}
            onClick={() => setBajaModalOpen(true)}
          >
            Dar de baja / Cesar
          </D365CommandButton>
        )}
        {!isNuevo && canManage && esCesado && (
          <D365CommandButton
            icon={<PersonAvailable16Regular />}
            onClick={handleReactivar}
          >
            Reactivar Colaborador
          </D365CommandButton>
        )}
      </D365CommandBar>

      {/* Cabecera de Entidad D365 */}
      <D365EntityHeader
        title={
          isNuevo
            ? 'Nuevo Colaborador'
            : `${formData.nombres} ${formData.apellidos}`.trim() || 'Ficha de Colaborador'
        }
        subtitle={
          cargoNombre
            ? `${cargoNombre} • ${deptoNombre || 'Sin departamento'}`
            : 'Ficha de Personal y Contratación'
        }
        avatarName={`${formData.nombres} ${formData.apellidos}`.trim() || 'Colaborador'}
        metadata={[
          {
            label: 'Estado Laboral',
            value: <D365StatusBadge status={formData.estado} />,
          },
          {
            label: 'Documento',
            value: `${formData.tipoDocumento} ${formData.numeroDocumento || '---'}`,
          },
          {
            label: 'Fecha Ingreso',
            value: formData.fechaIngreso || '---',
          },
          ...(canViewSalarios && formData.salarioBase
            ? [
                {
                  label: 'Remuneración',
                  value: (
                    <span style={{ color: tokens.colorPaletteGreenForeground1, fontWeight: 'bold' }}>
                      {formData.monedaSalario === 'USD' ? '$' : 'S/'} {Number(formData.salarioBase).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
              ]
            : []),
        ]}
        tabs={
          <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as any)}>
            <Tab value="personal" icon={<Person20Regular />}>
              Información Personal
            </Tab>
            <Tab value="laboral" icon={<Briefcase20Regular />}>
              Laboral & Contrato
            </Tab>
            <Tab value="compensacion" icon={<Payment20Regular />}>
              Compensación & Banco
            </Tab>
            {esCesado && (
              <Tab value="cese" icon={<DismissCircle20Regular />}>
                Detalles de Cese
              </Tab>
            )}
          </TabList>
        }
      />

      {/* Mensajes de Notificación */}
      {errorMessage && (
        <div style={{ padding: '0 24px', marginTop: 12 }}>
          <D365MessageBar intent="error" onDismiss={() => setErrorMessage(null)}>
            {errorMessage}
          </D365MessageBar>
        </div>
      )}
      {successMessage && (
        <div style={{ padding: '0 24px', marginTop: 12 }}>
          <D365MessageBar intent="success" onDismiss={() => setSuccessMessage(null)}>
            {successMessage}
          </D365MessageBar>
        </div>
      )}

      {/* Contenido del Formulario */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <D365FormContent>
          {/* PESTAÑA: PERSONAL */}
          {activeTab === 'personal' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
              {/* Sección Datos Personales */}
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Identificación del Colaborador</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <D365FormField label="Nombres" required>
                    <Input
                      className={formStyles.d365ControlFull}
                      value={formData.nombres}
                      onChange={(_, d) => handleChange('nombres', d.value)}
                      disabled={!canManage}
                    />
                  </D365FormField>

                  <D365FormField label="Apellidos" required>
                    <Input
                      className={formStyles.d365ControlFull}
                      value={formData.apellidos}
                      onChange={(_, d) => handleChange('apellidos', d.value)}
                      disabled={!canManage}
                    />
                  </D365FormField>

                  <D365FormField label="Tipo de Documento" required>
                    <Select
                      className={formStyles.d365ControlFull}
                      value={formData.tipoDocumento}
                      onChange={(_, d) => handleChange('tipoDocumento', d.value)}
                      disabled={!canManage}
                    >
                      {catalogos?.tiposDocumento.map((td) => (
                        <option key={td} value={td}>{td}</option>
                      ))}
                    </Select>
                  </D365FormField>

                  <D365FormField label="N° de Documento" required>
                    <Input
                      className={formStyles.d365ControlFull}
                      value={formData.numeroDocumento}
                      onChange={(_, d) => handleChange('numeroDocumento', d.value)}
                      disabled={!canManage}
                    />
                  </D365FormField>

                  <D365FormField label="Fecha de Nacimiento">
                    <DatePicker
                      className={formStyles.d365ControlFull}
                      value={parseIsoDate(formData.fechaNacimiento)}
                      onSelectDate={(d) => handleChange('fechaNacimiento', formatToIsoDate(d))}
                      formatDate={(d) => (d ? d.toLocaleDateString('es-PE') : '')}
                      disabled={!canManage}
                    />
                  </D365FormField>

                  <D365FormField label="URL Foto de Perfil">
                    <Input
                      className={formStyles.d365ControlFull}
                      value={formData.fotoUrl}
                      onChange={(_, d) => handleChange('fotoUrl', d.value)}
                      disabled={!canManage}
                    />
                  </D365FormField>
                </div>
              </div>

              {/* Sección Contacto y Domicilio */}
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Contacto & Residencia</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <D365FormField label="Correo Electrónico">
                    <Input
                      className={formStyles.d365ControlFull}
                      type="email"
                      value={formData.email}
                      onChange={(_, d) => handleChange('email', d.value)}
                      disabled={!canManage}
                    />
                  </D365FormField>

                  <D365FormField label="Teléfono / Celular">
                    <Input
                      className={formStyles.d365ControlFull}
                      value={formData.telefono}
                      onChange={(_, d) => handleChange('telefono', d.value)}
                      disabled={!canManage}
                    />
                  </D365FormField>

                  <D365FormField label="Dirección de Domicilio">
                    <Textarea
                      className={formStyles.d365ControlFull}
                      value={formData.direccion}
                      onChange={(_, d) => handleChange('direccion', d.value)}
                      rows={3}
                      disabled={!canManage}
                    />
                  </D365FormField>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: LABORAL */}
          {activeTab === 'laboral' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Estructura Organizacional</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <D365FormField label="Departamento / Área" required>
                    <Select
                      value={formData.departamentoId}
                      onChange={(_, d) => handleChange('departamentoId', d.value)}
                      disabled={!canManage}
                    >
                      <option value="">-- Seleccionar Departamento --</option>
                      {catalogos?.departamentos.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.nombre}</option>
                      ))}
                    </Select>
                  </D365FormField>

                  <D365FormField label="Cargo / Posición" required>
                    <Select
                      value={formData.cargoId}
                      onChange={(_, d) => handleChange('cargoId', d.value)}
                      disabled={!canManage || !formData.departamentoId}
                    >
                      <option value="">-- Seleccionar Cargo --</option>
                      {cargosDisponibles.map((cargo) => (
                        <option key={cargo.id} value={cargo.id}>
                          {cargo.nombre} {canViewSalarios && cargo.salarioReferencial ? `(Ref: S/ ${cargo.salarioReferencial})` : ''}
                        </option>
                      ))}
                    </Select>
                  </D365FormField>

                  {!isNuevo && (
                    <D365FormField label="Estado Laboral">
                      <Select
                        value={formData.estado}
                        onChange={(_, d) => handleChange('estado', d.value as EstadoEmpleado)}
                        disabled={!canManage || esCesado}
                      >
                        {catalogos?.estados.map((est) => (
                          <option key={est.id} value={est.id}>{est.label}</option>
                        ))}
                      </Select>
                    </D365FormField>
                  )}
                </div>
              </div>

              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Contrato y Beneficios</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <D365FormField label="Tipo de Contrato">
                    <Select
                      value={formData.tipoContrato}
                      onChange={(_, d) => handleChange('tipoContrato', d.value)}
                      disabled={!canManage}
                    >
                      {catalogos?.tiposContrato.map((tc) => (
                        <option key={tc} value={tc}>{tc}</option>
                      ))}
                    </Select>
                  </D365FormField>

                  <D365FormField label="Horario / Turno Asignado">
                    <Select
                      value={formData.turnoId}
                      onChange={(_, d) => handleChange('turnoId', d.value)}
                      disabled={!canManage}
                    >
                      <option value="">-- Sin turno asignado --</option>
                      {catalogos?.turnos?.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre} ({t.horario})
                        </option>
                      ))}
                    </Select>
                  </D365FormField>

                  <D365FormField label="Fecha de Ingreso" required>
                    <DatePicker
                      className={formStyles.d365ControlFull}
                      value={parseIsoDate(formData.fechaIngreso)}
                      onSelectDate={(d) => handleChange('fechaIngreso', formatToIsoDate(d))}
                      formatDate={(d) => (d ? d.toLocaleDateString('es-PE') : '')}
                      disabled={!canManage}
                    />
                  </D365FormField>

                  <div style={{ paddingTop: 8 }}>
                    <Switch
                      checked={formData.tieneAsignacionFamiliar}
                      onChange={(_, d) => handleChange('tieneAsignacionFamiliar', d.checked)}
                      label="Asignación Familiar (Hijos menores o cursando estudios)"
                      disabled={!canManage}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: COMPENSACION */}
          {activeTab === 'compensacion' && (
            <div>
              {!canViewSalarios ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: tokens.colorNeutralForeground4 }}>
                  <EyeOff16Regular style={{ fontSize: 40, marginBottom: 12, display: 'inline-block' }} />
                  <Text size={400} weight="semibold" style={{ display: 'block' }}>
                    Información Salarial y Bancaria Confidencial
                  </Text>
                  <Text size={300} style={{ maxWidth: 480, margin: '8px auto 0', display: 'block' }}>
                    No cuentas con el permiso <code>rrhh.salarios.confidencial</code> para consultar o modificar las remuneraciones y cuentas bancarias de los colaboradores.
                  </Text>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
                  <div className={formStyles.card}>
                    <div className={formStyles.cardSectionTitle}>Remuneración y Régimen Previsional</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <D365FormField label="Moneda de Salario">
                        <Select
                          className={formStyles.d365ControlFull}
                          value={formData.monedaSalario}
                          onChange={(_, d) => handleChange('monedaSalario', d.value)}
                          disabled={!canManage}
                        >
                          <option value="PEN">Soles (PEN)</option>
                          <option value="USD">Dólares (USD)</option>
                        </Select>
                      </D365FormField>

                      <D365FormField label="Remuneración Bruta">
                        <Input
                          className={formStyles.d365ControlFull}
                          type="number"
                          value={formData.salarioBase}
                          onChange={(_, d) => handleChange('salarioBase', d.value)}
                          disabled={!canManage}
                        />
                      </D365FormField>

                      <D365FormField label="Régimen Pensionario">
                        <Select
                          className={formStyles.d365ControlFull}
                          value={formData.regimenPensionario}
                          onChange={(_, d) => handleChange('regimenPensionario', d.value)}
                          disabled={!canManage}
                        >
                          {catalogos?.regimenesPensionarios.map((rp) => (
                            <option key={rp} value={rp}>{rp}</option>
                          ))}
                        </Select>
                      </D365FormField>

                      <D365FormField label="Código CUSPP (AFP)">
                        <Input
                          className={formStyles.d365ControlFull}
                          value={formData.cuspp}
                          onChange={(_, d) => handleChange('cuspp', d.value)}
                          disabled={!canManage}
                        />
                      </D365FormField>
                    </div>
                  </div>

                  <div className={formStyles.card}>
                    <div className={formStyles.cardSectionTitle}>Cuentas Bancarias de Abono</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <D365FormField label="Entidad Financiera">
                        <Select
                          className={formStyles.d365ControlFull}
                          value={formData.entidadFinanciera}
                          onChange={(_, d) => handleChange('entidadFinanciera', d.value)}
                          disabled={!canManage}
                        >
                          {catalogos?.entidadesFinancieras.map((ef) => (
                            <option key={ef} value={ef}>{ef}</option>
                          ))}
                        </Select>
                      </D365FormField>

                      <D365FormField label="N° Cuenta Bancaria">
                        <Input
                          className={formStyles.d365ControlFull}
                          value={formData.cuentaBancaria}
                          onChange={(_, d) => handleChange('cuentaBancaria', d.value)}
                          disabled={!canManage}
                        />
                      </D365FormField>

                      <D365FormField label="Código de Cuenta Interbancaria (CCI)">
                        <Input
                          className={formStyles.d365ControlFull}
                          value={formData.cuentaInterbancaria}
                          onChange={(_, d) => handleChange('cuentaInterbancaria', d.value)}
                          disabled={!canManage}
                        />
                      </D365FormField>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: DETALLES DE CESE */}
          {activeTab === 'cese' && esCesado && empleado && (
            <div style={{ maxWidth: 650 }}>
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Historial de Baja / Término de Vínculo</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <D365FormField label="Fecha de Cese Efectivo">
                    <DatePicker
                      className={formStyles.d365ControlFull}
                      value={parseIsoDate(empleado.fechaCese)}
                      formatDate={(d) => (d ? d.toLocaleDateString('es-PE') : '')}
                      disabled
                    />
                  </D365FormField>

                  <D365FormField label="Motivo del Cese">
                    <Input className={formStyles.d365ControlFull} value={empleado.motivoCese || '---'} readOnly disabled />
                  </D365FormField>

                  <D365FormField label="Observaciones / Liquidación">
                    <Textarea className={formStyles.d365ControlFull} value={empleado.observacionesCese || 'Sin observaciones'} rows={4} readOnly disabled />
                  </D365FormField>
                </div>
              </div>
            </div>
          )}
        </D365FormContent>
      </div>

      {/* DIÁLOGO: DAR DE BAJA */}
      <Dialog open={bajaModalOpen} onOpenChange={(_, data) => setBajaModalOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Dar de Baja al Colaborador</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
              <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                Esta acción cesará el vínculo laboral de <strong>{formData.nombres} {formData.apellidos}</strong>. El colaborador pasará a estado <em>Cesado</em> y no figurará en las planillas activas.
              </Text>

              <D365FormField label="Fecha de Cese" required>
                <DatePicker
                  className={formStyles.d365ControlFull}
                  value={parseIsoDate(bajaFecha)}
                  onSelectDate={(d) => setBajaFecha(formatToIsoDate(d))}
                  formatDate={(d) => (d ? d.toLocaleDateString('es-PE') : '')}
                />
              </D365FormField>

              <D365FormField label="Motivo de Cese" required>
                <Select
                  className={formStyles.d365ControlFull}
                  value={bajaMotivo}
                  onChange={(_, d) => setBajaMotivo(d.value)}
                >
                  {catalogos?.motivosCese.map((mot) => (
                    <option key={mot} value={mot}>{mot}</option>
                  ))}
                </Select>
              </D365FormField>

              <D365FormField label="Observaciones adicionales">
                <Textarea
                  className={formStyles.d365ControlFull}
                  value={bajaObservaciones}
                  onChange={(_, d) => setBajaObservaciones(d.value)}
                  rows={3}
                />
              </D365FormField>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setBajaModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: '#fff' }}
                onClick={handleDarDeBaja}
                disabled={bajaLoading}
              >
                {bajaLoading ? <Spinner size="tiny" /> : 'Confirmar Cese'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
