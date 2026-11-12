import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Text,
  Badge,
  Button,
  Spinner,
  tokens,
  Card,
  Input,
  TabList,
  Tab,
  Checkbox,
  Textarea,
  Toast,
  Toaster,
  ToastTitle,
  useId,
  useToastController,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@fluentui/react-components';
import {
  ArrowLeft20Regular,
  Location20Regular,
  Call20Regular,
  Chat20Regular,
  Camera20Regular,
  CheckmarkCircle20Regular,
  Signature20Regular,
  Box20Regular,
  Box24Regular,
  TaskListSquareLtr20Regular,
  Info20Regular,
  ArrowClockwise20Regular,
  Play20Regular,
  Checkmark20Regular,
  CheckmarkCircle20Filled,
  Add16Regular,
  Subtract16Regular,
  Delete16Regular,
  Search16Regular,
} from '@fluentui/react-icons';
import { D365SignatureCanvas } from '../../../../components/common/D365SignatureCanvas';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import { comprimirImagen } from '../../../../utils/imageCompressor';
import { ProductoService } from '../../../inventario/productos/services/producto.service';
import type { ProductoDto } from '../../../inventario/productos/types/producto.types';
import type { OrdenTrabajoDetalleDto, OrdenTrabajoVisitaDto } from '../types/ordenTrabajo.types';

export interface MaterialItemEditable {
  id?: string;
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  cantidadSugerida: number;
  cantidadUtilizada: number;
  numeroSerie?: string;
  esExtra?: boolean;
}

