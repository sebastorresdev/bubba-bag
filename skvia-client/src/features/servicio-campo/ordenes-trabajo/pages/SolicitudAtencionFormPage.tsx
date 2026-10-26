import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Input,
  Text,
  TabList,
  Tab,
  Textarea,
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
  Spinner,
  Button,
  tokens,
  Select,
  Badge,
} from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  Save16Regular,
  CheckmarkCircle16Regular,
  ClipboardTask24Regular,
  Location16Regular,
  Person16Regular,
  Building16Regular,
  Add16Regular,
  Delete16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365FormContent } from '../../../../components/common/D365FormContent';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import {
  SelectorEntidadRelacionada,
  type OpcionEntidadRelacionada,
} from '../../../../components/common/SelectorEntidadRelacionada';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { useValidationFocus } from '../../../../hooks/useValidationFocus';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import { ClienteService } from '../../../crm/clientes/services/cliente.service';
import { ProductoService } from '../../../inventario/productos/services/producto.service';
import { ConfiguracionServicioService } from '../../configuraciones-servicio/services/configuracionServicio.service';
import { ListaPreciosService } from '../../../inventario/listas-precios/services/listaPrecios.service';
import { OrganizacionService } from '../../../organizacion/services/organizacion.service';
import type { TipoOrdenTrabajoOpcion, CrearOrdenTrabajoDto } from '../types/ordenTrabajo.types';
import type {
  ClienteListadoItemDto,
  ContactoDto,
  UbigeoDto,
  CrearClienteDto,
  ActualizarClienteDto,
} from '../../../crm/clientes/types/cliente.types';
import type { ProductoDto } from '../../../inventario/productos/types/producto.types';
import type { ConfiguracionServicioListadoDto } from '../../configuraciones-servicio/types/configuracionServicio.types';
import type { UnidadOrganizativaDto } from '../../../organizacion/types/organizacion.types';

interface ServicioSolicitadoItem {
  idTemp: string;
  productoId: string;
  referenciaEquipo: string;
  observaciones: string;
}

