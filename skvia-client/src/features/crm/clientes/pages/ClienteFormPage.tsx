import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  TabList,
  Tab,
  Combobox,
  Option,
  Checkbox,
  RadioGroup,
  Radio,
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
  Spinner,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  PersonAccounts24Regular,
  Building24Regular,
  DismissCircle16Regular,
  CheckmarkCircle16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { ClienteService } from '../services/cliente.service';
import type {
  CrearClienteDto,
  ActualizarClienteDto,
  TipoPersona,
  TipoDocumentoIdentidad,
  UbigeoDto,
} from '../types/cliente.types';

export const ClienteFormPage: React.FC = () => {
  const formStyles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const esNuevo = !id || id === 'nuevo';

  const toasterId = useId('cliente-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(!esNuevo);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'resumen' | 'contacto' | 'clasificacion'>('resumen');

  // Catálogo de Ubigeos
  const [ubigeos, setUbigeos] = useState<UbigeoDto[]>([]);
  const [busquedaUbigeo, setBusquedaUbigeo] = useState('');

  // Estados del Formulario
  const [codigoCliente, setCodigoCliente] = useState('');
  const [tipoPersona, setTipoPersona] = useState<TipoPersona>('NATURAL');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoIdentidad>('DNI');
  const [documentoIdentidad, setDocumentoIdentidad] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [nombreComercial, setNombreComercial] = useState('');
  const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
  const [telefonoSecundario, setTelefonoSecundario] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [referenciaUbicacion, setReferenciaUbicacion] = useState('');
  const [ubigeoCodigo, setUbigeoCodigo] = useState('');
  const [coordenadaLat, setCoordenadaLat] = useState<string>('');
  const [coordenadaLng, setCoordenadaLng] = useState<string>('');
  const [esClienteFacturacion, setEsClienteFacturacion] = useState(false);
  const [esClienteServicio, setEsClienteServicio] = useState(true);
  const [activo, setActivo] = useState(true);

  const notifySuccess = useCallback((title: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
      </Toast>,
      { intent: 'success', position: 'top-end' }
    );
  }, [dispatchToast]);

  // Cargar Ubigeos
  useEffect(() => {
    const cargarUbigeos = async () => {
      try {
        const ubs = await ClienteService.obtenerUbigeos();
        setUbigeos(ubs);
      } catch (e) {
        console.error('Error cargando ubigeos', e);
      }
    };
    void cargarUbigeos();
  }, []);

  // Cargar Cliente existente
  useEffect(() => {
    if (esNuevo) return;
    const cargarDetalle = async () => {
      try {
        setLoading(true);
        const cli = await ClienteService.obtenerClientePorId(id);
        setCodigoCliente(cli.codigoCliente);
        setTipoPersona(cli.tipoPersona);
        setTipoDocumento(cli.tipoDocumento);
        setDocumentoIdentidad(cli.documentoIdentidad);
        setNombres(cli.nombres);
        setApellidos(cli.apellidos || '');
        setRazonSocial(cli.razonSocial || '');
        setNombreComercial(cli.nombreCompletoODenominacion || '');
        setTelefonoPrincipal(cli.telefonoPrincipal);
        setTelefonoSecundario(cli.telefonoSecundario || '');
        setEmail(cli.email || '');
        setDireccion(cli.direccion);
        setReferenciaUbicacion(cli.referenciaUbicacion || '');
        setUbigeoCodigo(cli.ubigeoCodigo);
        setCoordenadaLat(cli.coordenadaLat !== null && cli.coordenadaLat !== undefined ? String(cli.coordenadaLat) : '');
        setCoordenadaLng(cli.coordenadaLng !== null && cli.coordenadaLng !== undefined ? String(cli.coordenadaLng) : '');
        setEsClienteFacturacion(cli.esClienteFacturacion);
        setEsClienteServicio(cli.esClienteServicio);
        setActivo(cli.activo);
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar los datos del cliente.' });
      } finally {
        setLoading(false);
      }
    };
    void cargarDetalle();
  }, [id, esNuevo]);

  const nombreEncabezado = useMemo(() => {
    if (tipoPersona === 'JURIDICA') {
      return razonSocial.trim() || nombreComercial.trim() || 'Nueva Cuenta';
    }
    const full = `${nombres.trim()} ${apellidos.trim()}`.trim();
    return full || 'Nuevo Cliente';
  }, [tipoPersona, razonSocial, nombreComercial, nombres, apellidos]);

  const ubigeosFiltrados = useMemo(() => {
    if (!busquedaUbigeo.trim()) return ubigeos.slice(0, 100);
    const q = busquedaUbigeo.toLowerCase();
    return ubigeos
      .filter(
        (u) =>
          u.distrito.toLowerCase().includes(q) ||
          u.provincia.toLowerCase().includes(q) ||
          u.departamento.toLowerCase().includes(q) ||
          u.codigo.includes(q)
      )
      .slice(0, 100);
  }, [ubigeos, busquedaUbigeo]);

  const ubigeoSeleccionadoObj = useMemo(() => {
    return ubigeos.find((u) => u.codigo === ubigeoCodigo) || null;
  }, [ubigeos, ubigeoCodigo]);

  const handleGuardar = async (cerrar: boolean) => {
    if (!documentoIdentidad.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese el número de documento de identidad.' });
      setSelectedTab('resumen');
      return;
    }

    if (tipoPersona === 'NATURAL' && !nombres.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese los nombres del cliente.' });
      setSelectedTab('resumen');
      return;
    }

    if (tipoPersona === 'JURIDICA' && !razonSocial.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese la razón social de la empresa.' });
      setSelectedTab('resumen');
      return;
    }

    if (!telefonoPrincipal.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese el teléfono principal de contacto.' });
      setSelectedTab('contacto');
      return;
    }

    if (!direccion.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese la dirección de servicio.' });
      setSelectedTab('contacto');
      return;
    }

    if (!ubigeoCodigo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Seleccione el distrito o ubigeo correspondiente.' });
      setSelectedTab('contacto');
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      const latNum = coordenadaLat.trim() ? parseFloat(coordenadaLat) : undefined;
      const lngNum = coordenadaLng.trim() ? parseFloat(coordenadaLng) : undefined;

      if (esNuevo) {
        const dto: CrearClienteDto = {
          documentoIdentidad: documentoIdentidad.trim(),
          nombres: tipoPersona === 'NATURAL' ? nombres.trim() : razonSocial.trim(),
          apellidos: tipoPersona === 'NATURAL' ? apellidos.trim() || undefined : undefined,
          telefonoPrincipal: telefonoPrincipal.trim(),
          direccion: direccion.trim(),
          ubigeoCodigo: ubigeoCodigo.trim(),
          esClienteFacturacion,
          esClienteServicio,
          tipoDocumento,
          tipoPersona,
          razonSocial: tipoPersona === 'JURIDICA' ? razonSocial.trim() : undefined,
          telefonoSecundario: telefonoSecundario.trim() || undefined,
          email: email.trim() || undefined,
          referenciaUbicacion: referenciaUbicacion.trim() || undefined,
          coordenadaLat: !isNaN(latNum as number) ? latNum : undefined,
          coordenadaLng: !isNaN(lngNum as number) ? lngNum : undefined,
        };

        const res = await ClienteService.crearCliente(dto);
        notifySuccess('Cliente registrado exitosamente.');
        if (cerrar) {
          navigate('/servicio-campo/clientes');
        } else {
          navigate(`/servicio-campo/clientes/${res.id}`, { replace: true });
        }
      } else {
        const dto: ActualizarClienteDto = {
          telefonoPrincipal: telefonoPrincipal.trim(),
          direccion: direccion.trim(),
          ubigeoCodigo: ubigeoCodigo.trim(),
          referenciaUbicacion: referenciaUbicacion.trim() || undefined,
          coordenadaLat: !isNaN(latNum as number) ? latNum : undefined,
          coordenadaLng: !isNaN(lngNum as number) ? lngNum : undefined,
          esClienteFacturacion,
          esClienteServicio,
        };

        await ClienteService.actualizarCliente(id!, dto);
        notifySuccess('Cliente actualizado exitosamente.');
        if (cerrar) {
          navigate('/servicio-campo/clientes');
        }
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar el cliente.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (esNuevo || !id) return;
    try {
      setSubmitting(true);
      await ClienteService.cambiarEstadoCliente(id, !activo);
      setActivo(!activo);
      notifySuccess(`Cliente ${!activo ? 'activado' : 'desactivado'} exitosamente.`);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cambiar estado.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={formStyles.loadingContainer}>
        <Spinner size="large" label="Cargando cuenta de cliente..." />
      </div>
    );
  }

  return (
    <div className={formStyles.root}>
      <Toaster toasterId={toasterId} position="top-end" />

      {/* 1. TOP COMMAND BAR */}
      <D365CommandBar ariaLabel="Comandos de cuenta">
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            onClick={() => navigate('/servicio-campo/clientes')}
          >
            Volver
          </D365CommandButton>
          <D365CommandDivider />
          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            onClick={() => void handleGuardar(false)}
            disabled={submitting}
          >
            Guardar
          </D365CommandButton>
          <D365CommandButton
            icon={<SaveMultiple16Regular />}
            tone="save"
            onClick={() => void handleGuardar(true)}
            disabled={submitting}
          >
            Guardar y cerrar
          </D365CommandButton>
          {!esNuevo && (
            <>
              <D365CommandButton
                icon={<Add16Regular />}
                tone="create"
                onClick={() => navigate('/servicio-campo/clientes/nuevo')}
              >
                Nuevo
              </D365CommandButton>
              <D365CommandButton
                icon={activo ? <DismissCircle16Regular /> : <CheckmarkCircle16Regular />}
                tone={activo ? 'danger' : 'create'}
                onClick={() => void handleCambiarEstado()}
                disabled={submitting}
              >
                {activo ? 'Desactivar' : 'Activar'}
              </D365CommandButton>
            </>
          )}
        </div>
      </D365CommandBar>

      {/* 2. ENTITY HEADER CON TABS (SIN ICONOS NI NÚMEROS) */}
      <D365EntityHeader
        title={nombreEncabezado}
        subtitle={
          documentoIdentidad
            ? `${tipoDocumento}: ${documentoIdentidad}`
            : 'Ficha de cuenta / cliente'
        }
        avatarIcon={
          tipoPersona === 'JURIDICA' ? (
            <Building24Regular />
          ) : (
            <PersonAccounts24Regular />
          )
        }
        metadata={[
          ...(codigoCliente ? [{ label: 'Código', value: codigoCliente }] : []),
          {
            label: 'Tipo',
            value: tipoPersona === 'JURIDICA' ? 'Persona Jurídica' : 'Persona Natural',
          },
          { label: 'Estado', value: activo ? 'Activo' : 'Inactivo' },
        ]}
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) =>
              setSelectedTab(data.value as 'resumen' | 'contacto' | 'clasificacion')
            }
          >
            <Tab value="resumen">Resumen</Tab>
            <Tab value="contacto">Contacto y Dirección</Tab>
            <Tab value="clasificacion">Configuración Comercial</Tab>
          </TabList>
        }
      />

      {/* 3. ALERT FEEDBACK */}
      {mensaje && (
        <div style={{ padding: '0 24px', marginTop: '12px' }}>
          <D365MessageBar intent={mensaje.tipo} onDismiss={() => setMensaje(null)}>
            {mensaje.texto}
          </D365MessageBar>
        </div>
      )}

      {/* 4. CONTENIDO POR TAB */}
      <div className={formStyles.contentBody}>
        {selectedTab === 'resumen' && (
          <div style={{ maxWidth: '640px', width: '100%' }}>
            <div className={formStyles.card}>
              <div className={formStyles.cardSectionTitle}>Identificación Principal</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <D365FormField label="Tipo de Persona" required>
                  <RadioGroup
                    value={tipoPersona}
                    onChange={(_, d) => {
                      const tp = d.value as TipoPersona;
                      setTipoPersona(tp);
                      if (tp === 'JURIDICA') {
                        setTipoDocumento('RUC');
                      } else {
                        setTipoDocumento('DNI');
                      }
                    }}
                    layout="horizontal"
                    disabled={!esNuevo}
                  >
                    <Radio value="NATURAL" label="Persona Natural" />
                    <Radio value="JURIDICA" label="Persona Jurídica" />
                  </RadioGroup>
                </D365FormField>

                <D365FormField label="Tipo de Documento" required>
                  <Combobox
                    style={{ width: '100%' }}
                    value={tipoDocumento}
                    selectedOptions={[tipoDocumento]}
                    onOptionSelect={(_, d) => {
                      if (d.optionValue) setTipoDocumento(d.optionValue as TipoDocumentoIdentidad);
                    }}
                    disabled={!esNuevo}
                  >
                    <Option value="DNI">DNI (Documento Nacional)</Option>
                    <Option value="RUC">RUC (Registro Único Contribuyente)</Option>
                    <Option value="CE">Carné de Extranjería</Option>
                    <Option value="PASAPORTE">Pasaporte</Option>
                  </Combobox>
                </D365FormField>

                <D365FormField
                  label="N° Documento"
                  required
                  info="DNI (8 dígitos) o RUC (11 dígitos)"
                >
                  <Input
                    style={{ width: '100%' }}
                    value={documentoIdentidad}
                    onChange={(_, d) => setDocumentoIdentidad(d.value)}
                    maxLength={20}
                    disabled={!esNuevo}
                  />
                </D365FormField>

                {tipoPersona === 'NATURAL' ? (
                  <>
                    <D365FormField label="Nombres" required>
                      <Input
                        style={{ width: '100%' }}
                        value={nombres}
                        onChange={(_, d) => setNombres(d.value)}
                        maxLength={120}
                        disabled={!esNuevo}
                      />
                    </D365FormField>

                    <D365FormField label="Apellidos">
                      <Input
                        style={{ width: '100%' }}
                        value={apellidos}
                        onChange={(_, d) => setApellidos(d.value)}
                        maxLength={120}
                        disabled={!esNuevo}
                      />
                    </D365FormField>
                  </>
                ) : (
                  <>
                    <D365FormField label="Razón Social" required>
                      <Input
                        style={{ width: '100%' }}
                        value={razonSocial}
                        onChange={(_, d) => setRazonSocial(d.value)}
                        maxLength={200}
                        disabled={!esNuevo}
                      />
                    </D365FormField>

                    <D365FormField label="Nombre Comercial">
                      <Input
                        style={{ width: '100%' }}
                        value={nombreComercial}
                        onChange={(_, d) => setNombreComercial(d.value)}
                        maxLength={200}
                        disabled={!esNuevo}
                      />
                    </D365FormField>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'contacto' && (
          <div style={{ maxWidth: '640px', width: '100%' }}>
            <div className={formStyles.card}>
              <div className={formStyles.cardSectionTitle}>Comunicación y Domicilio</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <D365FormField label="Teléfono Principal" required info="Teléfono móvil o de contacto preferido">
                  <Input
                    style={{ width: '100%' }}
                    value={telefonoPrincipal}
                    onChange={(_, d) => setTelefonoPrincipal(d.value)}
                    maxLength={30}
                  />
                </D365FormField>

                <D365FormField label="Teléfono Secundario">
                  <Input
                    style={{ width: '100%' }}
                    value={telefonoSecundario}
                    onChange={(_, d) => setTelefonoSecundario(d.value)}
                    maxLength={30}
                    disabled={!esNuevo}
                  />
                </D365FormField>

                <D365FormField label="Correo Electrónico">
                  <Input
                    style={{ width: '100%' }}
                    type="email"
                    value={email}
                    onChange={(_, d) => setEmail(d.value)}
                    maxLength={150}
                    disabled={!esNuevo}
                  />
                </D365FormField>

                <D365FormField label="Dirección de Servicio" required info="Calle, avenida, número y urbanización">
                  <Input
                    style={{ width: '100%' }}
                    value={direccion}
                    onChange={(_, d) => setDireccion(d.value)}
                    maxLength={250}
                  />
                </D365FormField>

                <D365FormField label="Referencia de Ubicación" info="Punto de referencia para cuadrilla técnica">
                  <Input
                    style={{ width: '100%' }}
                    value={referenciaUbicacion}
                    onChange={(_, d) => setReferenciaUbicacion(d.value)}
                    maxLength={250}
                  />
                </D365FormField>

                <D365FormField label="Distrito / Ubigeo" required info="Seleccione el distrito de cobertura">
                  <Combobox
                    style={{ width: '100%' }}
                    placeholder="Escriba para buscar distrito o departamento..."
                    value={
                      ubigeoSeleccionadoObj
                        ? `${ubigeoSeleccionadoObj.distrito} - ${ubigeoSeleccionadoObj.provincia}, ${ubigeoSeleccionadoObj.departamento}`
                        : busquedaUbigeo
                    }
                    selectedOptions={ubigeoCodigo ? [ubigeoCodigo] : []}
                    onOptionSelect={(_, d) => {
                      if (d.optionValue) {
                        setUbigeoCodigo(d.optionValue);
                        const sel = ubigeos.find((u) => u.codigo === d.optionValue);
                        if (sel) {
                          setBusquedaUbigeo(
                            `${sel.distrito} - ${sel.provincia}, ${sel.departamento}`
                          );
                        }
                      }
                    }}
                    onChange={(e) => setBusquedaUbigeo((e.target as HTMLInputElement).value)}
                  >
                    {ubigeosFiltrados.map((u) => (
                      <Option key={u.codigo} value={u.codigo} text={`${u.distrito} - ${u.provincia}, ${u.departamento}`}>
                        {u.distrito} — {u.provincia}, {u.departamento} ({u.codigo})
                      </Option>
                    ))}
                  </Combobox>
                </D365FormField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <D365FormField label="Latitud GPS">
                    <Input
                      style={{ width: '100%' }}
                      type="number"
                      step="any"
                      value={coordenadaLat}
                      onChange={(_, d) => setCoordenadaLat(d.value)}
                      placeholder="-12.046374"
                    />
                  </D365FormField>

                  <D365FormField label="Longitud GPS">
                    <Input
                      style={{ width: '100%' }}
                      type="number"
                      step="any"
                      value={coordenadaLng}
                      onChange={(_, d) => setCoordenadaLng(d.value)}
                      placeholder="-77.042793"
                    />
                  </D365FormField>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'clasificacion' && (
          <div style={{ maxWidth: '640px', width: '100%' }}>
            <div className={formStyles.card}>
              <div className={formStyles.cardSectionTitle}>Clasificación Comercial en Field Service</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <D365FormField
                  label="Cliente de Servicio"
                  info="Abonado o usuario final que recibe visitas, instalaciones y soporte técnico en domicilio"
                >
                  <Checkbox
                    checked={esClienteServicio}
                    onChange={(_, d) => setEsClienteServicio(!!d.checked)}
                    label="Habilitar como Cliente de Servicio (Abonado final)"
                  />
                </D365FormField>

                <D365FormField
                  label="Cliente de Facturación"
                  info="Empresa mandante o contratante que emite órdenes y asume los costos de facturación"
                >
                  <Checkbox
                    checked={esClienteFacturacion}
                    onChange={(_, d) => setEsClienteFacturacion(!!d.checked)}
                    label="Habilitar como Cliente de Facturación (Empresa Contratante)"
                  />
                </D365FormField>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClienteFormPage;
