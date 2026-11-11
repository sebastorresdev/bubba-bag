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
  TaskListSquareLtr20Regular,
  Info20Regular,
  ArrowClockwise20Regular,
  Play20Regular,
} from '@fluentui/react-icons';
import { D365SignatureCanvas } from '../../../../components/common/D365SignatureCanvas';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import type { OrdenTrabajoDetalleDto, OrdenTrabajoVisitaDto } from '../types/ordenTrabajo.types';

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

  // Subir Evidencia con Cámara
  const handleFotoSeleccionada = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !ultimaVisita) return;

    try {
      setSubiendoFoto(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = String(reader.result);
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
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setSubiendoFoto(false);
      dispatchToast(<Toast><ToastTitle>Error al leer archivo: {err?.message || 'Error'}</ToastTitle></Toast>, { intent: 'error' });
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
  const progresoPorcentaje = todasTareas.length > 0 ? Math.round((tareasCompletadas / todasTareas.length) * 100) : 100;

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
            Tareas ({tareasCompletadas}/{todasTareas.length})
          </Tab>
          <Tab value="evidencias" icon={<Camera20Regular />}>
            Fotos ({ultimaVisita?.evidencias?.length ?? 0})
          </Tab>
          <Tab value="firma" icon={<Signature20Regular />}>
            Firma {ultimaVisita?.firmaClienteUrl ? '✔' : ''}
          </Tab>
          <Tab value="materiales" icon={<Box20Regular />}>
            Materiales
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text weight="bold" size={300} style={{ color: tokens.colorBrandForeground1 }}>
                    {t.codigoTrabajo}: {t.productoNombre}
                  </Text>
                  <Badge appearance="tint" color={t.estado === 'Completado' ? 'success' : 'informative'}>
                    {t.estado}
                  </Badge>
                </div>

                {t.tareas && t.tareas.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
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
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '8px' }}>
                    Sin subtareas registradas para este trabajo.
                  </Text>
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
            <Card style={{ padding: '14px', borderRadius: '10px', backgroundColor: tokens.colorNeutralBackground1 }}>
              <Text weight="bold" size={300}>📦 Materiales Previstos</Text>
              <Text block size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                Si no liquida materiales en la app, el Almacenero los descargará al final de la jornada.
              </Text>

              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {orden.materiales && orden.materiales.length > 0 ? (
                  orden.materiales.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${tokens.colorNeutralStroke2}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <Text weight="semibold" size={200} block>{m.nombreProducto}</Text>
                        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                          Código: {m.codigoProducto}
                        </Text>
                      </div>
                      <Badge appearance="tint" color="brand">
                        Cant: {m.cantidad}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    No se especificaron materiales en la configuración del servicio.
                  </Text>
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
    </div>
  );
};