export const SolicitudAtencionFormPage: React.FC = () => {
  const formStyles = useD365FormStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusValidation = useValidationFocus();

  const contactoIdParam = searchParams.get('contactoId') || '';
  const clienteIdParam = searchParams.get('clienteId') || searchParams.get('clienteServicioId') || '';

  const toasterId = useId('solicitud-venta-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [selectedTab, setSelectedTab] = useState<'resumen'>('resumen');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Catálogos
  const [tiposOrden, setTiposOrden] = useState<TipoOrdenTrabajoOpcion[]>([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState<ProductoDto[]>([]);
  const [configuracionesServicio, setConfiguracionesServicio] = useState<ConfiguracionServicioListadoDto[]>([]);
  const [listasPrecios, setListasPrecios] = useState<{ id: string; nombre: string }[]>([]);
  const [sedes, setSedes] = useState<UnidadOrganizativaDto[]>([]);
  const [clientesCatalogo, setClientesCatalogo] = useState<ClienteListadoItemDto[]>([]);
  const [contactosCatalogo, setContactosCatalogo] = useState<ContactoDto[]>([]);
  const [catalogoUbigeos, setCatalogoUbigeos] = useState<UbigeoDto[]>([]);

  // Sección 1: Qué servicio se va a atender
  const [tipoOrdenId, setTipoOrdenId] = useState('');
  const [busquedaTipoOrden, setBusquedaTipoOrden] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [serviciosSolicitados, setServiciosSolicitados] = useState<ServicioSolicitadoItem[]>([
    { idTemp: 'item-1', productoId: '', referenciaEquipo: '', observaciones: '' },
  ]);
  const [codigoContrato, setCodigoContrato] = useState('');
  const [numeroPedido, setNumeroPedido] = useState('');
  const [observacionesGenerales, setObservacionesGenerales] = useState('');

  // Sección 2: Cliente / Prospecto y Ubicación
  const [modoOrigenCliente, setModoOrigenCliente] = useState<'contacto' | 'cuenta' | 'nuevo'>(
    contactoIdParam ? 'contacto' : clienteIdParam ? 'cuenta' : 'nuevo'
  );
  const [contactoSeleccionadoId, setContactoSeleccionadoId] = useState(contactoIdParam);
  const [busquedaContacto, setBusquedaContacto] = useState('');
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState(clienteIdParam);
  const [busquedaCliente, setBusquedaCliente] = useState('');

  // Datos del cliente para la orden (autocompletados desde Contacto o Cuenta, o ingresados nuevos)
  const [nombreCliente, setNombreCliente] = useState('');
  const [documentoIdentidad, setDocumentoIdentidad] = useState('');
  const [codigoExternoCliente, setCodigoExternoCliente] = useState('');
  const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
  const [emailCliente, setEmailCliente] = useState('');

  // Ubicación y GPS (WhatsApp / Google Maps)
  const [entradaGps, setEntradaGps] = useState('');
  const [coordenadaLat, setCoordenadaLat] = useState('');
  const [coordenadaLng, setCoordenadaLng] = useState('');
  const [geocodificando, setGeocodificando] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [referenciaUbicacion, setReferenciaUbicacion] = useState('');
  const [ubigeoCodigo, setUbigeoCodigo] = useState('');
  const [distritoNombre, setDistritoNombre] = useState('');
  const [provincia, setProvincia] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [busquedaDistrito, setBusquedaDistrito] = useState('');
  const [busquedaProvincia, setBusquedaProvincia] = useState('');
  const [busquedaDepartamento, setBusquedaDepartamento] = useState('');

  // Facturación a terceros opcional (ej. DIRECTV / Claro)
  const [facturarATercero, setFacturarATercero] = useState(false);
  const [clienteFacturacionId, setClienteFacturacionId] = useState('');
  const [busquedaClienteFacturacion, setBusquedaClienteFacturacion] = useState('');

  const draft = useUnsavedChanges(
    {
      tipoOrdenId,
      sedeId,
      serviciosSolicitados,
      codigoContrato,
      numeroPedido,
      observacionesGenerales,
      contactoSeleccionadoId,
      clienteSeleccionadoId,
      nombreCliente,
      documentoIdentidad,
      codigoExternoCliente,
      telefonoPrincipal,
      emailCliente,
      direccion,
      referenciaUbicacion,
      ubigeoCodigo,
      coordenadaLat,
      coordenadaLng,
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

  const normalizarTexto = (txt: string) =>
    txt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const extraerCoordenadasDeTexto = (
    texto: string
  ): { lat: number; lng: number } | null => {
    const limpio = decodeURIComponent(texto.trim());
    const regexPatrones = [
      /[?&]q=(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/i,
      /[?&]query=(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/i,
      /[?&]ll=(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/i,
      /@(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/i,
      /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/i,
      /(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/,
    ];
    for (const patron of regexPatrones) {
      const m = limpio.match(patron);
      if (m) {
        const lat = Number(m[1]);
        const lng = Number(m[2]);
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          return { lat, lng };
        }
      }
    }
    return null;
  };

  const resolverUbicacionDesdeCoordenadas = useCallback(
    async (lat: number, lng: number) => {
      try {
        setGeocodificando(true);
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`
        );
        if (!resp.ok) return;
        const data = await resp.json();
        const addr = data?.address;
        if (!addr) return;

        const calle = [addr.road, addr.house_number].filter(Boolean).join(' ');
        const urbanizacion = addr.neighbourhood || addr.suburb || addr.quarter || '';
        const dirSugerida = [calle, urbanizacion].filter(Boolean).join(', ');
        if (dirSugerida) {
          setDireccion(dirSugerida);
        }

        const candidatosDistrito = [
          addr.city_district,
          addr.suburb,
          addr.town,
          addr.municipality,
          addr.village,
          addr.city,
          addr.county,
        ]
          .filter(Boolean)
          .map((c: string) => normalizarTexto(c));

        const candidatoRegion = normalizarTexto(addr.state || addr.region || '');

        if (catalogoUbigeos.length > 0 && candidatosDistrito.length > 0) {
          let match = catalogoUbigeos.find((u) => {
            const distNorm = normalizarTexto(u.distrito);
            const depNorm = normalizarTexto(u.departamento);
            const coincideDist = candidatosDistrito.some(
              (c) => c === distNorm || c.includes(distNorm) || distNorm.includes(c)
            );
            const coincideDep =
              !candidatoRegion ||
              candidatoRegion.includes(depNorm) ||
              depNorm.includes(candidatoRegion);
            return coincideDist && coincideDep;
          });

          if (!match) {
            match = catalogoUbigeos.find((u) => {
              const distNorm = normalizarTexto(u.distrito);
              return candidatosDistrito.some((c) => c === distNorm);
            });
          }

          if (match) {
            setUbigeoCodigo(match.codigo);
            setDistritoNombre(match.distrito);
            setProvincia(match.provincia);
            setDepartamento(match.departamento);
          }
        }
      } catch {
        // Silencioso si no hay red
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

  // Cargar datos de un Cliente (Cuenta) en los campos del formulario
  const cargarDatosDesdeCuenta = useCallback(
    async (idCuenta: string, ubigeosList: UbigeoDto[]) => {
      if (!idCuenta) return;
      try {
        const det = await ClienteService.obtenerClientePorId(idCuenta);
        setClienteSeleccionadoId(det.id);
        setNombreCliente(det.nombreCompletoODenominacion || det.nombres || '');
        setDocumentoIdentidad(det.documentoIdentidad || '');
        setCodigoExternoCliente(det.codigoExterno || '');
        if (det.codigoExterno && !codigoContrato.trim()) {
          setCodigoContrato(det.codigoExterno);
        }
        setTelefonoPrincipal(det.telefonoPrincipal || '');
        setEmailCliente(det.email || '');
        setDireccion(det.direccion || '');
        setReferenciaUbicacion(det.referenciaUbicacion || '');
        setUbigeoCodigo(det.ubigeoCodigo || '');
        const u = ubigeosList.find((x) => x.codigo === det.ubigeoCodigo);
        setDistritoNombre(det.distrito || u?.distrito || '');
        setProvincia(det.provincia || u?.provincia || '');
        setDepartamento(det.departamento || u?.departamento || '');
        if (det.coordenadaLat != null && det.coordenadaLng != null) {
          setCoordenadaLat(String(det.coordenadaLat));
          setCoordenadaLng(String(det.coordenadaLng));
          setEntradaGps(`${det.coordenadaLat}, ${det.coordenadaLng}`);
        } else {
          setCoordenadaLat('');
          setCoordenadaLng('');
          setEntradaGps('');
        }
      } catch (err) {
        console.error('Error cargando cuenta:', err);
      }
    },
    [codigoContrato]
  );

  // Cargar datos desde un Contacto (Prospecto)
  const cargarDatosDesdeContacto = useCallback(
    async (idContacto: string, ubigeosList: UbigeoDto[]) => {
      if (!idContacto) return;
      try {
        const c = await ClienteService.obtenerContactoPorId(idContacto);
        setContactoSeleccionadoId(c.id);
        // Si el contacto ya tiene una Cuenta vinculada, cargamos esa cuenta pero manteniendo los datos de contacto si faltan
        if (c.cuentaId) {
          setClienteSeleccionadoId(c.cuentaId);
          await cargarDatosDesdeCuenta(c.cuentaId, ubigeosList);
          return;
        }
        setClienteSeleccionadoId('');
        setNombreCliente(c.nombreCompleto || `${c.nombres} ${c.apellidos}`.trim());
        setTelefonoPrincipal(c.telefonoMovil || c.telefonoTrabajo || '');
        setEmailCliente(c.email || '');
        setDireccion(c.direccion || '');
        setUbigeoCodigo(c.ubigeoCodigo || '');
        const u = ubigeosList.find((x) => x.codigo === c.ubigeoCodigo);
        setDistritoNombre(c.distrito || u?.distrito || '');
        setProvincia(c.provincia || u?.provincia || '');
        setDepartamento(c.departamento || u?.departamento || '');
      } catch (err) {
        console.error('Error cargando contacto:', err);
      }
    },
    [cargarDatosDesdeCuenta]
  );

  // Carga inicial de catálogos y preselección inteligente
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [
          tipos,
          prods,
          plants,
          listas,
          sedesRes,
          clientesRes,
          contactosRes,
          ubigeosRes,
        ] = await Promise.all([
          OrdenTrabajoService.obtenerTiposOrden().catch(() => []),
          ProductoService.getProductos(undefined, undefined, true).catch(() => []),
          ConfiguracionServicioService.getPlantillas({ soloActivos: true }).catch(() => []),
          ListaPreciosService.getListasPrecios(undefined, true).catch(() => []),
          OrganizacionService.getUnidadesOrganizativas(true).catch(() => []),
          ClienteService.obtenerClientes({ soloActivos: true }).catch(() => []),
          ClienteService.obtenerContactos({ soloActivos: true }).catch(() => []),
          ClienteService.obtenerUbigeos().catch(() => []),
        ]);

        setTiposOrden(tipos || []);
        const soloServicios = (prods || []).filter((p) => p.tipo === 'Servicio' || p.tipo === 3);
        setServiciosCatalogo(soloServicios);
        setConfiguracionesServicio(plants || []);
        setListasPrecios(listas || []);
        setSedes(sedesRes || []);
        setClientesCatalogo(clientesRes || []);
        setContactosCatalogo(contactosRes || []);
        setCatalogoUbigeos(ubigeosRes || []);

        // Preseleccionar primera sede activa automáticamente para no bloquear al vendedor
        if (sedesRes && sedesRes.length > 0) {
          setSedeId(sedesRes[0].id);
        }

        // Preseleccionar primer tipo de orden si solo hay uno
        if (tipos && tipos.length === 1) {
          setTipoOrdenId(tipos[0].id);
        }

        if (contactoIdParam) {
          setModoOrigenCliente('contacto');
          await cargarDatosDesdeContacto(contactoIdParam, ubigeosRes || []);
        } else if (clienteIdParam) {
          setModoOrigenCliente('cuenta');
          await cargarDatosDesdeCuenta(clienteIdParam, ubigeosRes || []);
        }
      } finally {
        setLoading(false);
        draft.markSaved();
      }
    };
    void init();
  }, [contactoIdParam, clienteIdParam]);

  // Opciones para selectores
  const opcionesTiposOrden: OpcionEntidadRelacionada[] = useMemo(
    () =>
      tiposOrden.map((t) => ({
        id: t.id,
        nombre: t.nombre,
      })),
    [tiposOrden]
  );

  const tipoOrdenSeleccionado = useMemo(
    () => opcionesTiposOrden.find((t) => t.id === tipoOrdenId) || null,
    [opcionesTiposOrden, tipoOrdenId]
  );

  const opcionesContactos: OpcionEntidadRelacionada[] = useMemo(
    () =>
      contactosCatalogo.map((c) => ({
        id: c.id,
        nombre: c.nombreCompleto,
        detalle: [c.telefonoMovil, c.cuentaNombre ? `Cuenta: ${c.cuentaNombre}` : 'Prospecto sin cuenta']
          .filter(Boolean)
          .join(' · '),
      })),
    [contactosCatalogo]
  );

  const contactoSeleccionadoObj = useMemo(
    () => opcionesContactos.find((c) => c.id === contactoSeleccionadoId) || null,
    [opcionesContactos, contactoSeleccionadoId]
  );

  const opcionesClientes: OpcionEntidadRelacionada[] = useMemo(
    () =>
      clientesCatalogo.map((c) => ({
        id: c.id,
        nombre: c.nombreCompletoODenominacion,
        detalle: [c.codigoCliente, c.documentoIdentidad, c.codigoExterno].filter(Boolean).join(' · '),
      })),
    [clientesCatalogo]
  );

  const clienteSeleccionadoObj = useMemo(
    () => opcionesClientes.find((c) => c.id === clienteSeleccionadoId) || null,
    [opcionesClientes, clienteSeleccionadoId]
  );

  const clienteFacturacionObj = useMemo(
    () => opcionesClientes.find((c) => c.id === clienteFacturacionId) || null,
    [opcionesClientes, clienteFacturacionId]
  );

  // Ubigeos sincronizados
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
        map.set(key, { id: key, nombre: u.provincia, detalle: u.departamento });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [catalogoUbigeos, departamento]);

  const provinciaSeleccionada = useMemo(() => {
    if (!provincia) return null;
    const key = departamento ? `${departamento}|${provincia}` : provincia;
    return { id: key, nombre: provincia, detalle: departamento || undefined };
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
      return { id: u.codigo, nombre: u.distrito, detalle: `${u.provincia}, ${u.departamento}` };
    }
    return distritoNombre ? { id: ubigeoCodigo, nombre: distritoNombre } : null;
  }, [ubigeoCodigo, catalogoUbigeos, distritoNombre]);

  const handleAgregarLineaServicio = () => {
    setServiciosSolicitados((prev) => [
      ...prev,
      { idTemp: `item-${Date.now()}-${Math.random()}`, productoId: '', referenciaEquipo: '', observaciones: '' },
    ]);
  };

  const handleQuitarLineaServicio = (idTemp: string) => {
    if (serviciosSolicitados.length <= 1) return;
    setServiciosSolicitados((prev) => prev.filter((item) => item.idTemp !== idTemp));
  };

  const handleCambiarLineaServicio = (
    idTemp: string,
    campo: keyof ServicioSolicitadoItem,
    valor: string
  ) => {
    setServiciosSolicitados((prev) =>
      prev.map((item) => (item.idTemp === idTemp ? { ...item, [campo]: valor } : item))
    );
  };

  const handleGuardarSolicitud = async (enviarADespacho: boolean) => {
    const savedDraft = draft.capture();

    if (!tipoOrdenId) {
      focusValidation('Tipo de Orden de Trabajo');
      setMensaje({ tipo: 'error', texto: 'Seleccione el Tipo de Orden de Trabajo.' });
      return;
    }

    const serviciosValidos = serviciosSolicitados.filter((s) => Boolean(s.productoId));
    if (serviciosValidos.length === 0) {
      focusValidation('Servicio a Realizar');
      setMensaje({ tipo: 'error', texto: 'Seleccione al menos un servicio a realizar.' });
      return;
    }

    if (!nombreCliente.trim()) {
      focusValidation('Nombre del Cliente / Cuenta');
      setMensaje({ tipo: 'error', texto: 'Ingrese el nombre del cliente.' });
      return;
    }

    if (!documentoIdentidad.trim()) {
      focusValidation('N° de Documento');
      setMensaje({ tipo: 'error', texto: 'Ingrese el DNI o RUC del cliente para generar su orden.' });
      return;
    }

    if (!telefonoPrincipal.trim()) {
      focusValidation('Teléfono Principal');
      setMensaje({ tipo: 'error', texto: 'Ingrese el teléfono de contacto del cliente.' });
      return;
    }

    if (!direccion.trim()) {
      focusValidation('Dirección de Atención');
      setMensaje({ tipo: 'error', texto: 'Ingrese la dirección o pegue la ubicación GPS de WhatsApp.' });
      return;
    }

    if (!ubigeoCodigo.trim()) {
      focusValidation('Distrito');
      setMensaje({ tipo: 'error', texto: 'Seleccione el distrito de atención.' });
      return;
    }

    try {
      setSubmitting(true);
      setMensaje(null);

      // 1. Resolver o convertir Contacto/Prospecto -> Cuenta (Cliente) con su CLI-XXXXXX
      let cuentaFinalId = clienteSeleccionadoId;
      const latNum = coordenadaLat.trim() !== '' ? Number(coordenadaLat) : undefined;
      const lngNum = coordenadaLng.trim() !== '' ? Number(coordenadaLng) : undefined;

      if (cuentaFinalId) {
        // Actualizar dirección/teléfono/GPS en la cuenta existente por si el cliente envió nueva ubicación por WhatsApp
        const updateDto: ActualizarClienteDto = {
          nombreCuenta: nombreCliente.trim(),
          documentoIdentidad: documentoIdentidad.trim(),
          codigoExterno: codigoExternoCliente.trim() || undefined,
          telefonoPrincipal: telefonoPrincipal.trim(),
          email: emailCliente.trim() || undefined,
          direccion: direccion.trim(),
          ubigeoCodigo: ubigeoCodigo.trim(),
          referenciaUbicacion: referenciaUbicacion.trim() || undefined,
          coordenadaLat: latNum,
          coordenadaLng: lngNum,
          contactoPrincipalId: contactoSeleccionadoId || undefined,
          esClienteFacturacion: true,
          esClienteServicio: true,
        };
        await ClienteService.actualizarCliente(cuentaFinalId, updateDto);
      } else {
        // Si no tenía cuenta (ej. venía desde Contacto/Prospecto o es cliente nuevo), buscar si ya existe por documento o crearla
        const docBuscado = documentoIdentidad.trim();
        const coincidenciaDoc = clientesCatalogo.find(
          (c) => c.documentoIdentidad.trim().toLowerCase() === docBuscado.toLowerCase()
        );
        if (coincidenciaDoc) {
          cuentaFinalId = coincidenciaDoc.id;
          await ClienteService.actualizarCliente(cuentaFinalId, {
            nombreCuenta: nombreCliente.trim(),
            documentoIdentidad: docBuscado,
            codigoExterno: codigoExternoCliente.trim() || undefined,
            telefonoPrincipal: telefonoPrincipal.trim(),
            email: emailCliente.trim() || undefined,
            direccion: direccion.trim(),
            ubigeoCodigo: ubigeoCodigo.trim(),
            referenciaUbicacion: referenciaUbicacion.trim() || undefined,
            coordenadaLat: latNum,
            coordenadaLng: lngNum,
            contactoPrincipalId: contactoSeleccionadoId || undefined,
            esClienteFacturacion: true,
            esClienteServicio: true,
          });
        } else {
          const crearCuentaDto: CrearClienteDto = {
            documentoIdentidad: docBuscado,
            codigoExterno: codigoExternoCliente.trim() || undefined,
            nombres: nombreCliente.trim(),
            telefonoPrincipal: telefonoPrincipal.trim(),
            email: emailCliente.trim() || undefined,
            direccion: direccion.trim(),
            ubigeoCodigo: ubigeoCodigo.trim(),
            referenciaUbicacion: referenciaUbicacion.trim() || undefined,
            coordenadaLat: latNum,
            coordenadaLng: lngNum,
            contactoPrincipalId: contactoSeleccionadoId || null,
            esClienteFacturacion: true,
            esClienteServicio: true,
          };
          const creada = await ClienteService.crearCliente(crearCuentaDto);
          cuentaFinalId = creada.id;
        }
      }

      // 2. Resolver Lista de Precios automáticamente desde el Tipo de Orden o la primera lista activa
      const tipoObj = tiposOrden.find((t) => t.id === tipoOrdenId);
      const listaPreciosAutoId =
        tipoObj?.listaPreciosId || listasPrecios[0]?.id || undefined;

      // 3. Resolver Sede Operativa automáticamente si no se eligió otra
      const sedeFinalId = sedeId || sedes[0]?.id || undefined;

      // 4. Armar los trabajos con su plantilla activa automática
      const trabajosDto = serviciosValidos.map((item) => {
        const conf = configuracionesServicio.find(
          (p) => p.productoId === item.productoId && p.activo
        );
        return {
          productoId: item.productoId,
          configuracionServicioId: conf?.id || undefined,
          referenciaEquipo: item.referenciaEquipo.trim() || undefined,
          observaciones: item.observaciones.trim() || undefined,
        };
      });

      const facturacionFinalId =
        facturarATercero && clienteFacturacionId ? clienteFacturacionId : cuentaFinalId;

      const crearOrdenDto: CrearOrdenTrabajoDto = {
        tipoOrdenId,
        listaPreciosId: listaPreciosAutoId,
        clienteServicioId: cuentaFinalId,
        clienteFacturacionId: facturacionFinalId,
        unidadOrganizativaId: sedeFinalId,
        codigoContrato:
          codigoContrato.trim() || codigoExternoCliente.trim() || undefined,
        numeroPedido: numeroPedido.trim() || undefined,
        observaciones: observacionesGenerales.trim() || undefined,
        trabajos: trabajosDto,
      };

      const ordenCreada = await OrdenTrabajoService.crearOrden(crearOrdenDto);

      // Si el vendedor eligió "Guardar y Enviar a Despacho", liberar inmediatamente a PendienteProgramar
      if (enviarADespacho) {
        try {
          await OrdenTrabajoService.cambiarEstadoSistema(ordenCreada.id, {
            nuevoEstadoSistema: 'PendienteProgramar',
          });
        } catch {
          // Si el rol del vendedor no tiene permiso de cambiar estado, queda igualmente creada en la bandeja del coordinador
        }
      }

      draft.markSaved(savedDraft);
      notifySuccess(
        `Orden de Trabajo ${ordenCreada.codigoWo || ''} generada exitosamente para coordinación.`
      );
      navigate(`/servicio-campo/ordenes/${ordenCreada.id}`, { replace: true });
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err?.message || 'Error al generar la orden de atención.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={formStyles.root}>
      <Toaster toasterId={toasterId} position="top-end" />

      {/* 1. BARRA DE COMANDOS SIMPLIFICADA PARA EL VENDEDOR */}
      <D365CommandBar ariaLabel="Comandos de Solicitud de Atención" busy={submitting || loading}>
        <div className={formStyles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            aria-label="Atrás"
            title="Atrás"
            onClick={() => void draft.discardAndRun(() => navigate(-1))}
          />
          <D365CommandDivider />

          <D365CommandButton
            icon={<CheckmarkCircle16Regular />}
            tone="create"
            onClick={() => void handleGuardarSolicitud(true)}
            disabled={submitting || loading}
          >
            Generar Orden y Enviar a Despacho
          </D365CommandButton>

          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            onClick={() => void handleGuardarSolicitud(false)}
            disabled={submitting || loading}
          >
            Guardar como Borrador
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. ENCABEZADO D365 CON PESTAÑA OBLIGATORIA */}
      <D365EntityHeader
        title={nombreCliente.trim() || 'Nueva Solicitud de Atención'}
        subtitle="Registro comercial rápido de Orden de Trabajo para Clientes y Prospectos"
        avatarIcon={<ClipboardTask24Regular />}
        metadata={[
          {
            label: 'Origen',
            value:
              modoOrigenCliente === 'contacto'
                ? 'Desde Contacto / Prospecto'
                : modoOrigenCliente === 'cuenta'
                ? 'Cliente Existente'
                : 'Nuevo Cliente',
          },
          {
            label: 'Servicios',
            value: `${serviciosSolicitados.filter((s) => Boolean(s.productoId)).length} seleccionado(s)`,
          },
        ]}
        tabs={
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, d) => setSelectedTab(d.value as 'resumen')}
          >
            <Tab value="resumen">Solicitud de Atención</Tab>
          </TabList>
        }
      />

      {mensaje && (
        <div style={{ padding: '0 24px', marginTop: '12px' }}>
          <D365MessageBar intent={mensaje.tipo} onDismiss={() => setMensaje(null)}>
            {mensaje.texto}
          </D365MessageBar>
        </div>
      )}

      {/* 3. CONTENIDO EN 2 COLUMNAS: SERVICIO A REALIZAR + CLIENTE Y UBICACIÓN WHATSAPP */}
      <D365FormContent busy={submitting} className={formStyles.contentBody}>
        {loading ? (
          <div className={formStyles.loadingContainer}>
            <Spinner size="large" label="Preparando formulario comercial..." />
          </div>
        ) : (
          <div className={formStyles.grid2Cols}>
            {/* COLUMNA IZQUIERDA: QUÉ SERVICIO SE VA A ATENDER */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>1. Servicio Solicitado</div>

                <D365FormField
                  label="Tipo de Orden de Trabajo"
                  required
                  info="Seleccione si es una Instalación nueva, Mantenimiento, Postventa o Garantía"
                >
                  <SelectorEntidadRelacionada
                    etiquetaGrupo="Tipos de Orden"
                    opciones={opcionesTiposOrden}
                    seleccionada={tipoOrdenSeleccionado}
                    textoBusqueda={busquedaTipoOrden}
                    alCambiarBusqueda={setBusquedaTipoOrden}
                    alSeleccionar={(nuevoId) => setTipoOrdenId(nuevoId || '')}
                    icono={<ClipboardTask24Regular />}
                    textoVacio="No hay tipos de orden activos"
                  />
                </D365FormField>

                {/* Líneas de Servicio directas sin abrir otro drawer */}
                <div
                  style={{
                    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                    paddingTop: '12px',
                    marginTop: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <Text weight="semibold" style={{ fontSize: '13px' }}>
                      Servicios a Realizar en la Visita
                    </Text>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<Add16Regular />}
                      onClick={handleAgregarLineaServicio}
                    >
                      Agregar otro servicio
                    </Button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {serviciosSolicitados.map((item, idx) => (
                      <div
                        key={item.idTemp}
                        style={{
                          padding: '12px',
                          backgroundColor: tokens.colorNeutralBackground2,
                          borderRadius: '6px',
                          border: `1px solid ${tokens.colorNeutralStroke2}`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                          }}
                        >
                          <Badge appearance="tint" color="brand">
                            Servicio #{idx + 1}
                          </Badge>
                          {serviciosSolicitados.length > 1 && (
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<Delete16Regular />}
                              style={{ color: tokens.colorStatusDangerForeground1 }}
                              onClick={() => handleQuitarLineaServicio(item.idTemp)}
                            />
                          )}
                        </div>

                        <D365FormField label="Servicio a Realizar" required>
                          <Select
                            aria-label="Servicio a Realizar"
                            className={formStyles.d365ControlFull}
                            value={item.productoId}
                            onChange={(_, d) =>
                              handleCambiarLineaServicio(item.idTemp, 'productoId', d.value)
                            }
                          >
                            <option value=""></option>
                            {serviciosCatalogo.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.codigo} — {p.nombre}
                              </option>
                            ))}
                          </Select>
                        </D365FormField>

                        <D365FormField label="Detalle o Ambiente">
                          <Input
                            className={formStyles.d365ControlFull}
                            value={item.observaciones}
                            onChange={(_, d) =>
                              handleCambiarLineaServicio(item.idTemp, 'observaciones', d.value)
                            }
                          />
                        </D365FormField>
                      </div>
                    ))}
                  </div>
                </div>

                {sedes.length > 1 && (
                  <D365FormField label="Sede Operativa" required>
                    <Select
                      aria-label="Sede Operativa"
                      className={formStyles.d365ControlFull}
                      value={sedeId}
                      onChange={(_, d) => setSedeId(d.value)}
                    >
                      <option value=""></option>
                      {sedes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.codigo ? `${s.codigo} — ` : ''}
                          {s.nombre}
                        </option>
                      ))}
                    </Select>
                  </D365FormField>
                )}

                <D365FormField
                  label="Indicaciones para el Coordinador y Técnico"
                  align="top"
                  info="Anote disponibilidad horaria del cliente, detalles del acceso o requerimientos especiales de la venta"
                >
                  <Textarea
                    className={formStyles.d365ControlFull}
                    rows={3}
                    value={observacionesGenerales}
                    onChange={(e) => setObservacionesGenerales(e.target.value)}
                  />
                </D365FormField>
              </div>

              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>Referencias Comerciales</div>

                <D365FormField label="Código de Contrato / Abonado">
                  <Input
                    className={formStyles.d365ControlFull}
                    value={codigoContrato}
                    onChange={(e) => setCodigoContrato(e.target.value)}
                  />
                </D365FormField>

                <D365FormField label="N° Pedido Comercial">
                  <Input
                    className={formStyles.d365ControlFull}
                    value={numeroPedido}
                    onChange={(e) => setNumeroPedido(e.target.value)}
                  />
                </D365FormField>

                <div style={{ marginTop: '8px' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: tokens.colorNeutralForeground2,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={facturarATercero}
                      onChange={(e) => setFacturarATercero(e.target.checked)}
                    />
                    Facturar este servicio a otra cuenta u operadora
                  </label>
                </div>

                {facturarATercero && (
                  <div style={{ marginTop: '10px' }}>
                    <D365FormField label="Cuenta de Facturación">
                      <SelectorEntidadRelacionada
                        etiquetaGrupo="Cuentas de Facturación"
                        opciones={opcionesClientes}
                        seleccionada={clienteFacturacionObj}
                        textoBusqueda={busquedaClienteFacturacion}
                        alCambiarBusqueda={setBusquedaClienteFacturacion}
                        alSeleccionar={(idSel) => setClienteFacturacionId(idSel || '')}
                        icono={<Building16Regular />}
                        textoVacio="No hay cuentas registradas"
                      />
                    </D365FormField>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA: CLIENTE / PROSPECTO Y UBICACIÓN WHATSAPP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className={formStyles.card}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div className={formStyles.cardSectionTitle} style={{ marginBottom: 0 }}>
                    2. Datos del Cliente / Prospecto
                  </div>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <Button
                      size="small"
                      appearance={modoOrigenCliente === 'contacto' ? 'primary' : 'outline'}
                      onClick={() => setModoOrigenCliente('contacto')}
                    >
                      Buscar Contacto / Prospecto
                    </Button>
                    <Button
                      size="small"
                      appearance={modoOrigenCliente === 'cuenta' ? 'primary' : 'outline'}
                      onClick={() => setModoOrigenCliente('cuenta')}
                    >
                      Buscar Cliente
                    </Button>
                    <Button
                      size="small"
                      appearance={modoOrigenCliente === 'nuevo' ? 'primary' : 'outline'}
                      onClick={() => {
                        setModoOrigenCliente('nuevo');
                        setContactoSeleccionadoId('');
                        setClienteSeleccionadoId('');
                      }}
                    >
                      Nuevo Directo
                    </Button>
                  </div>
                </div>

                {modoOrigenCliente === 'contacto' && (
                  <D365FormField
                    label="Contacto / Prospecto"
                    info="Seleccione el contacto o prospecto; al generar la orden se convertirá automáticamente en Cuenta de Cliente si aún no lo es"
                  >
                    <SelectorEntidadRelacionada
                      etiquetaGrupo="Contactos y Prospectos"
                      opciones={opcionesContactos}
                      seleccionada={contactoSeleccionadoObj}
                      textoBusqueda={busquedaContacto}
                      alCambiarBusqueda={setBusquedaContacto}
                      alSeleccionar={(idSel) => {
                        const val = idSel || '';
                        setContactoSeleccionadoId(val);
                        if (val) {
                          void cargarDatosDesdeContacto(val, catalogoUbigeos);
                        }
                      }}
                      icono={<Person16Regular />}
                      textoVacio="No hay contactos registrados"
                    />
                  </D365FormField>
                )}

                {modoOrigenCliente === 'cuenta' && (
                  <D365FormField label="Cuenta de Cliente">
                    <SelectorEntidadRelacionada
                      etiquetaGrupo="Cuentas de Clientes"
                      opciones={opcionesClientes}
                      seleccionada={clienteSeleccionadoObj}
                      textoBusqueda={busquedaCliente}
                      alCambiarBusqueda={setBusquedaCliente}
                      alSeleccionar={(idSel) => {
                        const val = idSel || '';
                        setClienteSeleccionadoId(val);
                        if (val) {
                          void cargarDatosDesdeCuenta(val, catalogoUbigeos);
                        }
                      }}
                      icono={<Building16Regular />}
                      textoVacio="No hay cuentas registradas"
                    />
                  </D365FormField>
                )}

                <D365FormField label="Nombre del Cliente / Cuenta" required>
                  <Input
                    aria-label="Nombre del Cliente / Cuenta"
                    className={formStyles.d365ControlFull}
                    value={nombreCliente}
                    onChange={(_, d) => setNombreCliente(d.value)}
                    maxLength={200}
                  />
                </D365FormField>

                <D365FormField label="N° de Documento" required info="DNI, RUC o Carnet de Extranjería">
                  <Input
                    aria-label="N° de Documento"
                    className={formStyles.d365ControlFull}
                    value={documentoIdentidad}
                    onChange={(_, d) => setDocumentoIdentidad(d.value)}
                    maxLength={20}
                  />
                </D365FormField>

                <D365FormField label="Código Externo" info="Código de cliente externo en DIRECTV, Claro u otra operadora">
                  <Input
                    className={formStyles.d365ControlFull}
                    value={codigoExternoCliente}
                    onChange={(_, d) => {
                      setCodigoExternoCliente(d.value);
                      if (!codigoContrato.trim()) {
                        setCodigoContrato(d.value);
                      }
                    }}
                    maxLength={60}
                  />
                </D365FormField>

                <D365FormField label="Teléfono Principal" required>
                  <Input
                    aria-label="Teléfono Principal"
                    className={formStyles.d365ControlFull}
                    value={telefonoPrincipal}
                    onChange={(_, d) => setTelefonoPrincipal(d.value)}
                    maxLength={30}
                  />
                </D365FormField>

                <D365FormField label="Correo Electrónico">
                  <Input
                    className={formStyles.d365ControlFull}
                    type="email"
                    value={emailCliente}
                    onChange={(_, d) => setEmailCliente(d.value)}
                    maxLength={150}
                  />
                </D365FormField>
              </div>

              <div className={formStyles.card}>
                <div className={formStyles.cardSectionTitle}>
                  3. Ubicación de Atención en Campo
                </div>

                <D365FormField
                  label="Ubicación GPS"
                  info="Pegue el enlace de ubicación enviado por el cliente en WhatsApp / Google Maps para autocompletar las coordenadas, la dirección y el distrito"
                >
                  <Input
                    className={formStyles.d365ControlFull}
                    value={entradaGps}
                    onChange={(_, d) => handleCambioEntradaGps(d.value)}
                    contentBefore={<Location16Regular style={{ color: tokens.colorBrandForeground1 }} />}
                    contentAfter={geocodificando ? <Spinner size="extra-tiny" /> : undefined}
                  />
                </D365FormField>

                <D365FormField label="Dirección de Atención" required>
                  <Input
                    aria-label="Dirección de Atención"
                    className={formStyles.d365ControlFull}
                    value={direccion}
                    onChange={(_, d) => setDireccion(d.value)}
                    maxLength={250}
                  />
                </D365FormField>

                <D365FormField label="Referencia de Ubicación">
                  <Input
                    className={formStyles.d365ControlFull}
                    value={referenciaUbicacion}
                    onChange={(_, d) => setReferenciaUbicacion(d.value)}
                    maxLength={250}
                  />
                </D365FormField>

                <D365FormField label="Distrito" required>
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
                        (currentUbigeo.provincia !== provName ||
                          currentUbigeo.departamento !== depName)
                      ) {
                        setUbigeoCodigo('');
                        setDistritoNombre('');
                      }
                    }}
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
                      }
                    }}
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
