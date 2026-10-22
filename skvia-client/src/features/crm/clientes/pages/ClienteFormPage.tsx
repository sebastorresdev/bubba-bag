import { D365FormContent } from '../../../../components/common/D365FormContent';
import { useValidationFocus } from '../../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Input,
  TabList,
  Tab,
  Checkbox,
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
  Spinner,
  Button,
  Badge,
  Text,
  Link,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  Building24Regular,
  DismissCircle16Regular,
  CheckmarkCircle16Regular,
  Person16Regular,
  Location16Regular,
  Open16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { ClienteService } from '../services/cliente.service';
import type {
  CrearClienteDto,
  ActualizarClienteDto,
  ContactoDto,
  UbigeoDto,
} from '../types/cliente.types';

function normalizarTexto(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae latitud y longitud desde cualquier formato de Google Maps / WhatsApp:
 * - Coordenadas directas: "-12.046374, -77.042793"
 * - Enlaces ?q=-12.0463,-77.0427 o ll=-12.0463,-77.0427
 * - Enlaces /@-12.046374,-77.042793,17z
 * - Enlaces !3d-12.046374!4d-77.042793
 */
function extraerCoordenadasDeTexto(texto: string): { lat: number; lng: number } | null {
  const limpio = decodeURIComponent(texto.trim());

  // 1. Formato !3dLAT!4dLNG de Google Maps
  const match3d4d = limpio.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/i);
  if (match3d4d) {
    const lat = parseFloat(match3d4d[1]);
    const lng = parseFloat(match3d4d[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }

  // 2. Formato @LAT,LNG o q=LAT,LNG o par de coordenadas decimales
  const matchPar = limpio.match(/(-?\d{1,2}\.\d{3,})\s*[,;\s]\s*(-?\d{1,3}\.\d{3,})/);
  if (matchPar) {
    const lat = parseFloat(matchPar[1]);
    const lng = parseFloat(matchPar[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  }

  return null;
}

export interface ClienteFormPageProps {
  modoInicial?: 'JURIDICA' | 'NATURAL';
}

export const ClienteFormPage: React.FC<ClienteFormPageProps> = () => {
  const formStyles = useD365FormStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const esNuevo = !id || id === 'nuevo';

  const toasterId = useId('cliente-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [loading, setLoading] = useState(!esNuevo);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'resumen' | 'clasificacion'>('resumen');

  // Catálogos y búsquedas para Lookups (SelectorEntidadRelacionada)
  const [catalogoUbigeos, setCatalogoUbigeos] = useState<UbigeoDto[]>([]);
  const [busquedaDistrito, setBusquedaDistrito] = useState('');
  const [busquedaProvincia, setBusquedaProvincia] = useState('');
  const [busquedaDepartamento, setBusquedaDepartamento] = useState('');
  const [distritoNombre, setDistritoNombre] = useState('');
  const [provincia, setProvincia] = useState('');
  const [departamento, setDepartamento] = useState('');

  const [catalogoContactos, setCatalogoContactos] = useState<ContactoDto[]>([]);
  const [busquedaContacto, setBusquedaContacto] = useState('');
  const [contactosAsociados, setContactosAsociados] = useState<ContactoDto[]>([]);

  // Estados unificados de la Cuenta
  const [codigoCliente, setCodigoCliente] = useState('');
  const [nombreCuenta, setNombreCuenta] = useState('');
  const [documentoIdentidad, setDocumentoIdentidad] = useState('');
  const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
  const [telefonoSecundario, setTelefonoSecundario] = useState('');
  const [email, setEmail] = useState('');
  const [contactoPrincipalId, setContactoPrincipalId] = useState('');
  const [direccion, setDireccion] = useState('');
  const [referenciaUbicacion, setReferenciaUbicacion] = useState('');
  const [ubigeoCodigo, setUbigeoCodigo] = useState('');
  const [coordenadaLat, setCoordenadaLat] = useState<string>('');
  const [coordenadaLng, setCoordenadaLng] = useState<string>('');
  const [entradaGps, setEntradaGps] = useState<string>('');
  const [geocodificando, setGeocodificando] = useState<boolean>(false);
  const [esClienteFacturacion, setEsClienteFacturacion] = useState(true);
  const [esClienteServicio, setEsClienteServicio] = useState(true);
  const [activo, setActivo] = useState(true);

  const [savedTitle, setSavedTitle] = useState(esNuevo ? 'Nueva Cuenta' : '');
  const [savedSubtitle, setSavedSubtitle] = useState(esNuevo ? 'Ficha de Cuenta' : '');

  const focusValidation = useValidationFocus();
  const draft = useUnsavedChanges(
    {
      nombreCuenta,
      documentoIdentidad,
      telefonoPrincipal,
      telefonoSecundario,
      email,
      contactoPrincipalId,
      direccion,
      referenciaUbicacion,
      ubigeoCodigo,
      coordenadaLat,
      coordenadaLng,
      esClienteFacturacion,
      esClienteServicio,
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
    ClienteService.obtenerContactos({ soloActivos: true })
      .then((list) => setCatalogoContactos(list || []))
      .catch(() => {});

    ClienteService.obtenerUbigeos()
      .then((list) => setCatalogoUbigeos(list || []))
      .catch(() => {});
  }, []);

  // Geocodificación inversa automática al pegar enlace de WhatsApp/Google Maps o coordenadas
  const resolverUbicacionDesdeCoordenadas = useCallback(
    async (lat: number, lng: number) => {
      try {
        setGeocodificando(true);
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`,
          { headers: { Accept: 'application/json' } }
        );
        if (!resp.ok) return;
        const data = await resp.json();
        const addr = data?.address || {};

        // 1. Sugerir calle + número si el campo Dirección está vacío
        const via = addr.road || addr.pedestrian || addr.residential || addr.suburb || '';
        const numero = addr.house_number ? ` ${addr.house_number}` : '';
        const dirSugerida = `${via}${numero}`.trim();
        setDireccion((prev) => (prev.trim() ? prev : dirSugerida));

        // 2. Buscar coincidencia en el catálogo oficial de Ubigeos INEI
        const candidatosDistrito = [
          addr.city_district,
          addr.suburb,
          addr.municipality,
          addr.town,
          addr.city,
          addr.village,
          addr.county,
        ]
          .filter(Boolean)
          .map((c: string) => normalizarTexto(c).replace(/^DISTRITO DE\s+/, ''));

        const estadoRaw = normalizarTexto(addr.state || addr.region || '').replace(
          /^(DEPARTAMENTO DE|GOBIERNO REGIONAL DE|PROVINCIA DE)\s+/,
          ''
        );

        if (catalogoUbigeos.length > 0 && candidatosDistrito.length > 0) {
          let match: UbigeoDto | undefined;

          // Intento 1: Coincidencia exacta de distrito (+ departamento si coincide)
          for (const cand of candidatosDistrito) {
            match = catalogoUbigeos.find(
              (u) =>
                normalizarTexto(u.distrito) === cand &&
                (!estadoRaw ||
                  estadoRaw.includes(normalizarTexto(u.departamento)) ||
                  normalizarTexto(u.departamento).includes(estadoRaw) ||
                  (cand === 'CALLAO' && u.departamento === 'CALLAO'))
            );
            if (match) break;
          }

          // Intento 2: Coincidencia exacta de distrito en cualquier departamento
          if (!match) {
            for (const cand of candidatosDistrito) {
              match = catalogoUbigeos.find((u) => normalizarTexto(u.distrito) === cand);
              if (match) break;
            }
          }

          // Intento 3: Coincidencia parcial de distrito
          if (!match) {
            for (const cand of candidatosDistrito) {
              if (cand.length < 3) continue;
              match = catalogoUbigeos.find(
                (u) =>
                  normalizarTexto(u.distrito).includes(cand) ||
                  cand.includes(normalizarTexto(u.distrito))
              );
              if (match) break;
            }
          }

          if (match) {
            setUbigeoCodigo(match.codigo);
            setDistritoNombre(match.distrito);
            setProvincia(match.provincia);
            setDepartamento(match.departamento);
          }
        }
      } catch (e) {
        console.warn('No se pudo autocompletar dirección desde GPS:', e);
      } finally {
        setGeocodificando(false);
      }
    },
    [catalogoUbigeos]
  );

  const handleCambioEntradaGps = (valor: string) => {
    setEntradaGps(valor);
    if (!valor.trim()) {
      setCoordenadaLat('');
      setCoordenadaLng('');
      return;
    }
    const coords = extraerCoordenadasDeTexto(valor);
    if (coords) {
      const latStr = coords.lat.toFixed(6);
      const lngStr = coords.lng.toFixed(6);
      setCoordenadaLat(latStr);
      setCoordenadaLng(lngStr);
      setEntradaGps(`${latStr}, ${lngStr}`);
      void resolverUbicacionDesdeCoordenadas(coords.lat, coords.lng);
    }
  };

  // Opciones sincronizadas entre Distrito, Provincia y Departamento
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

  const opcionesContactos = useMemo(
    () =>
      catalogoContactos.map((c) => ({
        id: c.id,
        nombre: c.nombreCompleto,
        detalle: c.telefonoMovil,
      })),
    [catalogoContactos]
  );

  const contactoSeleccionado = useMemo(() => {
    if (!contactoPrincipalId) return null;
    const c = catalogoContactos.find((item) => item.id === contactoPrincipalId);
    return c ? { id: c.id, nombre: c.nombreCompleto, detalle: c.telefonoMovil } : null;
  }, [contactoPrincipalId, catalogoContactos]);

  const resetForm = useCallback(() => {
    setCodigoCliente('');
    setNombreCuenta('');
    setDocumentoIdentidad('');
    setTelefonoPrincipal('');
    setTelefonoSecundario('');
    setEmail('');
    setContactoPrincipalId('');
    setBusquedaContacto('');
    setDireccion('');
    setReferenciaUbicacion('');
    setUbigeoCodigo('');
    setBusquedaDistrito('');
    setBusquedaProvincia('');
    setBusquedaDepartamento('');
    setDistritoNombre('');
    setProvincia('');
    setDepartamento('');
    setCoordenadaLat('');
    setCoordenadaLng('');
    setEntradaGps('');
    setEsClienteFacturacion(true);
    setEsClienteServicio(true);
    setActivo(true);
    setContactosAsociados([]);
    setSavedTitle('Nueva Cuenta');
    setSavedSubtitle('Ficha de Cuenta');
    setMensaje(null);
    setLoading(false);
  }, []);

  // Cargar Cuenta existente
  useEffect(() => {
    if (esNuevo) {
      resetForm();
      draft.markSaved();
      return;
    }
    const cargarDetalle = async () => {
      try {
        setLoading(true);
        const [cli, contactosCuenta] = await Promise.all([
          ClienteService.obtenerClientePorId(id),
          ClienteService.obtenerContactos({ cuentaId: id }),
        ]);
        setCodigoCliente(cli.codigoCliente);
        const nombreUnificado =
          cli.nombreCompletoODenominacion ||
          cli.razonSocial ||
          `${cli.nombres} ${cli.apellidos || ''}`.trim();
        setNombreCuenta(nombreUnificado);
        setDocumentoIdentidad(cli.documentoIdentidad);
        setTelefonoPrincipal(cli.telefonoPrincipal);
        setTelefonoSecundario(cli.telefonoSecundario || '');
        setEmail(cli.email || '');
        setContactoPrincipalId(cli.contactoPrincipalId || '');
        setDireccion(cli.direccion);
        setReferenciaUbicacion(cli.referenciaUbicacion || '');
        setUbigeoCodigo(cli.ubigeoCodigo || '');
        setDistritoNombre(cli.distrito || '');
        setProvincia(cli.provincia || '');
        setDepartamento(cli.departamento || '');
        const latVal =
          cli.coordenadaLat !== null && cli.coordenadaLat !== undefined ? String(cli.coordenadaLat) : '';
        const lngVal =
          cli.coordenadaLng !== null && cli.coordenadaLng !== undefined ? String(cli.coordenadaLng) : '';
        setCoordenadaLat(latVal);
        setCoordenadaLng(lngVal);
        setEntradaGps(latVal && lngVal ? `${latVal}, ${lngVal}` : '');
        setEsClienteFacturacion(cli.esClienteFacturacion);
        setEsClienteServicio(cli.esClienteServicio);
        setActivo(cli.activo);
        setContactosAsociados(contactosCuenta || []);

        setSavedTitle(nombreUnificado || 'Cuenta');
        setSavedSubtitle(cli.documentoIdentidad ? `N° Doc: ${cli.documentoIdentidad}` : 'Ficha de Cuenta');
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar los datos de la cuenta.' });
      } finally {
        setLoading(false);
      }
    };
    void cargarDetalle();
  }, [id, esNuevo, resetForm]);

  const handleGuardar = async (cerrar: boolean) => {
    const savedDraft = draft.capture();

    if (!nombreCuenta.trim()) {
      setSelectedTab('resumen');
      focusValidation('Nombre de la Cuenta');
      setMensaje({ tipo: 'error', texto: 'Ingrese el nombre de la cuenta.' });
      return;
    }

    if (!documentoIdentidad.trim()) {
      setSelectedTab('resumen');
      focusValidation('N° de Documento');
      setMensaje({ tipo: 'error', texto: 'Ingrese el número de documento (RUC, DNI o CE).' });
      return;
    }

    if (!telefonoPrincipal.trim()) {
      setSelectedTab('resumen');
      focusValidation('Teléfono Principal');
      setMensaje({ tipo: 'error', texto: 'Ingrese el teléfono principal de la cuenta.' });
      return;
    }

    if (!direccion.trim()) {
      setSelectedTab('resumen');
      focusValidation('Dirección');
      setMensaje({ tipo: 'error', texto: 'Ingrese la dirección de servicio.' });
      return;
    }

    if (!ubigeoCodigo.trim()) {
      setSelectedTab('resumen');
      focusValidation('Distrito');
      setMensaje({ tipo: 'error', texto: 'Seleccione un distrito válido de la lista.' });
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
          nombres: nombreCuenta.trim(),
          razonSocial: nombreCuenta.trim(),
          telefonoPrincipal: telefonoPrincipal.trim(),
          telefonoSecundario: telefonoSecundario.trim() || undefined,
          email: email.trim() || undefined,
          contactoPrincipalId: contactoPrincipalId || null,
          direccion: direccion.trim(),
          ubigeoCodigo: ubigeoCodigo.trim(),
          referenciaUbicacion: referenciaUbicacion.trim() || undefined,
          coordenadaLat: !isNaN(latNum as number) ? latNum : undefined,
          coordenadaLng: !isNaN(lngNum as number) ? lngNum : undefined,
          esClienteFacturacion,
          esClienteServicio,
        };

        const res = await ClienteService.crearCliente(dto);

        setSavedTitle(nombreCuenta.trim() || 'Cuenta');
        setSavedSubtitle(`N° Doc: ${documentoIdentidad.trim()}`);

        draft.markSaved(savedDraft);
        notifySuccess('Cuenta registrada exitosamente.');
        if (cerrar) {
          navigate('/servicio-campo/cuentas');
        } else {
          navigate(`/servicio-campo/cuentas/${res.id}`, { replace: true });
        }
      } else {
        const dto: ActualizarClienteDto = {
          nombreCuenta: nombreCuenta.trim(),
          documentoIdentidad: documentoIdentidad.trim(),
          telefonoPrincipal: telefonoPrincipal.trim(),
          telefonoSecundario: telefonoSecundario.trim() || undefined,
          email: email.trim() || undefined,
          contactoPrincipalId: contactoPrincipalId || null,
          direccion: direccion.trim(),
          ubigeoCodigo: ubigeoCodigo.trim(),
          referenciaUbicacion: referenciaUbicacion.trim() || undefined,
          coordenadaLat: !isNaN(latNum as number) ? latNum : undefined,
          coordenadaLng: !isNaN(lngNum as number) ? lngNum : undefined,
          esClienteFacturacion,
          esClienteServicio,
        };

        await ClienteService.actualizarCliente(id!, dto);

        setSavedTitle(nombreCuenta.trim() || 'Cuenta');
        setSavedSubtitle(`N° Doc: ${documentoIdentidad.trim()}`);

        draft.markSaved(savedDraft);
        notifySuccess('Cuenta actualizada exitosamente.');
        if (cerrar) {
          navigate('/servicio-campo/cuentas');
        }
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar la cuenta.' });
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
      notifySuccess(`Cuenta ${!activo ? 'activada' : 'desactivada'} exitosamente.`);
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al cambiar estado.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={formStyles.loadingContainer}>
        <Spinner size="large" label="Cargando cuenta..." />
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
            tone="brand"
            aria-label="Atrás"
            title="Atrás"
            onClick={() => void draft.discardAndRun(() => navigate('/servicio-campo/cuentas'))}
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
                    navigate('/servicio-campo/cuentas/nuevo');
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
        title={savedTitle || (esNuevo ? 'Nueva Cuenta' : 'Cuenta')}
        subtitle={savedSubtitle || 'Ficha de Cuenta'}
        avatarIcon={<Building24Regular />}
        metadata={[
          ...(codigoCliente ? [{ label: 'Código', value: codigoCliente }] : []),
          { label: 'Estado', value: activo ? 'Activo' : 'Inactivo' },
        ]}
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as 'resumen' | 'clasificacion')}
          >
            <Tab value="resumen">Resumen</Tab>
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
      <D365FormContent busy={submitting} className={formStyles.contentBody}>
        {selectedTab === 'resumen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className={formStyles.grid2Cols}>
              {/* Tarjeta 1: Información de la Cuenta */}
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Información de la Cuenta</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <D365FormField
                    label="Nombre de la Cuenta"
                    required
                    info="Nombre del suscriptor, titular o razón social de la cuenta"
                  >
                    <Input
                      style={{ width: '100%' }}
                      value={nombreCuenta}
                      onChange={(_, d) => setNombreCuenta(d.value)}
                      maxLength={200}
                    />
                  </D365FormField>

                  <D365FormField
                    label="N° de Documento"
                    required
                    info="Número único de identificación (RUC, DNI o CE)"
                  >
                    <Input
                      style={{ width: '100%' }}
                      value={documentoIdentidad}
                      onChange={(_, d) => setDocumentoIdentidad(d.value)}
                      maxLength={20}
                    />
                  </D365FormField>

                  <D365FormField
                    label="Teléfono Principal"
                    required
                    info="Teléfono principal de la cuenta"
                  >
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

                  <D365FormField
                    label="Contacto Principal"
                    info="Persona principal con quien se coordina el servicio de esta cuenta"
                  >
                    <SelectorEntidadRelacionada
                      etiquetaGrupo="Contactos"
                      icono={<Person16Regular />}
                      opciones={opcionesContactos}
                      seleccionada={contactoSeleccionado}
                      textoBusqueda={busquedaContacto}
                      alCambiarBusqueda={setBusquedaContacto}
                      alSeleccionar={(cid) => setContactoPrincipalId(cid || '')}
                      alNavegar={(cid) => navigate(`/servicio-campo/contactos/${cid}`)}
                      deshabilitado={submitting}
                    />
                  </D365FormField>
                </div>
              </div>

              {/* Tarjeta 2: Dirección de Servicio */}
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Dirección de Servicio</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <D365FormField
                    label="Ubicación GPS"
                    info="Pegue aquí el enlace de ubicación de WhatsApp / Google Maps o las coordenadas (-12.xxxx, -77.xxxx) para autocompletar Distrito, Provincia, Departamento y Dirección"
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                      <Input
                        style={{ flex: 1 }}
                        value={entradaGps}
                        onChange={(_, d) => handleCambioEntradaGps(d.value)}
                        contentBefore={<Location16Regular style={{ color: tokens.colorBrandForeground1 }} />}
                        contentAfter={geocodificando ? <Spinner size="extra-tiny" /> : undefined}
                      />
                      {coordenadaLat && coordenadaLng && (
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Open16Regular />}
                          onClick={() =>
                            window.open(
                              `https://www.google.com/maps?q=${coordenadaLat},${coordenadaLng}`,
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }
                          title="Abrir ubicación en Google Maps"
                        >
                          Mapa
                        </Button>
                      )}
                    </div>
                  </D365FormField>

                  <D365FormField label="Dirección" required info="Calle, avenida, número y urbanización">
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

                  <D365FormField
                    label="Distrito"
                    required
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

            {/* Tarjeta 3: Contactos asociados a esta Cuenta */}
            {!esNuevo && (
              <div className={formStyles.card}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <div className={formStyles.cardSectionTitle} style={{ marginBottom: 0 }}>
                    Contactos de la Cuenta
                  </div>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Add16Regular />}
                    onClick={() => navigate(`/servicio-campo/contactos/nuevo?cuentaId=${id}`)}
                  >
                    Agregar Contacto
                  </Button>
                </div>

                {contactosAsociados.length === 0 ? (
                  <Text style={{ color: tokens.colorNeutralForeground3 }}>
                    No hay contactos registrados para esta cuenta.
                  </Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {contactosAsociados.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          backgroundColor: tokens.colorNeutralBackground2,
                          borderRadius: '6px',
                          border: `1px solid ${tokens.colorNeutralStroke2}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Person16Regular style={{ color: tokens.colorBrandForeground1 }} />
                          <div>
                            <Link
                              as="button"
                              onClick={() => navigate(`/servicio-campo/contactos/${c.id}`)}
                              style={{ fontWeight: 600 }}
                            >
                              {c.nombreCompleto}
                            </Link>
                            {c.cargo && (
                              <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginLeft: '8px' }}>
                                • {c.cargo}
                              </Text>
                            )}
                            <Text size={200} block style={{ color: tokens.colorNeutralForeground3 }}>
                              Móvil: {c.telefonoMovil}
                              {c.email ? ` • ${c.email}` : ''}
                            </Text>
                          </div>
                        </div>
                        {contactoPrincipalId === c.id && (
                          <Badge appearance="filled" color="brand">
                            Contacto Principal
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'clasificacion' && (
          <div className={formStyles.halfCardWrapper}>
            <div className={formStyles.card}>
              <div className={formStyles.cardSectionTitle}>Clasificación Comercial en Field Service</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <D365FormField
                  label="Cuenta de Servicio"
                  info="Suscriptor o usuario final que recibe visitas, instalaciones y soporte técnico"
                >
                  <Checkbox
                    checked={esClienteServicio}
                    onChange={(_, d) => setEsClienteServicio(!!d.checked)}
                    label="Habilitar como Cuenta de Servicio"
                  />
                </D365FormField>

                <D365FormField
                  label="Cuenta de Facturación"
                  info="Cuenta mandante o contratante que emite órdenes y asume los costos de facturación"
                >
                  <Checkbox
                    checked={esClienteFacturacion}
                    onChange={(_, d) => setEsClienteFacturacion(!!d.checked)}
                    label="Habilitar como Cuenta de Facturación"
                  />
                </D365FormField>
              </div>
            </div>
          </div>
        )}
      </D365FormContent>
    </div>
  );
};

export default ClienteFormPage;
