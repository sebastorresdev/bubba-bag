import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Input,
  Select,
  Text,
  Badge,
  Spinner,
  makeStyles,
  tokens,
  typographyStyles,
  Card,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ArrowLeft16Regular,
  Save16Regular,
  SaveMultiple16Regular,
  Add16Regular,
  Delete16Regular,
  ArrowExit16Regular,
  Search16Regular,
  CheckmarkCircle16Filled,
  Warning16Filled,
  Building16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormContent } from '../../../../components/common/D365FormContent';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { SelectorEntidadRelacionada, type OpcionEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { AlmacenService } from '../../almacenes/services/almacen.service';
import type { AlmacenDto } from '../../almacenes/types/almacen.types';
import { ClienteService } from '../../../crm/clientes/services/cliente.service';
import type { ClienteListadoItemDto } from '../../../crm/clientes/types/cliente.types';
import { InventarioProductoService } from '../../inventario-productos/services/inventario-producto.service';
import type { InventarioProductoDto, ItemSeriadoStockDto } from '../../inventario-productos/types/inventario-producto.types';
import { DevolucionProveedorService } from '../services/devolucionProveedor.service';
import { DocumentoRespaldoUpload } from '../../comun/DocumentoRespaldoUpload';

interface LineaForm {
  idTemp: string;
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  esSerializado: boolean;
  cantidad: number;
  condicion: 'Defectuoso' | 'Utilizable';
  series: string[];
}

const useStyles = makeStyles({
  scannerPanel: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
  scannerGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(200px, 1.4fr) minmax(240px, 1.8fr) 140px 100px auto',
    gap: tokens.spacingHorizontalM,
    alignItems: 'end',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  scannerField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  scannerLabel: {
    ...typographyStyles.caption1,
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
  tableWrapper: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    marginTop: tokens.spacingVerticalS,
  },
  seriesTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    marginTop: '6px',
    maxHeight: '120px',
    overflowY: 'auto',
  },
  serieTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase100,
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
  },
  deleteSerieBtn: {
    cursor: 'pointer',
    color: tokens.colorStatusDangerForeground1,
    fontWeight: 'bold',
    marginLeft: '2px',
    ':hover': {
      color: tokens.colorPaletteRedForeground1,
    },
  },
});