export const TecnicoAtencionMobilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toasterId = useId('tecnico-toaster');
  const { dispatchToast } = useToastController(toasterId);

  const [orden, setOrden] = useState<OrdenTrabajoDetalleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'tareas' | 'evidencias' | 'firma' | 'materiales' | 'info'>('tareas');

  // Firma
  const [firmaUrl, setFirmaUrl] = useState<string | null>(null);
  const [nombreFirmante, setNombreFirmante] = useState('');
  const [dniFirmante, setDniFirmante] = useState('');

  // Evidencias
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nombreEvidencia, setNombreEvidencia] = useState('Evidencia Fotográfica');
  const [obsEvidencia, setObsEvidencia] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Cierre
  const [dialogCerrarOpen, setDialogCerrarOpen] = useState(false);
  const [obsCierre, setObsCierre] = useState('');

  // Materiales interactivos
  const [materialesEditables, setMaterialesEditables] = useState<MaterialItemEditable[]>([]);
  const [guardandoMateriales, setGuardandoMateriales] = useState(false);
  const [dialogMaterialOpen, setDialogMaterialOpen] = useState(false);
  const [busquedaProd, setBusquedaProd] = useState('');
  const [productosResultados, setProductosResultados] = useState<ProductoDto[]>([]);
  const [buscandoProd, setBuscandoProd] = useState(false);
  const [prodSeleccionado, setProdSeleccionado] = useState<ProductoDto | null>(null);
  const [cantExtra, setCantExtra] = useState(1);
  const [serieExtra, setSerieExtra] = useState('');

  const cargar = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await OrdenTrabajoService.obtenerOrdenPorId(id);
      setOrden(data);

      const ultimaVisita = data.visitas && data.visitas.length > 0 ? data.visitas[data.visitas.length - 1] : null;
      if (ultimaVisita?.firmaClienteUrl) {
        setFirmaUrl(ultimaVisita.firmaClienteUrl);
        setNombreFirmante(ultimaVisita.nombreFirmante || '');
        setDniFirmante(ultimaVisita.dniFirmante || '');
      }

      if (data.materiales && data.materiales.length > 0) {
        setMaterialesEditables((prev) => {
          if (prev.length > 0) return prev;
          return data.materiales.map((m) => ({
            id: m.id,
            productoId: m.productoId,
            codigoProducto: m.codigoProducto,
            nombreProducto: m.nombreProducto,
            cantidadSugerida: Number(m.cantidad || 0),
            cantidadUtilizada: Number(m.cantidad || 0),
            numeroSerie: m.numeroSerie || '',
            esExtra: false,
          }));
        });
      }
    } catch (err: any) {
      console.error(err);
      dispatchToast(
        <Toast><ToastTitle>Error al cargar la orden: {err?.message || 'Error desconocido'}</ToastTitle></Toast>,
        { intent: 'error' }
      );
    } finally {
      setLoading(false);
    }
  }, [id, dispatchToast]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const ultimaVisita: OrdenTrabajoVisitaDto | null = useMemo(() => {
    if (!orden?.visitas || orden.visitas.length === 0) return null;
    return orden.visitas[orden.visitas.length - 1];
  }, [orden]);

  // Iniciar Atención en Campo
  const handleIniciarAtencion = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      await OrdenTrabajoService.cambiarEstadoSistema(id, {
        nuevoEstadoSistema: 'EnProgreso',
      });
      dispatchToast(<Toast><ToastTitle>Atención iniciada en campo.</ToastTitle></Toast>, { intent: 'success' });
      await cargar();
    } catch (err: any) {
      dispatchToast(
        <Toast><ToastTitle>Error al iniciar atención: {err?.message || 'Error'}</ToastTitle></Toast>,
        { intent: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Marcar Tarea
  const handleToggleTarea = async (trabajoId: string, tareaId: string, completadaActualmente: boolean) => {
    if (!id || orden?.estadoSistema !== 'EnProgreso') {
      if (orden?.estadoSistema === 'Programado') {
        dispatchToast(<Toast><ToastTitle>Inicie la atención antes de completar tareas.</ToastTitle></Toast>, { intent: 'warning' });
      }
      return;
    }
    if (completadaActualmente) return; // ya completada

    try {
      setSubmitting(true);
      await OrdenTrabajoService.completarTarea(id, trabajoId, tareaId, {
        observaciones: 'Realizado en sitio por técnico',
      });
      await cargar();
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Error al actualizar tarea: {err?.message || 'Error'}</ToastTitle></Toast>, { intent: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Marcar Trabajo Directo como Completado (cuando no tiene subtareas desglosadas)
  const handleCompletarTrabajoDirecto = async (trabajoId: string) => {
    if (!id || orden?.estadoSistema !== 'EnProgreso') {
      if (orden?.estadoSistema === 'Programado') {
        dispatchToast(<Toast><ToastTitle>Inicie la visita técnica antes de completar labores.</ToastTitle></Toast>, { intent: 'warning' });
      }
      return;
    }
    try {
      setSubmitting(true);
      await OrdenTrabajoService.completarTrabajo(id, trabajoId);
      dispatchToast(<Toast><ToastTitle>Labor técnica completada con éxito.</ToastTitle></Toast>, { intent: 'success' });
      await cargar();
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Error al completar labor: {err?.message || 'Error'}</ToastTitle></Toast>, { intent: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Subir Evidencia con Cámara (Con compresión y redimensionamiento en cliente)
  const handleFotoSeleccionada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !ultimaVisita) return;

    try {
      setSubiendoFoto(true);

      // Comprimir foto de cámara a resolución máxima 1600px y calidad 82%
      // Reduce fotos pesadas de 8MB a ~200KB antes de subir por red móvil
      const dataUrl = await comprimirImagen(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });

      await OrdenTrabajoService.agregarEvidenciaVisita(id, ultimaVisita.id, {
        nombre: nombreEvidencia.trim() || 'Foto de servicio en sitio',
        url: dataUrl,
        observaciones: obsEvidencia.trim() || undefined,
      });

      dispatchToast(<Toast><ToastTitle>Foto de evidencia guardada con éxito.</ToastTitle></Toast>, { intent: 'success' });
      setNombreEvidencia('Evidencia Fotográfica');
      setObsEvidencia('');
      await cargar();
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Error al registrar foto: {err?.message || 'Error'}</ToastTitle></Toast>, { intent: 'error' });
    } finally {
      setSubiendoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Gestión de Materiales del Técnico
  const handleBuscarProductos = async (q: string) => {
    setBusquedaProd(q);
    if (!q.trim() || q.trim().length < 2) {
      setProductosResultados([]);
      return;
    }
    try {
      setBuscandoProd(true);
      const prods = await ProductoService.buscarInventariables(q.trim());
      setProductosResultados(prods);
    } catch {
      setProductosResultados([]);
    } finally {
      setBuscandoProd(false);
    }
  };

  const handleAgregarMaterialExtra = () => {
    if (!prodSeleccionado) return;
    const nuevo: MaterialItemEditable = {
      productoId: prodSeleccionado.id,
      codigoProducto: prodSeleccionado.codigo,
      nombreProducto: prodSeleccionado.nombre,
      cantidadSugerida: 0,
      cantidadUtilizada: Number(cantExtra) || 1,
      numeroSerie: serieExtra.trim() || undefined,
      esExtra: true,
    };
    setMaterialesEditables((prev) => [...prev, nuevo]);
    setDialogMaterialOpen(false);
    setProdSeleccionado(null);
    setBusquedaProd('');
    setCantExtra(1);
    setSerieExtra('');
    dispatchToast(<Toast><ToastTitle>Material "{nuevo.nombreProducto}" agregado a la lista.</ToastTitle></Toast>, { intent: 'success' });
  };

  const handleCambiarCantidad = (index: number, delta: number) => {
    setMaterialesEditables((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const nueva = Math.max(0, m.cantidadUtilizada + delta);
        return { ...m, cantidadUtilizada: nueva };
      })
    );
  };

  const handleQuitarMaterial = (index: number) => {
    setMaterialesEditables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardarMateriales = async () => {
    if (!id) return;
    try {
      setGuardandoMateriales(true);
      const consumos = materialesEditables
        .filter((m) => m.cantidadUtilizada > 0)
        .map((m) => ({
          productoId: m.productoId,
          cantidad: Number(m.cantidadUtilizada),
          numeroSerie: m.numeroSerie?.trim() || undefined,
        }));

      await OrdenTrabajoService.liquidarMateriales(id, {
        consumos,
        observaciones: 'Reporte de materiales utilizados en sitio por técnico',
      });
      dispatchToast(<Toast><ToastTitle>Materiales utilizados registrados con éxito.</ToastTitle></Toast>, { intent: 'success' });
      await cargar();
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Error al guardar materiales: {err?.message || 'Error'}</ToastTitle></Toast>, { intent: 'error' });
    } finally {
      setGuardandoMateriales(false);
    }
  };

  // Guardar Firma
  const handleGuardarFirma = async () => {
    if (!id || !ultimaVisita) return;
    if (!firmaUrl) {
      dispatchToast(<Toast><ToastTitle>Ingrese la firma del cliente en el recuadro antes de guardar.</ToastTitle></Toast>, { intent: 'warning' });
      return;
    }
    try {
      setSubmitting(true);
      await OrdenTrabajoService.registrarFirmaVisita(id, ultimaVisita.id, {
        firmaUrl,
        nombreFirmante: nombreFirmante.trim() || undefined,
        dniFirmante: dniFirmante.trim() || undefined,
        firmadoPor: 'Cliente / Receptor',
      });
      dispatchToast(<Toast><ToastTitle>Firma del cliente registrada correctamente.</ToastTitle></Toast>, { intent: 'success' });
      await cargar();
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Error al guardar firma: {err?.message || 'Error'}</ToastTitle></Toast>, { intent: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar Cierre de Orden por el Técnico
  const handleConfirmarCierre = async () => {
    if (!id) return;
    try {
      setSubmitting(true);
      await OrdenTrabajoService.cambiarEstadoSistema(id, {
        nuevoEstadoSistema: 'Completado',
        observaciones: obsCierre.trim() || 'Servicio técnico realizado y verificado en sitio conforme.',
        completarTrabajosPendientes: true,
      });

      dispatchToast(
        <Toast><ToastTitle>¡Excelente trabajo! Orden completada con éxito.</ToastTitle></Toast>,
        { intent: 'success' }
      );
      setDialogCerrarOpen(false);
      await cargar();
    } catch (err: any) {
      dispatchToast(
        <Toast><ToastTitle>Error al completar orden: {err?.message || 'Error'}</ToastTitle></Toast>,
        { intent: 'error' }
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '12px' }}>
        <Spinner size="large" label="Cargando orden de trabajo..." />
      </div>
    );
  }

  if (!orden) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text weight="bold" size={400}>No se encontró la orden de trabajo.</Text>
        <Button style={{ marginTop: '16px' }} onClick={() => navigate('/servicio-campo/mis-citas')}>
          Volver a mis citas
        </Button>
      </div>
    );
  }

  const telLimpio = orden.clienteServicioTelefono?.replace(/\D/g, '') || '';
  const direccionMaps = encodeURIComponent(`${orden.direccionServicio || ''} ${orden.ubigeoTexto || ''}`);

  const todasTareas = orden.trabajos?.flatMap((t) => t.tareas || []) || [];
  const tareasCompletadas = todasTareas.filter((tt) => tt.estadoTarea === 'Completa' || tt.estadoTarea === 'Completado').length;
  const todosTrabajos = orden.trabajos || [];
  const trabajosCompletados = todosTrabajos.filter((t) => t.estado === 'Completado').length;

  const progresoPorcentaje = todasTareas.length > 0
    ? Math.round((tareasCompletadas / todasTareas.length) * 100)
    : todosTrabajos.length > 0
      ? Math.round((trabajosCompletados / todosTrabajos.length) * 100)
      : (orden.estadoSistema === 'Completado' ? 100 : 0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: tokens.colorNeutralBackground2,
        fontFamily: 'Segoe UI, -apple-system, sans-serif',
        paddingBottom: '80px', // espacio para la barra de acción inferior fija
      }}
    >
      <Toaster toasterId={toasterId} position="top" />

      {/* 1. TOP BAR MÓVIL DYNAMICS 365 */}
      <div
        style={{
          backgroundColor: tokens.colorBrandBackground,
          color: tokens.colorNeutralForegroundOnBrand,
          padding: '12px 16px',
          boxShadow: tokens.shadow8,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Button
          appearance="transparent"
          icon={<ArrowLeft20Regular />}
          style={{ color: tokens.colorNeutralForegroundOnBrand, minWidth: '36px', padding: 0 }}
          onClick={() => navigate('/servicio-campo/mis-citas')}
          aria-label="Volver"
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Text block weight="bold" size={300} style={{ color: tokens.colorNeutralForegroundOnBrand, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {orden.codigoWo} — {orden.clienteServicioNombre}
          </Text>
          <Text size={100} style={{ color: tokens.colorNeutralForegroundOnBrand, opacity: 0.85 }}>
            {orden.tipoOrdenNombre} • Cita {ultimaVisita?.codigoVisita || 'V1'}
          </Text>
        </div>
        <Button
          size="small"
          appearance="transparent"
          icon={<ArrowClockwise20Regular />}
          style={{ color: tokens.colorNeutralForegroundOnBrand, minWidth: '32px' }}
          onClick={() => void cargar()}
        />
      </div>

      {/* 2. CARD RESUMEN DEL CLIENTE CON ACCESOS DIRECTOS */}
      <div style={{ padding: '12px 16px 6px 16px' }}>
        <Card style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge
              appearance="filled"
              color={
                orden.estadoSistema === 'Completado'
                  ? 'success'
                  : orden.estadoSistema === 'EnProgreso'
                  ? 'warning'
                  : 'informative'
              }
            >
              {orden.estadoSistema === 'EnProgreso'
                ? '⚡ En Atención Técnica'
                : orden.estadoSistema === 'Completado'
                ? '✔ Trabajo Culminado'
                : '📅 Cita Programada'}
            </Badge>
            <Text weight="semibold" size={200} style={{ color: tokens.colorBrandForeground1 }}>
              ⏰ {orden.bloqueHorario || 'Horario Flexible'}
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <Location20Regular style={{ color: tokens.colorPaletteRedForeground1, fontSize: '18px', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Text weight="semibold" size={200} style={{ lineHeight: '1.3' }}>
                {orden.direccionServicio || 'Dirección no especificada'}
              </Text>
              {orden.referenciaUbicacion && (
                <Text block size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                  Ref: {orden.referenciaUbicacion}
                </Text>
              )}
            </div>
            <Button
              size="small"
              appearance="outline"
              style={{ fontSize: '11px', height: '28px' }}
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${direccionMaps}`, '_blank')}
            >
              GPS 📍
            </Button>
          </div>

          {telLimpio && (
            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
              <Button
                size="small"
                appearance="outline"
                icon={<Call20Regular />}
                style={{ flex: 1, height: '32px' }}
                onClick={() => window.open(`tel:${telLimpio}`, '_self')}
              >
                Llamar
              </Button>
              <Button
                size="small"
                appearance="primary"
                icon={<Chat20Regular />}
                style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#ffffff', height: '32px' }}
                onClick={() => window.open(`https://wa.me/51${telLimpio}`, '_blank')}
              >
                WhatsApp
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* 3. TABS MÓVILES */}
      <div style={{ padding: '0 16px', marginTop: '6px' }}>
        <TabList
          selectedValue={tab}
          onTabSelect={(_, d) => setTab(d.value as any)}
          style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}
        >
          <Tab value="tareas" icon={<TaskListSquareLtr20Regular />}>
            Tareas ({todasTareas.length > 0 ? `${tareasCompletadas}/${todasTareas.length}` : `${trabajosCompletados}/${todosTrabajos.length}`})
          </Tab>
          <Tab value="evidencias" icon={<Camera20Regular />}>
            Fotos ({ultimaVisita?.evidencias?.length ?? 0})
          </Tab>
          <Tab value="firma" icon={<Signature20Regular />}>
            Firma {ultimaVisita?.firmaClienteUrl ? '✔' : ''}
          </Tab>
          <Tab value="materiales" icon={<Box20Regular />}>
            Materiales ({orden.materiales?.length ?? 0})
          </Tab>
          <Tab value="info" icon={<Info20Regular />}>
            Detalle
          </Tab>
        </TabList>
      </div>

      {/* 4. CONTENIDO DE PESTAÑAS */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* PESTAÑA: TAREAS */}
        {tab === 'tareas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Barra de Progreso */}
            <div style={{ backgroundColor: tokens.colorNeutralBackground1, padding: '10px 14px', borderRadius: '8px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <Text size={200} weight="semibold">Progreso de Labores</Text>
                <Text size={200} weight="bold" style={{ color: tokens.colorBrandForeground1 }}>{progresoPorcentaje}%</Text>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: tokens.colorNeutralBackground4, borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progresoPorcentaje}%`, height: '100%', backgroundColor: tokens.colorPaletteGreenBackground3, transition: 'width 0.3s ease' }} />
              </div>
            </div>

            {orden.trabajos?.map((t) => (
              <Card key={t.id} style={{ padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <Text size={200} weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
                        {t.codigoTrabajo}
                      </Text>
                      {t.puntos !== undefined && (
                        <Badge size="small" appearance="tint" color="brand">
                          {t.puntos} {t.puntos === 1 ? 'pto' : 'pts'}
                        </Badge>
                      )}
                    </div>
                    <Text weight="bold" size={300} style={{ color: tokens.colorNeutralForeground1, display: 'block', wordBreak: 'break-word', lineHeight: '20px' }}>
                      {t.productoNombre}
                    </Text>
                  </div>
                  <D365StatusBadge status={t.estado} size="medium" style={{ flexShrink: 0 }} />
                </div>

                {t.tareas && t.tareas.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    {t.tareas.map((tarea) => {
                      const done = tarea.estadoTarea === 'Completa' || tarea.estadoTarea === 'Completado';
                      return (
                        <div
                          key={tarea.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor: done ? tokens.colorPaletteGreenBackground1 : tokens.colorNeutralBackground3,
                            border: `1px solid ${done ? tokens.colorPaletteGreenBorder1 : tokens.colorNeutralStroke2}`,
                          }}
                        >
                          <Checkbox
                            checked={done}
                            onChange={() => handleToggleTarea(t.id, tarea.id, done)}
                            disabled={submitting || orden.estadoSistema !== 'EnProgreso'}
                          />
                          <div style={{ flex: 1 }}>
                            <Text
                              weight="medium"
                              size={200}
                              style={{ textDecoration: done ? 'line-through' : 'none', color: done ? tokens.colorPaletteGreenForeground1 : tokens.colorNeutralForeground1 }}
                            >
                              {tarea.nombreTarea}
                            </Text>
                            {tarea.esObligatoria && (
                              <Badge size="small" appearance="tint" color="danger" style={{ marginLeft: '6px' }}>
                                Obligatoria
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${tokens.colorNeutralStroke2}` }}>
                    {t.estado === 'Completado' ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px', backgroundColor: tokens.colorPaletteGreenBackground1, border: `1px solid ${tokens.colorPaletteGreenBorder1}` }}>
                        <CheckmarkCircle20Filled style={{ color: tokens.colorPaletteGreenForeground1 }} />
                        <Text size={200} weight="medium" style={{ color: tokens.colorPaletteGreenForeground1 }}>
                          Labor técnica realizada en sitio
                        </Text>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                          Sin subtareas registradas para este trabajo.
                        </Text>
                        {orden.estadoSistema === 'EnProgreso' && (
                          <Button
                            appearance="secondary"
                            icon={<Checkmark20Regular />}
                            size="small"
                            disabled={submitting}
                            onClick={() => void handleCompletarTrabajoDirecto(t.id)}
                            style={{ alignSelf: 'flex-start' }}
                          >
                            Marcar labor como realizada
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* PESTAÑA: EVIDENCIAS FOTOGRÁFICAS */}
        {tab === 'evidencias' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Card style={{ padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
              <Text weight="bold" size={300}>📸 Registrar Foto en Sitio</Text>
              <Text block size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                Capture fotos de la instalación, medidor, equipo instalado o acta física.
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <Input
                  size="small"
                  placeholder="Título (ej: Foto del decodificador / fachada)"
                  value={nombreEvidencia}
                  onChange={(_, d) => setNombreEvidencia(d.value)}
                />

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFotoSeleccionada}
                />

                <Button
                  size="medium"
                  appearance="primary"
                  icon={<Camera20Regular />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendoFoto || !ultimaVisita}
                  style={{ height: '42px' }}
                >
                  {subiendoFoto ? 'Guardando foto...' : 'Abrir Cámara y Tomar Foto'}
                </Button>
              </div>
            </Card>

            {/* Galería de Fotos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text weight="bold" size={300}>Fotos Registradas ({ultimaVisita?.evidencias?.length ?? 0})</Text>

              {(!ultimaVisita?.evidencias || ultimaVisita.evidencias.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '30px', backgroundColor: tokens.colorNeutralBackground1, borderRadius: '8px' }}>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Aún no se han capturado fotos para esta visita.
                  </Text>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {ultimaVisita.evidencias.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        backgroundColor: tokens.colorNeutralBackground1,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        boxShadow: tokens.shadow2,
                      }}
                    >
                      <img
                        src={ev.url}
                        alt={ev.nombre}
                        style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                        onClick={() => window.open(ev.url, '_blank')}
                      />
                      <div style={{ padding: '8px' }}>
                        <Text weight="semibold" size={100} block style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ev.nombre}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: FIRMA DEL CLIENTE */}
        {tab === 'firma' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Card style={{ padding: '16px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
              <Text weight="bold" size={300}>✍ Firma Digital de Conformidad</Text>
              <Text block size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                Pida al cliente o persona receptora que firme con el dedo en el recuadro.
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                <Input
                  size="small"
                  placeholder="Nombre y Apellidos del receptor *"
                  value={nombreFirmante}
                  onChange={(_, d) => setNombreFirmante(d.value)}
                />
                <Input
                  size="small"
                  placeholder="N° de DNI / Documento del receptor *"
                  value={dniFirmante}
                  onChange={(_, d) => setDniFirmante(d.value)}
                />

                <div style={{ marginTop: '8px' }}>
                  <D365SignatureCanvas
                    initialSignature={firmaUrl}
                    onSignatureChange={(url) => setFirmaUrl(url)}
                    height={160}
                    disabled={orden.estadoSistema === 'Completado'}
                  />
                </div>

                {orden.estadoSistema !== 'Completado' && (
                  <Button
                    size="medium"
                    appearance="primary"
                    style={{ backgroundColor: tokens.colorPaletteGreenBackground3, color: tokens.colorNeutralForegroundOnBrand, height: '40px', marginTop: '8px' }}
                    onClick={handleGuardarFirma}
                    disabled={submitting || !firmaUrl}
                  >
                    Guardar Firma del Cliente
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* PESTAÑA: MATERIALES */}
        {tab === 'materiales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Card style={{ padding: '16px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box24Regular style={{ color: tokens.colorBrandForeground1 }} />
                  <Text weight="bold" size={300}>Materiales de la Atención</Text>
                </div>
                {orden.estadoSistema !== 'Completado' && (
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Add16Regular />}
                    onClick={() => setDialogMaterialOpen(true)}
                  >
                    + Agregar
                  </Button>
                )}
              </div>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Lo previsto es una sugerencia. Ingresa la cantidad real consumida de tu stock móvil.
              </Text>

              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {materialesEditables.length > 0 ? (
                  materialesEditables.map((m, idx) => (
                    <div
                      key={m.productoId + idx}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: tokens.colorNeutralBackground2,
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text weight="semibold" size={200} block style={{ color: tokens.colorNeutralForeground1, wordBreak: 'break-word' }}>
                            {m.nombreProducto}
                          </Text>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                            <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                              Cód: {m.codigoProducto}
                            </Text>
                            {m.cantidadSugerida > 0 ? (
                              <Badge size="small" appearance="tint" color="informative">
                                Sugerido: {m.cantidadSugerida}
                              </Badge>
                            ) : (
                              <Badge size="small" appearance="tint" color="warning">
                                Extra en sitio
                              </Badge>
                            )}
                          </div>
                        </div>
                        {m.esExtra && orden.estadoSistema !== 'Completado' && (
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Delete16Regular />}
                            style={{ color: tokens.colorStatusDangerForeground1 }}
                            onClick={() => handleQuitarMaterial(idx)}
                            title="Quitar material"
                          />
                        )}
                      </div>

                      {/* Stepper para cantidad utilizada */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <Text size={200} weight="medium" style={{ color: tokens.colorNeutralForeground2 }}>
                          Gastado / Utilizado:
                        </Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Button
                            size="small"
                            appearance="outline"
                            icon={<Subtract16Regular />}
                            disabled={orden.estadoSistema === 'Completado' || m.cantidadUtilizada <= 0}
                            onClick={() => handleCambiarCantidad(idx, -1)}
                            style={{ minWidth: '32px', height: '32px', padding: 0 }}
                          />
                          <Input
                            size="small"
                            type="number"
                            value={String(m.cantidadUtilizada)}
                            disabled={orden.estadoSistema === 'Completado'}
                            onChange={(_, d) => {
                              const val = Math.max(0, Number(d.value) || 0);
                              setMaterialesEditables((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, cantidadUtilizada: val } : item))
                              );
                            }}
                            style={{ width: '64px', textAlign: 'center' }}
                          />
                          <Button
                            size="small"
                            appearance="outline"
                            icon={<Add16Regular />}
                            disabled={orden.estadoSistema === 'Completado'}
                            onClick={() => handleCambiarCantidad(idx, 1)}
                            style={{ minWidth: '32px', height: '32px', padding: 0 }}
                          />
                        </div>
                      </div>

                      {/* Si tiene serie */}
                      {m.numeroSerie !== undefined && (
                        <Input
                          size="small"
                          placeholder="N° de Serie instalado (ej: SN123456)"
                          value={m.numeroSerie}
                          disabled={orden.estadoSistema === 'Completado'}
                          onChange={(_, d) => {
                            setMaterialesEditables((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, numeroSerie: d.value } : item))
                            );
                          }}
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '24px 16px',
                      textAlign: 'center',
                      backgroundColor: tokens.colorNeutralBackground2,
                      borderRadius: '8px',
                      border: `1px dashed ${tokens.colorNeutralStroke2}`,
                    }}
                  >
                    <Text weight="semibold" size={200} block style={{ color: tokens.colorNeutralForeground2, marginBottom: '4px' }}>
                      Sin materiales previstos en catálogo
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '12px' }}>
                      Si utilizaste insumos de tu stock móvil (conectores, cable, splitters, etc.), agrégalos con el botón inferior.
                    </Text>
                    {orden.estadoSistema !== 'Completado' && (
                      <Button
                        appearance="primary"
                        icon={<Add16Regular />}
                        size="small"
                        onClick={() => setDialogMaterialOpen(true)}
                      >
                        Agregar Material Utilizado
                      </Button>
                    )}
                  </div>
                )}

                {materialesEditables.length > 0 && orden.estadoSistema !== 'Completado' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <Button
                      size="medium"
                      appearance="primary"
                      style={{ flex: 1, backgroundColor: tokens.colorPaletteGreenBackground3, color: tokens.colorNeutralForegroundOnBrand }}
                      disabled={guardandoMateriales}
                      onClick={handleGuardarMateriales}
                    >
                      {guardandoMateriales ? 'Guardando...' : 'Guardar Materiales Utilizados'}
                    </Button>
                    <Button
                      size="medium"
                      appearance="outline"
                      icon={<Add16Regular />}
                      onClick={() => setDialogMaterialOpen(true)}
                    >
                      + Extra
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* PESTAÑA: DETALLE / INFORMACIÓN */}
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Card style={{ padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground1 }}>
              <Text weight="bold" size={300}>Información Comercial y Operativa</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '13px' }}>
                <div><strong>N° Orden Siebel:</strong> {orden.numeroOrden || '—'}</div>
                <div><strong>Código Contrato:</strong> {orden.codigoContrato || '—'}</div>
                <div><strong>Sede / Base:</strong> {orden.unidadOrganizativaNombre || '—'}</div>
                <div><strong>Zona Operativa:</strong> {orden.zonaOperativaNombre || '—'}</div>
                <div><strong>Indicaciones:</strong> {orden.observacionesGenerales || 'Ninguna indicación adicional.'}</div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* 5. BOTTOM BAR FIJA DE ACCIÓN PARA EL PULGAR (MOBILE DYNAMICS 365) */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: tokens.colorNeutralBackground1,
          borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
          padding: '10px 16px',
          boxShadow: tokens.shadow8,
          display: 'flex',
          gap: '12px',
          zIndex: 99,
        }}
      >
        {orden.estadoSistema === 'Programado' && (
          <Button
            size="large"
            appearance="primary"
            icon={<Play20Regular />}
            style={{ flex: 1, height: '48px', fontWeight: 'bold', fontSize: '15px' }}
            onClick={handleIniciarAtencion}
            disabled={submitting}
          >
            ▶ Iniciar Atención en Sitio
          </Button>
        )}

        {orden.estadoSistema === 'EnProgreso' && (
          <Button
            size="large"
            appearance="primary"
            icon={<CheckmarkCircle20Regular />}
            style={{ flex: 1, height: '48px', backgroundColor: tokens.colorPaletteGreenBackground3, color: tokens.colorNeutralForegroundOnBrand, fontWeight: 'bold', fontSize: '15px' }}
            onClick={() => setDialogCerrarOpen(true)}
            disabled={submitting}
          >
            ✔ Culminar y Cerrar Orden
          </Button>
        )}

        {orden.estadoSistema === 'Completado' && (
          <Button
            size="large"
            appearance="outline"
            style={{ flex: 1, height: '48px', fontWeight: 'bold', fontSize: '14px', color: tokens.colorPaletteGreenForeground1, borderColor: tokens.colorPaletteGreenBorder1 }}
            onClick={() => navigate('/servicio-campo/mis-citas')}
          >
            ✔ Orden Culminada — Volver a Agenda
          </Button>
        )}
      </div>

      {/* DIÁLOGO DE CIERRE DE ORDEN */}
      <Dialog open={dialogCerrarOpen} onOpenChange={(_, { open }) => setDialogCerrarOpen(open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Culminar Atención en Sitio</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <Text size={300}>
                ¿Confirma que ha culminado todos los trabajos en el domicilio del cliente?
              </Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                La orden quedará en estado <strong>Atendida / Completa</strong> y Almacén podrá descargar los materiales utilizados.
              </Text>

              <Textarea
                rows={3}
                placeholder="Observaciones finales del servicio (ej: Instalación concluida, señal probada en 98%)..."
                value={obsCierre}
                onChange={(_, d) => setObsCierre(d.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogCerrarOpen(false)} disabled={submitting}>
                Volver
              </Button>
              <Button appearance="primary" onClick={handleConfirmarCierre} disabled={submitting}>
                {submitting ? 'Cerrando...' : 'Confirmar Cierre'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* DIÁLOGO: AGREGAR MATERIAL EXTRA DE CUSTODIA */}
      <Dialog open={dialogMaterialOpen} onOpenChange={(_, { open }) => setDialogMaterialOpen(open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Añadir Material o Repuesto Utilizado</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Busca el producto o insumo utilizado de tu stock móvil (camioneta/custodia).
              </Text>

              <Input
                contentBefore={<Search16Regular />}
                placeholder="Buscar por nombre o código (ej: cable, conector, splitter)..."
                value={busquedaProd}
                onChange={(_, d) => void handleBuscarProductos(d.value)}
              />

              {buscandoProd && <Spinner size="tiny" label="Buscando insumos..." />}

              {productosResultados.length > 0 && !prodSeleccionado && (
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: '6px' }}>
                  {productosResultados.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setProdSeleccionado(p);
                        setBusquedaProd(p.nombre);
                        setProductosResultados([]);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Text weight="semibold" size={200} block>{p.nombre}</Text>
                        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Cód: {p.codigo}</Text>
                      </div>
                      <Badge size="small" appearance="tint" color="brand">Elegir</Badge>
                    </div>
                  ))}
                </div>
              )}

              {prodSeleccionado && (
                <div style={{ padding: '10px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '6px' }}>
                  <Text weight="bold" size={200} block>{prodSeleccionado.nombre}</Text>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>Código: {prodSeleccionado.codigo}</Text>

                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text size={200} weight="medium">Cantidad gastada:</Text>
                    <Input
                      type="number"
                      size="small"
                      value={String(cantExtra)}
                      onChange={(_, d) => setCantExtra(Math.max(1, Number(d.value) || 1))}
                      style={{ width: '80px' }}
                    />
                  </div>

                  {prodSeleccionado.esSerializado && (
                    <div style={{ marginTop: '8px' }}>
                      <Input
                        size="small"
                        placeholder="N° de Serie (obligatorio para seriados)"
                        value={serieExtra}
                        onChange={(_, d) => setSerieExtra(d.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => { setDialogMaterialOpen(false); setProdSeleccionado(null); }}>
                Cancelar
              </Button>
              <Button
                appearance="primary"
                disabled={!prodSeleccionado}
                onClick={handleAgregarMaterialExtra}
              >
                Agregar a la lista
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
