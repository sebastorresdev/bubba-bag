import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Badge,
  Button,
  Spinner,
  tokens,
  Card,
  Input,
} from '@fluentui/react-components';
import {
  Clock20Regular,
  Location20Regular,
  Call20Regular,
  Chat20Regular,
  Wrench20Regular,
  ArrowRight20Regular,
  ArrowClockwise20Regular,
  Search20Regular,
  Person20Regular,
} from '@fluentui/react-icons';
import { useAuthSession } from '../../../../services/authSession';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import type { OrdenTrabajoListadoItemDto } from '../types/ordenTrabajo.types';

export const TecnicoAgendaMobilePage: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthSession();

  const [ordenes, setOrdenes] = useState<OrdenTrabajoListadoItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState<'hoy' | 'todas'>('hoy');
  const [busqueda, setBusqueda] = useState('');

  const cargarCitas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await OrdenTrabajoService.obtenerOrdenes({
        vista: 'mis_asignadas',
      });
      setOrdenes(data);
    } catch (err) {
      console.error('Error al cargar agenda móvil:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarCitas();
  }, [cargarCitas]);

  const hoyStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const ordenesFiltradas = useMemo(() => {
    return ordenes.filter((o) => {
      // Filtro de fecha
      if (filtroFecha === 'hoy') {
        const fechaOrden = o.fechaProgramada ? o.fechaProgramada.slice(0, 10) : '';
        if (fechaOrden && fechaOrden !== hoyStr) return false;
      }
      // Filtro de búsqueda
      if (busqueda.trim()) {
        const term = busqueda.trim().toLowerCase();
        const coincide =
          o.codigoWo.toLowerCase().includes(term) ||
          (o.clienteServicioNombre && o.clienteServicioNombre.toLowerCase().includes(term)) ||
          (o.direccionServicio && o.direccionServicio.toLowerCase().includes(term));
        if (!coincide) return false;
      }
      return true;
    });
  }, [ordenes, filtroFecha, hoyStr, busqueda]);

  const conteos = useMemo(() => {
    const pendientes = ordenes.filter((o) => o.estadoSistema === 'Programado').length;
    const enProgreso = ordenes.filter((o) => o.estadoSistema === 'EnProgreso').length;
    const completadas = ordenes.filter((o) => o.estadoSistema === 'Completado').length;
    return { pendientes, enProgreso, completadas, total: ordenes.length };
  }, [ordenes]);

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'Programado':
        return 'informative';
      case 'EnProgreso':
        return 'warning';
      case 'Completado':
        return 'success';
      case 'Cancelado':
        return 'danger';
      default:
        return 'subtle';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'Programado':
        return 'Cita Programada';
      case 'EnProgreso':
        return 'En Atención';
      case 'Completado':
        return 'Trabajo Culminado';
      case 'Cancelado':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  const formatearTelefono = (tel?: string | null) => {
    if (!tel) return '';
    return tel.replace(/\D/g, '');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: tokens.colorNeutralBackground2,
        fontFamily: 'Segoe UI, -apple-system, sans-serif',
        paddingBottom: '40px',
      }}
    >
      {/* 1. HEADER DYNAMICS 365 MOBILE */}
      <div
        style={{
          backgroundColor: tokens.colorBrandBackground,
          color: tokens.colorNeutralForegroundOnBrand,
          padding: '16px 16px 20px 16px',
          boxShadow: tokens.shadow8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text size={200} style={{ color: tokens.colorNeutralForegroundOnBrand, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Dynamics 365 Field Service
            </Text>
            <Text block weight="bold" size={500} style={{ color: tokens.colorNeutralForegroundOnBrand, marginTop: '2px' }}>
              Hola, {usuario?.nombreCompleto || 'Técnico de Campo'}
            </Text>
          </div>
          <Button
            size="small"
            appearance="transparent"
            style={{ color: tokens.colorNeutralForegroundOnBrand }}
            icon={<ArrowClockwise20Regular />}
            onClick={() => void cargarCitas()}
            title="Actualizar agenda"
          />
        </div>

        {/* Resumen numérico */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            marginTop: '16px',
            backgroundColor: 'rgba(0,0,0,0.18)',
            borderRadius: '8px',
            padding: '10px 8px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 8px' }}>
            <Text weight="bold" size={400} style={{ color: tokens.colorNeutralForegroundOnBrand, textAlign: 'center' }}>
              {conteos.pendientes}
            </Text>
            <Text size={100} style={{ color: tokens.colorNeutralForegroundOnBrand, opacity: 0.85, textAlign: 'center', marginTop: '2px' }}>
              Por Atender
            </Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 12px', borderLeft: '1px solid rgba(255,255,255,0.25)', borderRight: '1px solid rgba(255,255,255,0.25)' }}>
            <Text weight="bold" size={400} style={{ color: '#ffe082', textAlign: 'center' }}>
              {conteos.enProgreso}
            </Text>
            <Text size={100} style={{ color: tokens.colorNeutralForegroundOnBrand, opacity: 0.85, textAlign: 'center', marginTop: '2px' }}>
              En Curso
            </Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 8px' }}>
            <Text weight="bold" size={400} style={{ color: '#a5d6a7', textAlign: 'center' }}>
              {conteos.completadas}
            </Text>
            <Text size={100} style={{ color: tokens.colorNeutralForegroundOnBrand, opacity: 0.85, textAlign: 'center', marginTop: '2px' }}>
              Atendidas
            </Text>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS Y BÚSQUEDA */}
      <div style={{ padding: '12px 16px 4px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="small"
            appearance={filtroFecha === 'hoy' ? 'primary' : 'outline'}
            onClick={() => setFiltroFecha('hoy')}
            style={{ flex: 1, borderRadius: '20px' }}
          >
            📅 Citas de Hoy
          </Button>
          <Button
            size="small"
            appearance={filtroFecha === 'todas' ? 'primary' : 'outline'}
            onClick={() => setFiltroFecha('todas')}
            style={{ flex: 1, borderRadius: '20px' }}
          >
            📋 Todas mis citas
          </Button>
        </div>

        <Input
          contentBefore={<Search20Regular />}
          placeholder="Buscar por cliente, dirección o WO..."
          value={busqueda}
          onChange={(_, d) => setBusqueda(d.value)}
          size="small"
          style={{ width: '100%', borderRadius: '8px' }}
        />
      </div>

      {/* 3. LISTADO DE TARJETAS MÓVILES */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
            <Spinner size="medium" label="Cargando tus citas del día..." />
          </div>
        ) : ordenesFiltradas.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: tokens.colorNeutralBackground1,
              borderRadius: '12px',
              border: `1px dashed ${tokens.colorNeutralStroke2}`,
              marginTop: '12px',
            }}
          >
            <Clock20Regular style={{ fontSize: '36px', color: tokens.colorNeutralForeground4 }} />
            <Text block weight="semibold" size={300} style={{ marginTop: '8px' }}>
              No tienes citas pendientes para este filtro
            </Text>
            <Text block size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
              Revisa si tienes órdenes programadas para otros días pulsando "Todas mis citas".
            </Text>
          </div>
        ) : (
          ordenesFiltradas.map((orden) => {
            const telLimpio = formatearTelefono(orden.clienteServicioTelefono);
            const direccionMaps = encodeURIComponent(
              `${orden.direccionServicio || ''} ${orden.ubigeoTexto || ''}`
            );

            return (
              <Card
                key={orden.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  boxShadow: tokens.shadow4,
                  backgroundColor: tokens.colorNeutralBackground1,
                  border: `1px solid ${orden.estadoSistema === 'EnProgreso' ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke2}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Header de la Cita */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock20Regular style={{ color: tokens.colorBrandForeground1, fontSize: '18px' }} />
                    <Text weight="semibold" size={200} style={{ color: tokens.colorBrandForeground1 }}>
                      {orden.bloqueHorario || 'Horario Flexible'}
                    </Text>
                    {orden.fechaProgramada && (
                      <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
                        ({orden.fechaProgramada.slice(0, 10)})
                      </Text>
                    )}
                  </div>
                  <Badge appearance="tint" color={getBadgeColor(orden.estadoSistema)}>
                    {getEstadoTexto(orden.estadoSistema)}
                  </Badge>
                </div>

                {/* Datos del Cliente y Servicio */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Person20Regular style={{ color: tokens.colorNeutralForeground3, fontSize: '16px' }} />
                    <Text weight="bold" size={400} style={{ lineHeight: '1.3' }}>
                      {orden.clienteServicioNombre || 'Cliente Sin Asignar'}
                    </Text>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: orden.tipoOrdenColor || tokens.colorBrandBackground,
                      }}
                    />
                    <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
                      {orden.codigoWo}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      • {orden.tipoOrdenNombre || 'Servicio General'}
                    </Text>
                  </div>
                </div>

                {/* Dirección con acceso a GPS */}
                {orden.direccionServicio && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      backgroundColor: tokens.colorNeutralBackground3,
                      padding: '8px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    <Location20Regular style={{ color: tokens.colorPaletteRedForeground1, fontSize: '16px', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <Text size={200} style={{ lineHeight: '1.3', color: tokens.colorNeutralForeground1 }}>
                        {orden.direccionServicio}
                      </Text>
                      {orden.clienteServicioReferencia && (
                        <Text block size={100} style={{ color: tokens.colorNeutralForeground3 }}>
                          Ref: {orden.clienteServicioReferencia}
                        </Text>
                      )}
                    </div>
                    <Button
                      size="small"
                      appearance="subtle"
                      style={{ fontSize: '11px', color: tokens.colorBrandForeground1, padding: '0 6px', height: '26px' }}
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${direccionMaps}`, '_blank')}
                    >
                      Mapa 📍
                    </Button>
                  </div>
                )}

                {/* Barra de Contacto Directo */}
                {telLimpio && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <Button
                      size="small"
                      appearance="outline"
                      icon={<Call20Regular />}
                      style={{ flex: 1, borderRadius: '6px', height: '32px' }}
                      onClick={() => window.open(`tel:${telLimpio}`, '_self')}
                    >
                      Llamar ({telLimpio})
                    </Button>
                    <Button
                      size="small"
                      appearance="primary"
                      icon={<Chat20Regular />}
                      style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#ffffff', height: '32px' }}
                      onClick={() => window.open(`https://wa.me/51${telLimpio}?text=Hola,%20me%20comunico%20del%20servicio%20técnico%20para%20su%20atención%20programada.`, '_blank')}
                    >
                      WhatsApp
                    </Button>
                  </div>
                )}

                {/* Botón de Acción Principal para el Pulgar */}
                <Button
                  size="medium"
                  appearance="primary"
                  icon={<Wrench20Regular />}
                  iconPosition="before"
                  style={{
                    backgroundColor:
                      orden.estadoSistema === 'EnProgreso'
                        ? tokens.colorPaletteGreenBackground3
                        : orden.estadoSistema === 'Completado'
                        ? tokens.colorNeutralBackground5
                        : tokens.colorBrandBackground,
                    color: tokens.colorNeutralForegroundOnBrand,
                    borderRadius: '8px',
                    fontWeight: 600,
                    marginTop: '4px',
                    height: '42px',
                  }}
                  onClick={() => navigate(`/servicio-campo/mis-citas/${orden.id}`)}
                >
                  {orden.estadoSistema === 'Programado'
                    ? '▶ Iniciar Visita Técnica'
                    : orden.estadoSistema === 'EnProgreso'
                    ? '⚡ Continuar Atención en Sitio'
                    : '✔ Ver Detalle de Orden'}
                  <ArrowRight20Regular style={{ marginLeft: 'auto' }} />
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