export const DevolucionProveedorFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const formStyles = useD365FormStyles();
  const styles = useStyles();

  const esNuevo = !id || id === 'nuevo';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null);

  // Encabezado estático (solo cambia al guardar o al cargar desde la API, NUNCA mientras se escribe)
  const [savedHeader, setSavedHeader] = useState<{
    title: string;
    subtitle: string;
    numero: string;
    proveedor: string;
    numeroDocumento: string;
    totalUnidades: number;
    fechaEmision: string;
    estado: string;
  }>({
    title: esNuevo ? 'Nueva Devolución a Proveedor' : '',
    subtitle: 'Logística Inversa y Devolución Formal de Equipos / Garantías a DIRECTV y Proveedores',
    numero: '',
    proveedor: '—',
    numeroDocumento: '—',
    totalUnidades: 0,
    fechaEmision: '—',
    estado: 'Borrador',
  });

  // Catálogos
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [cuentas, setCuentas] = useState<ClienteListadoItemDto[]>([]);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');
  const [cuentaSeleccionadaId, setCuentaSeleccionadaId] = useState<string | null>(null);
  const [productosStock, setProductosStock] = useState<InventarioProductoDto[]>([]);
  const [seriesStock, setSeriesStock] = useState<ItemSeriadoStockDto[]>([]);

  // Datos del formulario - Sin valores prellenados por defecto ni placeholders
  const [numero, setNumero] = useState<string>('Nuevo');
  const [proveedor, setProveedor] = useState('');
  const [almacenId, setAlmacenId] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaDocumento, setFechaDocumento] = useState<Date | null>(null);
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [documentoRespaldoUrl, setDocumentoRespaldoUrl] = useState<string | null>(null);
  const [estado, setEstado] = useState<'Borrador' | 'Completada' | 'Anulada'>('Borrador');
  const [lineas, setLineas] = useState<LineaForm[]>([]);

  // Estados del Escáner / Pistoleo de Series
  const [scannerQuery, setScannerQuery] = useState('');
  const [scannerProductoId, setScannerProductoId] = useState('');
  const [scannerCantidad, setScannerCantidad] = useState('1');
  const [scannerCondicion, setScannerCondicion] = useState<'Defectuoso' | 'Utilizable'>('Defectuoso');
  const [scannerFeedback, setScannerFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);

  // ID de la devolución si ya existe o se guarda como borrador
  const [devolucionId, setDevolucionId] = useState<string | null>(id && id !== 'nuevo' ? id : null);
  const [dialogoEliminarBorrador, setDialogoEliminarBorrador] = useState(false);

  // Modal de éxito
  const [dialogoExito, setDialogoExito] = useState<{
    open: boolean;
    numero: string;
    totalUnidades: number;
  }>({ open: false, numero: '', totalUnidades: 0 });

  const esSoloLectura = estado === 'Completada' || estado === 'Anulada';
  const draft = useUnsavedChanges(
    { proveedor, almacenId, tipoDocumento, numeroDocumento, fechaDocumento, motivo, documentoRespaldoUrl, lineas },
    !loading && !esSoloLectura
  );

  // Carga inicial de almacenes (ÚNICAMENTE Bodegas físicas tipo === 1, NUNCA custodias tipo === 2) y Cuentas jurídicas
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [alms, cts] = await Promise.all([
          AlmacenService.getAlmacenes(true),
          ClienteService.obtenerClientes({ soloActivos: true }).catch(() => []),
        ]);
        setAlmacenes((alms || []).filter(a => a.tipo === 1));
        const juridicas = (cts || []).filter(c => c.tipoPersona === 'JURIDICA' || c.esClienteFacturacion);
        setCuentas(juridicas.length > 0 ? juridicas : (cts || []));

        if (id && id !== 'nuevo') {
          const dev = await DevolucionProveedorService.obtenerPorId(id);
          setDevolucionId(dev.id);
          setNumero(dev.numero);
          setProveedor(dev.proveedor);
          setAlmacenId(dev.almacenId);
          setTipoDocumento(dev.tipoDocumento);
          setNumeroDocumento(dev.numeroDocumento);
          setFechaDocumento(dev.fechaDocumento ? new Date(dev.fechaDocumento + 'T00:00:00') : null);
          setMotivo(dev.motivo);
          setObservaciones(dev.observaciones || '');
          setDocumentoRespaldoUrl(dev.documentoRespaldoUrl || null);
          setEstado(dev.estado as any);

          const mappedLineas: LineaForm[] = (dev.lineas || []).map(l => ({
            idTemp: crypto.randomUUID(),
            productoId: l.productoId,
            codigoProducto: l.codigoProducto,
            nombreProducto: l.nombreProducto,
            esSerializado: Boolean(l.series && l.series.length > 0),
            cantidad: l.cantidad,
            condicion: (l.condicion as any) || 'Defectuoso',
            series: l.series || [],
          }));
          setLineas(mappedLineas);

          // Encabezado estático cargado desde el registro existente
          setSavedHeader({
            title: `Devolución ${dev.numero}`,
            subtitle: 'Logística Inversa y Devolución Formal de Equipos / Garantías a DIRECTV y Proveedores',
            numero: dev.numero,
            proveedor: dev.proveedor,
            numeroDocumento: dev.numeroDocumento,
            totalUnidades: dev.totalCantidad,
            fechaEmision: dev.fechaDocumento,
            estado: dev.estado,
          });

          draft.markSaved();
        }
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: err.message || 'Error al cargar la devolución a proveedor.' });
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [id]);

  // Cuando cambia la bodega de origen -> Cargar ÚNICAMENTE los productos y series que tienen stock en esa bodega
  useEffect(() => {
    if (!almacenId) {
      setProductosStock([]);
      setSeriesStock([]);
      return;
    }

    const cargarStockAlmacen = async () => {
      try {
        const [stocks, sers] = await Promise.all([
          InventarioProductoService.obtener(almacenId),
          InventarioProductoService.obtenerSeries(almacenId),
        ]);
        // Solo productos con existencia en este almacén
        setProductosStock(stocks || []);
        setSeriesStock(sers || []);
      } catch (err: any) {
        console.error('Error cargando stock del almacén seleccionado:', err);
      }
    };
    void cargarStockAlmacen();
  }, [almacenId]);

  // Opciones de cuentas jurídicas para el selector de proveedor
  const opcionesCuentas: OpcionEntidadRelacionada[] = useMemo(() => {
    return cuentas.map(c => ({
      id: c.id,
      nombre: c.razonSocial || c.nombreCompletoODenominacion,
      detalle: c.documentoIdentidad ? `RUC ${c.documentoIdentidad}` : undefined,
    }));
  }, [cuentas]);

  const cuentaSeleccionada = useMemo(() => {
    if (cuentaSeleccionadaId) {
      const c = cuentas.find(x => x.id === cuentaSeleccionadaId);
      if (c) {
        return {
          id: c.id,
          nombre: c.razonSocial || c.nombreCompletoODenominacion,
          detalle: c.documentoIdentidad ? `RUC ${c.documentoIdentidad}` : undefined,
        };
      }
    }
    if (proveedor) {
      const provUpper = proveedor.trim().toUpperCase();
      const c = cuentas.find(x =>
        (x.razonSocial && x.razonSocial.toUpperCase() === provUpper) ||
        (x.nombreCompletoODenominacion && x.nombreCompletoODenominacion.toUpperCase() === provUpper) ||
        (x.nombres && x.nombres.toUpperCase() === provUpper)
      );
      if (c) {
        return {
          id: c.id,
          nombre: c.razonSocial || c.nombreCompletoODenominacion,
          detalle: c.documentoIdentidad ? `RUC ${c.documentoIdentidad}` : undefined,
        };
      }
      return {
        id: 'manual',
        nombre: proveedor,
        detalle: 'Proveedor ingresado manualmente',
      };
    }
    return null;
  }, [cuentas, cuentaSeleccionadaId, proveedor]);

  // Series que ya fueron agregadas en las líneas actuales para no duplicarlas
  const seriesYaAgregadas = useMemo(() => {
    const set = new Set<string>();
    lineas.forEach(l => l.series.forEach(s => set.add(s.toUpperCase())));
    return set;
  }, [lineas]);

  // Series libres en el almacén (que aún no han sido agregadas a la devolución)
  const seriesLibresAlmacen = useMemo(() => {
    return seriesStock.filter(s => !seriesYaAgregadas.has(s.numeroSerie.toUpperCase()));
  }, [seriesStock, seriesYaAgregadas]);

  // Productos no seriados disponibles en el almacén
  const productosNoSeriadosStock = useMemo(() => {
    return productosStock.filter(p => !p.esSerializado && p.cantidadDisponible > 0);
  }, [productosStock]);

  // Totales
  const totalUnidades = useMemo(() => {
    return lineas.reduce((acc, l) => acc + (l.esSerializado ? l.series.length : l.cantidad), 0);
  }, [lineas]);

  // Procesar pistoleo de escáner (SERIE o SKU/CÓDIGO DE BARRAS)
  const procesarEscaneo = (texto: string) => {
    const q = texto.trim().toUpperCase();
    if (!q) return;

    setScannerFeedback(null);

    // 1. Verificar si coincide con una serie disponible en la bodega
    const serieEncontrada = seriesStock.find(s => s.numeroSerie.toUpperCase() === q);
    if (serieEncontrada) {
      if (seriesYaAgregadas.has(q)) {
        setScannerFeedback({ tipo: 'error', texto: `La serie '${q}' ya se encuentra agregada en la lista.` });
        setScannerQuery('');
        return;
      }

      // Agregar la serie a la línea del producto o crear nueva línea
      setLineas(prev => {
        const lineaExistente = prev.find(l => l.productoId === serieEncontrada.productoId && l.condicion === scannerCondicion);
        if (lineaExistente) {
          return prev.map(l =>
            l.idTemp === lineaExistente.idTemp
              ? { ...l, series: [...l.series, serieEncontrada.numeroSerie], cantidad: l.series.length + 1 }
              : l
          );
        }

        const prodStock = productosStock.find(p => p.productoId === serieEncontrada.productoId);
        const newLine: LineaForm = {
          idTemp: crypto.randomUUID(),
          productoId: serieEncontrada.productoId,
          codigoProducto: serieEncontrada.codigoProducto,
          nombreProducto: serieEncontrada.nombreProducto || prodStock?.nombreProducto || 'Equipo',
          esSerializado: true,
          cantidad: 1,
          condicion: scannerCondicion,
          series: [serieEncontrada.numeroSerie],
        };
        return [...prev, newLine];
      });

      setScannerFeedback({ tipo: 'ok', texto: `✓ Serie '${serieEncontrada.numeroSerie}' agregada (${serieEncontrada.nombreProducto}).` });
      setScannerQuery('');
      scannerInputRef.current?.focus();
      return;
    }

    // 2. Si no es serie directa, buscar por código de producto o código de barras
    const prodEncontrado = productosStock.find(
      p => (p.codigoProducto && p.codigoProducto.toUpperCase() === q) || p.nombreProducto.toUpperCase().includes(q)
    );

    if (prodEncontrado) {
      if (prodEncontrado.esSerializado) {
        setScannerFeedback({
          tipo: 'error',
          texto: `El producto '${prodEncontrado.nombreProducto}' es seriado. Escanee o seleccione el número de serie específico del equipo.`,
        });
        setScannerProductoId(prodEncontrado.productoId);
        return;
      }

      // Es insumo no seriado
      const cant = Math.max(1, parseInt(scannerCantidad, 10) || 1);
      setLineas(prev => {
        const lineaExistente = prev.find(l => l.productoId === prodEncontrado.productoId && l.condicion === scannerCondicion);
        if (lineaExistente) {
          return prev.map(l =>
            l.idTemp === lineaExistente.idTemp ? { ...l, cantidad: l.cantidad + cant } : l
          );
        }
        const newLine: LineaForm = {
          idTemp: crypto.randomUUID(),
          productoId: prodEncontrado.productoId,
          codigoProducto: prodEncontrado.codigoProducto,
          nombreProducto: prodEncontrado.nombreProducto,
          esSerializado: false,
          cantidad: cant,
          condicion: scannerCondicion,
          series: [],
        };
        return [...prev, newLine];
      });

      setScannerFeedback({ tipo: 'ok', texto: `✓ ${cant} unid. de '${prodEncontrado.nombreProducto}' agregadas.` });
      setScannerQuery('');
      setScannerCantidad('1');
      scannerInputRef.current?.focus();
      return;
    }

    setScannerFeedback({
      tipo: 'error',
      texto: `No se encontró serie ni producto con código '${q}' en las existencias de este almacén.`,
    });
  };

  // Agregar manualmente desde el selector de productos en existencias
  const handleAgregarSeleccionado = () => {
    if (!scannerProductoId) return;

    if (scannerProductoId.startsWith('serie:')) {
      const numSerie = scannerProductoId.replace('serie:', '');
      procesarEscaneo(numSerie);
      setScannerProductoId('');
      return;
    }

    const prod = productosStock.find(p => p.productoId === scannerProductoId);
    if (!prod) return;

    if (prod.esSerializado) {
      setScannerFeedback({
        tipo: 'error',
        texto: `El producto '${prod.nombreProducto}' es seriado. Seleccione una de sus series disponibles en el menú.`,
      });
      return;
    }

    const cant = Math.max(1, parseInt(scannerCantidad, 10) || 1);
    setLineas(prev => {
      const lineaExistente = prev.find(l => l.productoId === prod.productoId && l.condicion === scannerCondicion);
      if (lineaExistente) {
        return prev.map(l =>
          l.idTemp === lineaExistente.idTemp ? { ...l, cantidad: l.cantidad + cant } : l
        );
      }
      return [
        ...prev,
        {
          idTemp: crypto.randomUUID(),
          productoId: prod.productoId,
          codigoProducto: prod.codigoProducto,
          nombreProducto: prod.nombreProducto,
          esSerializado: false,
          cantidad: cant,
          condicion: scannerCondicion,
          series: [],
        },
      ];
    });

    setScannerFeedback({ tipo: 'ok', texto: `✓ ${cant} unid. de '${prod.nombreProducto}' agregadas.` });
    setScannerProductoId('');
    setScannerCantidad('1');
  };

  // Quitar una serie específica de una línea
  const handleQuitarSerie = (lineaId: string, serie: string) => {
    setLineas(prev =>
      prev
        .map(l => {
          if (l.idTemp !== lineaId) return l;
          const remaining = l.series.filter(s => s !== serie);
          return { ...l, series: remaining, cantidad: remaining.length };
        })
        .filter(l => !l.esSerializado || l.series.length > 0)
    );
  };

  // Eliminar línea completa
  const handleEliminarLinea = (lineaId: string) => {
    setLineas(prev => prev.filter(l => l.idTemp !== lineaId));
  };

  // Guardar Borrador (sin afectar inventario ni Kardex)
  const handleGuardar = async (cerrar: boolean) => {
    setMensaje(null);
    if (!proveedor.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese la empresa proveedora destinataria.' });
      return;
    }
    if (!almacenId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione la bodega de origen de donde saldrá el material.' });
      return;
    }

    try {
      setSubmitting(true);
      const fechaStr = fechaDocumento ? fechaDocumento.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const lineasPayload = lineas.map(l => ({
        productoId: l.productoId,
        cantidad: l.esSerializado ? l.series.length : l.cantidad,
        condicion: l.condicion,
        series: l.series,
      }));

      let currentId = devolucionId;

      if (currentId) {
        // Actualizar borrador existente
        await DevolucionProveedorService.actualizar(currentId, {
          proveedor: proveedor.trim(),
          almacenId,
          ubicacionId: null,
          tipoDocumento: tipoDocumento.trim() || 'Guía de Remisión',
          numeroDocumento: numeroDocumento.trim() || 'POR DEFINIR',
          fechaDocumento: fechaStr,
          motivo: motivo.trim() || 'Garantía / Falla de Fábrica',
          observaciones: observaciones.trim() || null,
          documentoRespaldoUrl: documentoRespaldoUrl || null,
          lineas: lineasPayload,
        });
      } else {
        // Crear nuevo borrador
        const res = await DevolucionProveedorService.crear({
          proveedor: proveedor.trim(),
          almacenId,
          ubicacionId: null,
          tipoDocumento: tipoDocumento.trim() || 'Guía de Remisión',
          numeroDocumento: numeroDocumento.trim() || 'POR DEFINIR',
          fechaDocumento: fechaStr,
          motivo: motivo.trim() || 'Garantía / Falla de Fábrica',
          observaciones: observaciones.trim() || null,
          documentoRespaldoUrl: documentoRespaldoUrl || null,
          lineas: lineasPayload,
          esBorrador: true,
        });
        currentId = res.id;
        setDevolucionId(res.id);
      }

      setSavedHeader({
        title: `Devolución ${numero !== 'Nuevo' ? numero : 'Borrador'}`,
        subtitle: 'Logística Inversa y Devolución Formal de Equipos / Garantías a DIRECTV y Proveedores',
        numero: numero !== 'Nuevo' ? numero : 'Borrador',
        proveedor: proveedor.trim(),
        numeroDocumento: numeroDocumento.trim() || '—',
        totalUnidades,
        fechaEmision: fechaStr,
        estado: 'Borrador',
      });

      draft.markSaved();

      if (cerrar) {
        navigate('/servicio-campo/devoluciones-proveedor', {
          state: { successMessage: 'Borrador guardado exitosamente.' },
        });
      } else {
        setMensaje({ tipo: 'success', texto: 'Borrador guardado exitosamente.' });
        if (!devolucionId && currentId) {
          navigate(`/servicio-campo/devoluciones-proveedor/${currentId}`, { replace: true });
        }
      }
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al guardar el borrador.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Guardar y Completar Devolución (rebaja stock y registra Kardex)
  const handleConfirmarDevolucion = async () => {
    setMensaje(null);

    if (!proveedor.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese la empresa proveedora destinataria.' });
      return;
    }
    if (!almacenId) {
      setMensaje({ tipo: 'error', texto: 'Seleccione la bodega de origen de donde saldrá el material.' });
      return;
    }
    if (!tipoDocumento.trim()) {
      setMensaje({ tipo: 'error', texto: 'Seleccione el tipo de documento o acta de salida.' });
      return;
    }
    if (!numeroDocumento.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingrese el número de guía o acta de entrega firmada.' });
      return;
    }
    if (!fechaDocumento) {
      setMensaje({ tipo: 'error', texto: 'Seleccione la fecha de devolución / retiro.' });
      return;
    }
    if (!motivo.trim()) {
      setMensaje({ tipo: 'error', texto: 'Seleccione el motivo de la devolución.' });
      return;
    }
    if (lineas.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agregue al menos un material o equipo para procesar la devolución.' });
      return;
    }

    try {
      setSubmitting(true);
      const fechaStr = fechaDocumento.toISOString().slice(0, 10);
      const lineasPayload = lineas.map(l => ({
        productoId: l.productoId,
        cantidad: l.esSerializado ? l.series.length : l.cantidad,
        condicion: l.condicion,
        series: l.series,
      }));

      let finalId = devolucionId;

      if (finalId) {
        // Actualizar primero los datos y líneas del borrador
        await DevolucionProveedorService.actualizar(finalId, {
          proveedor: proveedor.trim(),
          almacenId,
          ubicacionId: null,
          tipoDocumento: tipoDocumento.trim(),
          numeroDocumento: numeroDocumento.trim(),
          fechaDocumento: fechaStr,
          motivo: motivo.trim(),
          observaciones: observaciones.trim() || null,
          documentoRespaldoUrl: documentoRespaldoUrl || null,
          lineas: lineasPayload,
        });
        // Completar la devolución (descuenta stock, kardex y series)
        await DevolucionProveedorService.completar(finalId);
      } else {
        // Crear directamente completada
        const res = await DevolucionProveedorService.crear({
          proveedor: proveedor.trim(),
          almacenId,
          ubicacionId: null,
          tipoDocumento: tipoDocumento.trim(),
          numeroDocumento: numeroDocumento.trim(),
          fechaDocumento: fechaStr,
          motivo: motivo.trim(),
          observaciones: observaciones.trim() || null,
          documentoRespaldoUrl: documentoRespaldoUrl || null,
          lineas: lineasPayload,
          esBorrador: false,
        });
        finalId = res.id;
        setDevolucionId(res.id);
      }

      setEstado('Completada');

      // Actualizar encabezado estático ÚNICAMENTE al guardar exitosamente
      setSavedHeader({
        title: `Devolución ${numero !== 'Nuevo' ? numero : ''}`,
        subtitle: 'Logística Inversa y Devolución Formal de Equipos / Garantías a DIRECTV y Proveedores',
        numero: numero !== 'Nuevo' ? numero : '',
        proveedor: proveedor.trim(),
        numeroDocumento: numeroDocumento.trim(),
        totalUnidades,
        fechaEmision: fechaStr,
        estado: 'Completada',
      });

      draft.markSaved();
      setDialogoExito({
        open: true,
        numero: numero !== 'Nuevo' ? numero : finalId || '',
        totalUnidades,
      });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al procesar la devolución a proveedor.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar borrador
  const handleEliminarBorrador = async () => {
    if (!devolucionId) return;
    try {
      setSubmitting(true);
      await DevolucionProveedorService.eliminar(devolucionId);
      draft.markSaved();
      navigate('/servicio-campo/devoluciones-proveedor', {
        state: { successMessage: 'Borrador eliminado correctamente.' },
      });
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'Error al eliminar el borrador.' });
      setDialogoEliminarBorrador(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Spinner size="large" label="Cargando formulario de devolución a proveedor..." />
      </div>
    );
  }

  return (
    <div className={formStyles.root}>
      {/* 1. Command Bar */}
      <D365CommandBar ariaLabel="Comandos de Devolución a Proveedor">
        <D365CommandButton
          icon={<ArrowLeft16Regular />}
          tone="brand"
          aria-label="Volver"
          title="Volver"
          onClick={() => {
            if (esSoloLectura) draft.markSaved();
            navigate('/servicio-campo/devoluciones-proveedor');
          }}
        />

        {!esSoloLectura && (
          <>
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
            <D365CommandDivider />
            <D365CommandButton
              icon={<ArrowExit16Regular />}
              tone="create"
              appearance="primary"
              onClick={() => void handleConfirmarDevolucion()}
              disabled={submitting || lineas.length === 0}
            >
              {submitting ? 'Procesando...' : 'Completar Devolución'}
            </D365CommandButton>
            {devolucionId && estado === 'Borrador' && (
              <D365CommandButton
                icon={<Delete16Regular />}
                tone="danger"
                disabled={submitting}
                onClick={() => setDialogoEliminarBorrador(true)}
              >
                Eliminar borrador
              </D365CommandButton>
            )}
          </>
        )}
      </D365CommandBar>

      {/* 2. Header Estático - Solo se actualiza al cargar o guardar, NUNCA mientras se escribe */}
      <D365EntityHeader
        title={savedHeader.title || (numero === 'Nuevo' ? 'Nueva Devolución a Proveedor' : `Devolución ${numero}`)}
        subtitle={savedHeader.subtitle}
        avatarIcon={<ArrowExit16Regular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />}
        metadata={[
          { label: 'Destinatario', value: savedHeader.proveedor },
          { label: 'N° Documento', value: savedHeader.numeroDocumento },
          { label: 'Total Unidades', value: String(savedHeader.totalUnidades) },
          { label: 'Fecha Emisión', value: savedHeader.fechaEmision },
          {
            label: 'Estado',
            value: (
              <Badge
                appearance="filled"
                shape="rounded"
                color={
                  estado === 'Completada' ? 'success' : estado === 'Anulada' ? 'danger' : 'warning'
                }
                size="small"
              >
                {estado}
              </Badge>
            ) as any,
          },
        ]}
      />

      {/* 3. Mensajes */}
      {mensaje && (
        <div style={{ margin: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}` }}>
          <D365MessageBar intent={mensaje.tipo === 'error' ? 'error' : 'success'} onDismiss={() => setMensaje(null)}>
            {mensaje.texto}
          </D365MessageBar>
        </div>
      )}

      {/* 4. Form Content */}
      <D365FormContent busy={submitting} className={formStyles.contentBody}>
        {/* Sección 1: Datos del Proveedor y Comprobante */}
        <div className={formStyles.card}>
          <div className={formStyles.cardSectionTitle}>1. Datos del Proveedor y Comprobante de Salida</div>
          <div className={formStyles.grid2Cols}>
            <D365FormField label="Empresa Proveedora (Cuenta Destinataria)" required info="Seleccione la cuenta jurídica del catálogo de clientes (ej: DIRECTV PERU S.R.L.)">
              <SelectorEntidadRelacionada
                etiquetaGrupo="Cuentas y Proveedores"
                opciones={opcionesCuentas}
                seleccionada={cuentaSeleccionada}
                textoBusqueda={busquedaCuenta}
                alCambiarBusqueda={setBusquedaCuenta}
                alSeleccionar={(id) => {
                  if (id && id !== 'manual') {
                    const c = cuentas.find(x => x.id === id);
                    setCuentaSeleccionadaId(id);
                    setProveedor(c?.razonSocial || c?.nombreCompletoODenominacion || '');
                  } else {
                    setCuentaSeleccionadaId(null);
                    setProveedor('');
                  }
                }}
                alCrearNuevo={(nombre) => {
                  setCuentaSeleccionadaId(null);
                  setProveedor(nombre);
                }}
                alNavegar={(id) => {
                  if (id && id !== 'manual') {
                    window.open(`/servicio-campo/cuentas/${id}`, '_blank');
                  }
                }}
                icono={<Building16Regular />}
                tituloEnlace="Ver ficha de la cuenta"
                deshabilitado={esSoloLectura || submitting}
              />
            </D365FormField>

            <D365FormField label="Bodega de Origen (Salida de Stock)" required>
              <Select
                value={almacenId}
                disabled={esSoloLectura || submitting}
                onChange={(_, d) => {
                  setAlmacenId(d.value);
                  setLineas([]);
                  setScannerFeedback(null);
                }}
              >
                <option value="">Seleccione almacén de origen...</option>
                {almacenes.filter(a => a.tipo === 1).map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </Select>
            </D365FormField>

            <D365FormField label="Tipo de Documento / Acta" required>
              <Select
                value={tipoDocumento}
                disabled={esSoloLectura || submitting}
                onChange={(_, d) => setTipoDocumento(d.value)}
              >
                <option value="">Seleccione tipo de documento...</option>
                <option value="Guía de Remisión">Guía de Remisión</option>
                <option value="Acta de Devolución">Acta de Devolución</option>
                <option value="Constancia de Retiro">Constancia de Retiro</option>
                <option value="Nota de Salida">Nota de Salida</option>
              </Select>
            </D365FormField>

            <D365FormField label="Número de Guía / Acta de la Empresa" required>
              <Input
                value={numeroDocumento}
                disabled={esSoloLectura || submitting}
                onChange={(_, d) => setNumeroDocumento(d.value)}
              />
            </D365FormField>

            <D365FormField label="Fecha de Devolución / Retiro" required>
              <DatePicker
                value={fechaDocumento}
                onSelectDate={d => setFechaDocumento(d || null)}
                formatDate={d => (d ? d.toLocaleDateString('es-PE') : '')}
                disabled={esSoloLectura || submitting}
              />
            </D365FormField>

            <D365FormField label="Motivo de la Devolución" required>
              <Select
                value={motivo}
                disabled={esSoloLectura || submitting}
                onChange={(_, d) => setMotivo(d.value)}
              >
                <option value="">Seleccione motivo...</option>
                <option value="Garantía por Falla / Avería">Garantía por Falla / Avería</option>
                <option value="Equipo Inoperativo Irreparable">Equipo Inoperativo Irreparable</option>
                <option value="Exceso de Inventario / Desmovilización">Exceso de Inventario / Desmovilización</option>
                <option value="Devolución por Cese de Contrato">Devolución por Cese de Contrato</option>
              </Select>
            </D365FormField>

            <D365FormField label="Observaciones">
              <Input
                value={observaciones}
                disabled={esSoloLectura || submitting}
                onChange={(_, d) => setObservaciones(d.value)}
              />
            </D365FormField>
          </div>
        </div>

        {/* Sección 2: Documento de Respaldo Firmado (Foto / Acta) */}
        <div>
          <DocumentoRespaldoUpload
            url={documentoRespaldoUrl}
            onUrlChange={setDocumentoRespaldoUrl}
            disabled={esSoloLectura || submitting}
            titulo="Documento de Respaldo Firmado (Guía / Acta de Entrega)"
            descripcion="Adjunte la fotografía o escaneo PDF del documento firmado por la empresa que recoge el material devuelto como respaldo legal."
          />
        </div>

        {/* Sección 3: Materiales y Equipos con Pistoleo de Series */}
        <div className={formStyles.card}>
          <div className={formStyles.cardSectionTitle}>
            2. Materiales y Equipos a Devolver ({lineas.length} ítems, {totalUnidades} unidades)
          </div>

          {!almacenId ? (
            <div style={{ textAlign: 'center', padding: '24px', color: tokens.colorNeutralForeground3 }}>
              Seleccione primero la <strong>Bodega de Origen</strong> en la sección superior para cargar los materiales y series disponibles en inventario.
            </div>
          ) : (
            <>
              {/* Panel de Pistoleo y Selección rápida */}
              {!esSoloLectura && (
                <div className={styles.scannerPanel}>
                  <div className={styles.scannerGrid}>
                    {/* Campo 1: Pistoleo directo de Serie / SKU */}
                    <div className={styles.scannerField}>
                      <label className={styles.scannerLabel}>
                        Pistola / Escaneo de Serie o SKU
                      </label>
                      <Input
                        ref={scannerInputRef}
                        contentBefore={<Search16Regular />}
                        value={scannerQuery}
                        onChange={(_, d) => setScannerQuery(d.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            procesarEscaneo(scannerQuery);
                          }
                        }}
                      />
                    </div>

                    {/* Campo 2: Menú de selección de materiales en existencias */}
                    <div className={styles.scannerField}>
                      <label className={styles.scannerLabel}>
                        O seleccionar de existencias ({productosStock.length} productos, {seriesLibresAlmacen.length} series)
                      </label>
                      <Select
                        value={scannerProductoId}
                        onChange={(_, d) => {
                          setScannerProductoId(d.value);
                          setScannerFeedback(null);
                        }}
                      >
                        <option value="">Seleccione material o serie...</option>
                        {productosNoSeriadosStock.length > 0 && (
                          <optgroup label="Insumos / Materiales Disponibles">
                            {productosNoSeriadosStock.map(p => (
                              <option key={p.productoId} value={p.productoId}>
                                {p.codigoProducto} — {p.nombreProducto} (Disp: {p.cantidadDisponible} {p.nombreUnidadMedida || 'UND'})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {seriesLibresAlmacen.length > 0 && (
                          <optgroup label="Series individuales en almacén">
                            {seriesLibresAlmacen.map(s => (
                              <option key={s.id} value={`serie:${s.numeroSerie}`}>
                                [Serie: {s.numeroSerie}] — {s.nombreProducto}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </Select>
                    </div>

                    {/* Campo 3: Condición */}
                    <div className={styles.scannerField}>
                      <label className={styles.scannerLabel}>Condición</label>
                      <Select
                        value={scannerCondicion}
                        onChange={(_, d) => setScannerCondicion(d.value as any)}
                      >
                        <option value="Defectuoso">Defectuoso / Averiado</option>
                        <option value="Utilizable">Utilizable (Buen estado)</option>
                      </Select>
                    </div>

                    {/* Campo 4: Cantidad (para insumos) */}
                    <div className={styles.scannerField}>
                      <label className={styles.scannerLabel}>Cantidad</label>
                      <Input
                        type="number"
                        min="1"
                        value={scannerCantidad}
                        onChange={(_, d) => setScannerCantidad(d.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (scannerProductoId) handleAgregarSeleccionado();
                            else if (scannerQuery) procesarEscaneo(scannerQuery);
                          }
                        }}
                      />
                    </div>

                    {/* Botón Agregar */}
                    <Button
                      appearance="primary"
                      icon={<Add16Regular />}
                      onClick={() => {
                        if (scannerProductoId) handleAgregarSeleccionado();
                        else if (scannerQuery) procesarEscaneo(scannerQuery);
                      }}
                      disabled={!scannerQuery.trim() && !scannerProductoId}
                    >
                      Agregar
                    </Button>
                  </div>

                  {/* Feedback del escaneo */}
                  {scannerFeedback && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: tokens.fontSizeBase200,
                        color: scannerFeedback.tipo === 'ok' ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: tokens.fontWeightSemibold,
                      }}
                    >
                      {scannerFeedback.tipo === 'ok' ? <CheckmarkCircle16Filled /> : <Warning16Filled />}
                      <span>{scannerFeedback.texto}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de Materiales y Series Agregadas */}
              {lineas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: tokens.colorNeutralForeground3 }}>
                  No se han agregado materiales a la devolución. Pistolee una serie o seleccione un material arriba.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {lineas.map(linea => (
                    <Card key={linea.idTemp} style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Text weight="bold" size={300}>
                              {linea.codigoProducto} — {linea.nombreProducto}
                            </Text>
                            <Badge
                              appearance="tint"
                              color={linea.condicion === 'Defectuoso' ? 'danger' : 'success'}
                              size="small"
                            >
                              {linea.condicion === 'Defectuoso' ? 'Defectuoso / Averiado' : 'Utilizable'}
                            </Badge>
                            {linea.esSerializado && (
                              <Badge appearance="outline" size="small">
                                Seriado ({linea.series.length} series)
                              </Badge>
                            )}
                          </div>

                          {!linea.esSerializado && (
                            <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2 }}>
                              Cantidad: <strong>{linea.cantidad}</strong> unidades
                            </div>
                          )}

                          {linea.esSerializado && (
                            <div className={styles.seriesTagsContainer}>
                              {linea.series.map(s => (
                                <span key={s} className={styles.serieTag}>
                                  <span>{s}</span>
                                  {!esSoloLectura && (
                                    <span
                                      className={styles.deleteSerieBtn}
                                      onClick={() => handleQuitarSerie(linea.idTemp, s)}
                                      title="Quitar serie"
                                    >
                                      ×
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {!esSoloLectura && (
                          <Button
                            appearance="subtle"
                            icon={<Delete16Regular />}
                            onClick={() => handleEliminarLinea(linea.idTemp)}
                            title="Eliminar este ítem"
                          />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </D365FormContent>

      {/* Diálogo de Operación Exitosa */}
      <Dialog
        open={dialogoExito.open}
        onOpenChange={(_, data) => {
          if (!data.open) {
            setDialogoExito({ open: false, numero: '', totalUnidades: 0 });
            navigate('/servicio-campo/devoluciones-proveedor');
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>¡Devolución a Proveedor Completada!</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM, marginTop: tokens.spacingVerticalM }}>
                <Text>
                  Se ha registrado exitosamente la devolución a proveedor <strong>{dialogoExito.numero}</strong>.
                </Text>
                <div style={{ backgroundColor: tokens.colorNeutralBackground3, padding: tokens.spacingVerticalM, borderRadius: tokens.borderRadiusMedium }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', fontSize: tokens.fontSizeBase200 }}>
                    <span style={{ color: tokens.colorNeutralForeground3 }}>Proveedor:</span>
                    <strong>{proveedor}</strong>
                    <span style={{ color: tokens.colorNeutralForeground3 }}>N° Documento:</span>
                    <strong>{numeroDocumento}</strong>
                    <span style={{ color: tokens.colorNeutralForeground3 }}>Total Unidades:</span>
                    <strong>{dialogoExito.totalUnidades} unidades</strong>
                    <span style={{ color: tokens.colorNeutralForeground3 }}>Estado Equipos:</span>
                    <span style={{ color: tokens.colorPaletteGreenForeground1 }}>Devuelto a Proveedor (Permite reingreso si retorna)</span>
                  </div>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="primary"
                onClick={() => {
                  setDialogoExito({ open: false, numero: '', totalUnidades: 0 });
                  navigate('/servicio-campo/devoluciones-proveedor');
                }}
              >
                Aceptar y Volver al Listado
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Diálogo Confirmar Eliminación de Borrador */}
      <Dialog open={dialogoEliminarBorrador} onOpenChange={(_, data) => setDialogoEliminarBorrador(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Eliminar borrador</DialogTitle>
            <DialogContent>
              ¿Está seguro de que desea eliminar este borrador de devolución a proveedor? Esta acción no se puede deshacer.
            </DialogContent>
            <DialogActions>
              <Button appearance="subtle" onClick={() => setDialogoEliminarBorrador(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                onClick={handleEliminarBorrador}
                disabled={submitting}
                style={{ backgroundColor: tokens.colorPaletteRedBackground3, color: 'white' }}
              >
                {submitting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

