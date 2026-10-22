import { D365FormContent } from '../../../../components/common/D365FormContent';
import { useValidationFocus } from '../../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Input,
  TabList,
  Tab,
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
  DismissCircle16Regular,
  CheckmarkCircle16Regular,
  Building16Regular,
  Location16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { ClienteService } from '../services/cliente.service';
import type {
  CrearContactoDto,
  ActualizarContactoDto,
  ClienteListadoItemDto,
  UbigeoDto,
} from '../types/cliente.types';

export const ContactoFormPage: React.FC = () => {
  const formStyles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const esNuevo = !id || id === 'nuevo';

  const toasterId = useId('contacto-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(!esNuevo);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'resumen'>('resumen');

  // Catálogos y búsquedas para Lookups (SelectorEntidadRelacionada)
  const [catalogoCuentas, setCatalogoCuentas] = useState<ClienteListadoItemDto[]>([]);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');

  const [catalogoUbigeos, setCatalogoUbigeos] = useState<UbigeoDto[]>([]);
  const [busquedaDistrito, setBusquedaDistrito] = useState('');
  const [busquedaProvincia, setBusquedaProvincia] = useState('');
  const [busquedaDepartamento, setBusquedaDepartamento] = useState('');
  const [distritoNombre, setDistritoNombre] = useState('');
  const [provincia, setProvincia] = useState('');
  const [departamento, setDepartamento] = useState('');

  // Campos de Contacto (Dynamics 365 Contact)
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cargo, setCargo] = useState('');
  const [cuentaId, setCuentaId] = useState(searchParams.get('cuentaId') || '');
  const [email, setEmail] = useState('');
  const [telefonoMovil, setTelefonoMovil] = useState('');
  const [telefonoTrabajo, setTelefonoTrabajo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ubigeoCodigo, setUbigeoCodigo] = useState('');
  const [activo, setActivo] = useState(true);

  const [savedTitle, setSavedTitle] = useState(esNuevo ? 'Nuevo Contacto' : '');
  const [savedSubtitle, setSavedSubtitle] = useState(esNuevo ? 'Ficha de Contacto' : '');

  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges(
    {
      nombres,
      apellidos,
      cargo,
      cuentaId,
      email,
      telefonoMovil,
      telefonoTrabajo,
      direccion,
      ubigeoCodigo,
    },
    !loading
  );

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

  useEffect(() => {
    ClienteService.obtenerClientes({ soloActivos: true })
      .then((list) => setCatalogoCuentas(list || []))
      .catch(() => {});

    ClienteService.obtenerUbigeos()
      .then((list) => setCatalogoUbigeos(list || []))
      .catch(() => {});
  }, []);

  const opcionesCuentas = useMemo(
    () =>
      catalogoCuentas.map((c) => ({
        id: c.id,
        nombre: c.nombreCompletoODenominacion,
        detalle: c.documentoIdentidad,
      })),
    [catalogoCuentas]
  );

  const cuentaSeleccionada = useMemo(() => {
    if (!cuentaId) return null;
    const c = catalogoCuentas.find((item) => item.id === cuentaId);
    return c ? { id: c.id, nombre: c.nombreCompletoODenominacion, detalle: c.documentoIdentidad } : null;
  }, [cuentaId, catalogoCuentas]);

  const opcionesDepartamento = useMemo(() => {
    const deps = Array.from(new Set(catalogoUbigeos.map((u) => u.departamento))).sort((a, b) =>
      a.localeCompare(b, 'es')
    );
    return deps.map((d) => ({ id: d, nombre: d }));
  }, [catalogoUbigeos]);

  const departamentoSeleccionado = useMemo(
    () => (departamento ? { id: departamento, nombre: departamento } : null),
    [departamento]
  );

  const opcionesProvincia = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; detalle: string }>();
    for (const u of catalogoUbigeos) {
      if (departamento && u.departamento !== departamento) continue;
      const key = `${u.departamento}|${u.provincia}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          nombre: u.provincia,
          detalle: u.departamento,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [catalogoUbigeos, departamento]);

  const provinciaSeleccionada = useMemo(() => {
    if (!provincia) return null;
    const key = departamento ? `${departamento}|${provincia}` : provincia;
    return {
      id: key,
      nombre: provincia,
      detalle: departamento || undefined,
    };
  }, [provincia, departamento]);

  const opcionesUbigeo = useMemo(
    () =>
      catalogoUbigeos
        .filter((u) => {
          if (departamento && u.departamento !== departamento) return false;
          if (provincia && u.provincia !== provincia) return false;
          return true;
        })
        .map((u) => ({
          id: u.codigo,
          nombre: u.distrito,
          detalle: `${u.provincia}, ${u.departamento}`,
        })),
    [catalogoUbigeos, departamento, provincia]
  );

  const ubigeoSeleccionado = useMemo(() => {
    if (!ubigeoCodigo) return null;
    const u = catalogoUbigeos.find((item) => item.codigo === ubigeoCodigo);
    if (u) {
      return {
        id: u.codigo,
        nombre: u.distrito,
        detalle: `${u.provincia}, ${u.departamento}`,
      };
    }
    return distritoNombre ? { id: ubigeoCodigo, nombre: distritoNombre } : null;
  }, [ubigeoCodigo, catalogoUbigeos, distritoNombre]);

  const resetForm = useCallback(() => {
    setNombres('');
    setApellidos('');
    setCargo('');
    setCuentaId(searchParams.get('cuentaId') || '');
    setBusquedaCuenta('');
    setEmail('');
    setTelefonoMovil('');
    setTelefonoTrabajo('');
    setDireccion('');
    setUbigeoCodigo('');
    setBusquedaDistrito('');
    setBusquedaProvincia('');
    setBusquedaDepartamento('');
    setDistritoNombre('');
    setProvincia('');
    setDepartamento('');
    setActivo(true);
    setSavedTitle('Nuevo Contacto');
    setSavedSubtitle('Ficha de Contacto');
    setMensaje(null);
    setLoading(false);
  }, [searchParams]);

  // Cargar Contacto existente
  useEffect(() => {
    if (esNuevo) {
      resetForm();
      draft.markSaved();
      return;
    }
    const cargarDetalle = async () => {
      try {
        setLoading(true);
        const c = await ClienteService.obtenerContactoPorId(id);
        setNombres(c.nombres || '');
        setApellidos(c.apellidos || '');
        setCargo(c.cargo || '');
        setCuentaId(c.cuentaId || '');
        setEmail(c.email || '');
        setTelefonoMovil(c.telefonoMovil || '');
        setTelefonoTrabajo(c.telefonoTrabajo || '');
        setDireccion(c.direccion || '');
        setUbigeoCodigo(c.ubigeoCodigo || '');
        setDistritoNombre(c.distrito || '');
        setProvincia(c.provincia || '');
        setDepartamento(c.departamento || '');
        setActivo(c.activo);
        setSavedTitle(c.nombreCompleto || 'Contacto');
        setSavedSubtitle(c.cargo || c.cuentaNombre || 'Ficha de Contacto');
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar los datos del contacto.' });
      } finally {
        setLoading(false);
      }
    };
    void cargarDetalle();
  }, [id, esNuevo, resetForm]);

  const handleGuardar = async (cerrar: boolean) => {
    const savedDraft = draft.capture();

    if (!nombres.trim()) {
      focusValidation('Nombres');
      setMensaje({ tipo: 'error', texto: 'Ingrese los nombres del contacto.' });
      return;
    }

    if (!apellidos.trim()) {
      focusValidation('Apellidos');
      setMensaje({ tipo: 'error', texto: 'Ingrese los apellidos del contacto.' });
      return;
    }

    if (!telefonoMovil.trim()) {
      focusValidation('Teléfono Móvil');
      setMensaje({ tipo: 'error', texto: 'Ingrese el teléfono móvil del contacto.' });
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`.trim();

      if (esNuevo) {
        const dto: CrearContactoDto = {
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          telefonoMovil: telefonoMovil.trim(),
          cargo: cargo.trim() || undefined,
          cuentaId: cuentaId || null,
          email: email.trim() || undefined,
          telefonoTrabajo: telefonoTrabajo.trim() || undefined,
          direccion: direccion.trim() || undefined,
          ubigeoCodigo: ubigeoCodigo.trim() || undefined,
        };

        const res = await ClienteService.crearContacto(dto);

        setSavedTitle(nombreCompleto || 'Contacto');
        setSavedSubtitle(cargo.trim() || 'Ficha de Contacto');

        draft.markSaved(savedDraft);
        notifySuccess('Contacto registrado exitosamente.');
        if (cerrar) {
          navigate('/servicio-campo/contactos');
        } else {
          navigate(`/servicio-campo/contactos/${res.id}`, { replace: true });
        }
      } else {
        const dto: ActualizarContactoDto = {
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          telefonoMovil: telefonoMovil.trim(),
          cargo: cargo.trim() || undefined,
          cuentaId: cuentaId || null,
          email: email.trim() || undefined,
          telefonoTrabajo: telefonoTrabajo.trim() || undefined,
          direccion: direccion.trim() || undefined,
          ubigeoCodigo: ubigeoCodigo.trim() || undefined,
        };

        await ClienteService.actualizarContacto(id!, dto);

        setSavedTitle(nombreCompleto || 'Contacto');
        setSavedSubtitle(cargo.trim() || 'Ficha de Contacto');

        draft.markSaved(savedDraft);
        notifySuccess('Contacto actualizado exitosamente.');
        if (cerrar) {
          navigate('/servicio-campo/contactos');
        }
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar el contacto.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (esNuevo || !id) return;
    try {
      setSubmitting(true);
      await ClienteService.cambiarEstadoContacto(id, !activo);
      setActivo(!activo);
      notifySuccess(`Contacto ${!activo ? 'activado' : 'desactivado'} exitosamente.`);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cambiar estado.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={formStyles.loadingContainer}>
        <Spinner size="large" label="Cargando contacto..." />
      </div>
    );
  }

  return (
    <div className={formStyles.root}>
      <Toaster toasterId={toasterId} position="top-end" />

      {/* 1. TOP COMMAND BAR */}
      <D365CommandBar ariaLabel="Comandos de contacto">
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Atrás"
            title="Atrás"
            onClick={() => void draft.discardAndRun(() => navigate('/servicio-campo/contactos'))}
          />
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
                onClick={() =>
                  void draft.discardAndRun(() => {
                    resetForm();
                    navigate('/servicio-campo/contactos/nuevo');
                  })
                }
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

      {/* 2. ENTITY HEADER CON TABS */}
      <D365EntityHeader
        title={savedTitle || (esNuevo ? 'Nuevo Contacto' : 'Contacto')}
        subtitle={savedSubtitle || 'Ficha de Contacto'}
        avatarIcon={<PersonAccounts24Regular />}
        metadata={[
          ...(cuentaSeleccionada
            ? [{ label: 'Cuenta', value: cuentaSeleccionada.nombre }]
            : []),
          { label: 'Estado', value: activo ? 'Activo' : 'Inactivo' },
        ]}
        tabs={
          <TabList selectedValue={selectedTab} onTabSelect={(_, d) => setSelectedTab(d.value as 'resumen')}>
            <Tab value="resumen">Resumen</Tab>
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

      {/* 4. CONTENIDO DEL FORMULARIO */}
      <D365FormContent busy={submitting} className={formStyles.contentBody}>
        <div className={formStyles.grid2Cols}>
          {/* Tarjeta 1: Información del Contacto */}
          <div className={formStyles.card}>
            <div className={formStyles.cardSectionTitle}>Información del Contacto</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <D365FormField label="Nombres" required>
                <Input
                  style={{ width: '100%' }}
                  value={nombres}
                  onChange={(_, d) => setNombres(d.value)}
                  maxLength={120}
                />
              </D365FormField>

              <D365FormField label="Apellidos" required>
                <Input
                  style={{ width: '100%' }}
                  value={apellidos}
                  onChange={(_, d) => setApellidos(d.value)}
                  maxLength={120}
                />
              </D365FormField>

              <D365FormField label="Cargo / Puesto" info="Rol o relación del contacto frente a la cuenta">
                <Input
                  style={{ width: '100%' }}
                  value={cargo}
                  onChange={(_, d) => setCargo(d.value)}
                  maxLength={120}
                />
              </D365FormField>

              <D365FormField label="Cuenta" info="Cuenta a la que pertenece o representa esta persona">
                <SelectorEntidadRelacionada
                  etiquetaGrupo="Cuentas"
                  icono={<Building16Regular />}
                  opciones={opcionesCuentas}
                  seleccionada={cuentaSeleccionada}
                  textoBusqueda={busquedaCuenta}
                  alCambiarBusqueda={setBusquedaCuenta}
                  alSeleccionar={(cid) => setCuentaId(cid || '')}
                  alNavegar={(cid) => navigate(`/servicio-campo/cuentas/${cid}`)}
                  deshabilitado={submitting}
                />
              </D365FormField>

              <D365FormField label="Correo Electrónico">
                <Input
                  style={{ width: '100%' }}
                  type="email"
                  value={email}
                  onChange={(_, d) => setEmail(d.value)}
                  maxLength={150}
                />
              </D365FormField>

              <D365FormField label="Teléfono Móvil" required info="Celular directo para coordinar con la persona">
                <Input
                  style={{ width: '100%' }}
                  value={telefonoMovil}
                  onChange={(_, d) => setTelefonoMovil(d.value)}
                  maxLength={30}
                />
              </D365FormField>

              <D365FormField label="Teléfono de Trabajo / Fijo">
                <Input
                  style={{ width: '100%' }}
                  value={telefonoTrabajo}
                  onChange={(_, d) => setTelefonoTrabajo(d.value)}
                  maxLength={30}
                />
              </D365FormField>
            </div>
          </div>

          {/* Tarjeta 2: Dirección */}
          <div className={formStyles.card}>
            <div className={formStyles.cardSectionTitle}>Dirección</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <D365FormField label="Dirección">
                <Input
                  style={{ width: '100%' }}
                  value={direccion}
                  onChange={(_, d) => setDireccion(d.value)}
                  maxLength={250}
                />
              </D365FormField>

              <D365FormField
                label="Distrito"
                info="Busque por distrito, provincia o departamento"
              >
                <SelectorEntidadRelacionada
                  etiquetaGrupo="Distritos"
                  icono={<Location16Regular />}
                  opciones={opcionesUbigeo}
                  seleccionada={ubigeoSeleccionado}
                  textoBusqueda={busquedaDistrito}
                  alCambiarBusqueda={setBusquedaDistrito}
                  alSeleccionar={(codigo) => {
                    if (!codigo) {
                      setUbigeoCodigo('');
                      setDistritoNombre('');
                      return;
                    }
                    const found = catalogoUbigeos.find((u) => u.codigo === codigo);
                    if (found) {
                      setUbigeoCodigo(found.codigo);
                      setDistritoNombre(found.distrito);
                      setProvincia(found.provincia);
                      setDepartamento(found.departamento);
                    }
                  }}
                  deshabilitado={submitting}
                />
              </D365FormField>

              <D365FormField label="Provincia">
                <SelectorEntidadRelacionada
                  etiquetaGrupo="Provincias"
                  icono={<Location16Regular />}
                  opciones={opcionesProvincia}
                  seleccionada={provinciaSeleccionada}
                  textoBusqueda={busquedaProvincia}
                  alCambiarBusqueda={setBusquedaProvincia}
                  alSeleccionar={(provKey) => {
                    if (!provKey) {
                      setProvincia('');
                      setUbigeoCodigo('');
                      setDistritoNombre('');
                      return;
                    }
                    const [depName, provName] = provKey.includes('|')
                      ? provKey.split('|')
                      : [departamento, provKey];
                    setDepartamento(depName || '');
                    setProvincia(provName || '');
                    const currentUbigeo = catalogoUbigeos.find((u) => u.codigo === ubigeoCodigo);
                    if (
                      currentUbigeo &&
                      (currentUbigeo.provincia !== provName || currentUbigeo.departamento !== depName)
                    ) {
                      setUbigeoCodigo('');
                      setDistritoNombre('');
                    }
                  }}
                  deshabilitado={submitting}
                />
              </D365FormField>

              <D365FormField label="Departamento">
                <SelectorEntidadRelacionada
                  etiquetaGrupo="Departamentos"
                  icono={<Location16Regular />}
                  opciones={opcionesDepartamento}
                  seleccionada={departamentoSeleccionado}
                  textoBusqueda={busquedaDepartamento}
                  alCambiarBusqueda={setBusquedaDepartamento}
                  alSeleccionar={(depName) => {
                    if (!depName) {
                      setDepartamento('');
                      setProvincia('');
                      setUbigeoCodigo('');
                      setDistritoNombre('');
                      return;
                    }
                    setDepartamento(depName);
                    const currentUbigeo = catalogoUbigeos.find((u) => u.codigo === ubigeoCodigo);
                    if (currentUbigeo && currentUbigeo.departamento !== depName) {
                      setUbigeoCodigo('');
                      setDistritoNombre('');
                      setProvincia('');
                    } else if (provincia) {
                      const provBelongs = catalogoUbigeos.some(
                        (u) => u.departamento === depName && u.provincia === provincia
                      );
                      if (!provBelongs) {
                        setProvincia('');
                      }
                    }
                  }}
                  deshabilitado={submitting}
                />
              </D365FormField>
            </div>
          </div>
        </div>
      </D365FormContent>
    </div>
  );
};

export default ContactoFormPage;
