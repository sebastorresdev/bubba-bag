import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Spinner,
  Tab,
  TabList,
  Text,
  tokens,
  createTableColumn,
  type TableColumnDefinition,
} from '@fluentui/react-components';
import {
  Clock20Regular,
  Clock24Regular,
  DoorArrowLeft24Regular,
  ArrowRight24Regular,
  Food24Regular,
  CheckmarkCircle24Regular,
  Location20Regular,
  ArrowClockwise16Regular,
  ArrowDownload16Regular,
  CalendarLtr20Regular,
  PeopleCommunity20Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { useD365ListStyles } from '../../../../styles/d365ListStyles';
import {
  D365EntityTable,
  D365TableToolbarTools,
  type D365EntityTableRef,
  type D365FilterField,
} from '../../../../components/common/D365EntityTable';
import { D365StatusBadge } from '../../../../components/common/D365StatusBadge';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { RecursosHumanosService } from '../../services/recursosHumanos.service';
import type {
  MiEstadoAsistenciaHoyDto,
  AsistenciaDiariaDto,
} from '../../types/recursosHumanos.types';
import { exportToExcel, type ExportColumn } from '../../../../utils/exportUtils';
import { useAuthSession } from '../../../../services/authSession';

const filterFieldsConsolidado: D365FilterField[] = [
  { id: 'empleadoNombre', label: 'Colaborador', type: 'string' },
  { id: 'documento', label: 'N° Documento', type: 'string' },
  { id: 'turnoNombre', label: 'Turno', type: 'string' },
  { id: 'estadoNombre', label: 'Estado', type: 'string' },
];

export const MarcacionAsistenciaPage: React.FC = () => {
  const listStyles = useD365ListStyles();
  const { permisos } = useAuthSession();
  const canSupervise = permisos?.includes('rrhh.colaboradores.ver') ?? true;

  const [activeTab, setActiveTab] = useState<'marcar' | 'reporte'>('marcar');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [marcando, setMarcando] = useState<boolean>(false);
  const [miEstado, setMiEstado] = useState<MiEstadoAsistenciaHoyDto | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null);

  // Estados para reporte consolidado
  const tableRef = useRef<D365EntityTableRef>(null);
  const [consolidado, setConsolidado] = useState<AsistenciaDiariaDto[]>([]);
  const [loadingReporte, setLoadingReporte] = useState<boolean>(false);
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState<string>(
    new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [fechaFinFiltro, setFechaFinFiltro] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [searchTermReporte, setSearchTermReporte] = useState<string>('');

  // Reloj digital en vivo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Capturar geolocalización
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoordenadas({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocalización no activada:', err.message),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Cargar estado de hoy
  const cargarMiEstado = useCallback(async () => {
    try {
      setLoading(true);
      setMensajeError(null);
      const data = await RecursosHumanosService.obtenerMiAsistenciaHoy();
      setMiEstado(data);
    } catch (err: any) {
      setMensajeError(err.message || 'Error al obtener la información de asistencia');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarMiEstado();
  }, [cargarMiEstado]);

  // Cargar reporte consolidado
  const cargarReporte = useCallback(async () => {
    try {
      setLoadingReporte(true);
      const data = await RecursosHumanosService.obtenerConsolidadoAsistencias({
        fechaInicio: fechaInicioFiltro,
        fechaFin: fechaFinFiltro,
      });
      setConsolidado(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingReporte(false);
    }
  }, [fechaInicioFiltro, fechaFinFiltro]);

  useEffect(() => {
    if (activeTab === 'reporte') {
      cargarReporte();
    }
  }, [activeTab, cargarReporte]);

  // Manejar Marcación
  const handleMarcar = async (tipoMarca: number, label: string) => {
    try {
      setMarcando(true);
      setMensajeError(null);
      setMensajeExito(null);

      await RecursosHumanosService.marcarAsistencia({
        empleadoId: miEstado?.empleadoId,
        tipoMarca,
        origen: 2, // Web
        latitud: coordenadas?.lat,
        longitud: coordenadas?.lng,
      });

      setMensajeExito(`¡${label} registrada exitosamente!`);
      await cargarMiEstado();
    } catch (err: any) {
      setMensajeError(err.message || 'Error al procesar la marcación de asistencia');
    } finally {
      setMarcando(false);
    }
  };

  // Filtrado de reporte
  const itemsReporteFiltrados = useMemo(() => {
    if (!searchTermReporte.trim()) return consolidado;
    const q = searchTermReporte.toLowerCase();
    return consolidado.filter(
      (a) =>
        a.empleadoNombre.toLowerCase().includes(q) ||
        a.documento.toLowerCase().includes(q) ||
        (a.turnoNombre && a.turnoNombre.toLowerCase().includes(q))
    );
  }, [consolidado, searchTermReporte]);

  const handleExportarExcel = () => {
    const columns: ExportColumn<AsistenciaDiariaDto>[] = [
      { header: 'Fecha', accessor: (a) => a.fechaOperativa },
      { header: 'Colaborador', accessor: (a) => a.empleadoNombre },
      { header: 'Documento', accessor: (a) => a.documento },
      { header: 'Turno', accessor: (a) => a.turnoNombre || 'Sin turno' },
      { header: 'Hora Entrada Prog.', accessor: (a) => a.horaEntradaProgramada || '--' },
      { header: 'Hora Entrada Real', accessor: (a) => a.horaEntradaReal || '--' },
      { header: 'Hora Salida Real', accessor: (a) => a.horaSalidaReal || '--' },
      { header: 'Tardanza (Min)', accessor: (a) => a.minutosTardanza },
      { header: 'Horas Trabajadas', accessor: (a) => a.horasTrabajadas },
      { header: 'Estado', accessor: (a) => a.estadoNombre },
    ];
    exportToExcel(itemsReporteFiltrados, columns, `Consolidado_Asistencias_${fechaInicioFiltro}_al_${fechaFinFiltro}`);
  };

  const columnsReporte: TableColumnDefinition<AsistenciaDiariaDto>[] = [
    createTableColumn<AsistenciaDiariaDto>({
      columnId: 'fechaOperativa',
      compare: (a, b) => a.fechaOperativa.localeCompare(b.fechaOperativa),
      renderHeaderCell: () => 'Fecha',
      renderCell: (item) => <Text weight="semibold">{item.fechaOperativa}</Text>,
    }),
    createTableColumn<AsistenciaDiariaDto>({
      columnId: 'empleadoNombre',
      compare: (a, b) => a.empleadoNombre.localeCompare(b.empleadoNombre),
      renderHeaderCell: () => 'Colaborador',
      renderCell: (item) => (
        <div>
          <Text weight="semibold" style={{ display: 'block' }}>{item.empleadoNombre}</Text>
          <Text size={200} style={{ color: '#605e5c' }}>DNI: {item.documento}</Text>
        </div>
      ),
    }),
    createTableColumn<AsistenciaDiariaDto>({
      columnId: 'turnoNombre',
      renderHeaderCell: () => 'Turno / Horario',
      renderCell: (item) => <Text size={200}>{item.turnoNombre || 'Sin turno'}</Text>,
    }),
    createTableColumn<AsistenciaDiariaDto>({
      columnId: 'horaEntradaReal',
      renderHeaderCell: () => 'Hora Entrada',
      renderCell: (item) => (
        <Text weight="medium" style={{ color: item.horaEntradaReal ? '#107c41' : '#605e5c' }}>
          {item.horaEntradaReal || '--:--'}
        </Text>
      ),
    }),
    createTableColumn<AsistenciaDiariaDto>({
      columnId: 'horaSalidaReal',
      renderHeaderCell: () => 'Hora Salida',
      renderCell: (item) => (
        <Text weight="medium">
          {item.horaSalidaReal || '--:--'}
        </Text>
      ),
    }),
    createTableColumn<AsistenciaDiariaDto>({
      columnId: 'minutosTardanza',
      compare: (a, b) => a.minutosTardanza - b.minutosTardanza,
      renderHeaderCell: () => 'Puntualidad / Tardanza',
      renderCell: (item) => (
        item.minutosTardanza > 0 ? (
          <Badge appearance="tint" color="danger">
            Tardanza: {item.minutosTardanza} min
          </Badge>
        ) : item.horaEntradaReal ? (
          <Badge appearance="tint" color="success">
            Puntual
          </Badge>
        ) : (
          <Text size={200} style={{ color: '#605e5c' }}>Sin marca</Text>
        )
      ),
    }),
    createTableColumn<AsistenciaDiariaDto>({
      columnId: 'horasTrabajadas',
      compare: (a, b) => a.horasTrabajadas - b.horasTrabajadas,
      renderHeaderCell: () => 'Horas Netas',
      renderCell: (item) => <Text weight="semibold">{item.horasTrabajadas} hrs</Text>,
    }),
    createTableColumn<AsistenciaDiariaDto>({
      columnId: 'estado',
      renderHeaderCell: () => 'Estado',
      renderCell: (item) => (
        <D365StatusBadge
          status={
            item.estadoNombre === 'Presente'
              ? 'Activo'
              : item.estadoNombre === 'Tardanza'
              ? 'Pendiente'
              : 'Inactivo'
          }
        />
      ),
    }),
  ];

  const horaString = currentTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fechaString = currentTime.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className={listStyles.root}>
      {/* 1. Command Bar */}
      <D365CommandBar ariaLabel="Comandos de Asistencia">
        <D365CommandButton
          icon={<ArrowClockwise16Regular />}
          onClick={() => (activeTab === 'marcar' ? cargarMiEstado() : cargarReporte())}
        >
          Actualizar
        </D365CommandButton>
        {activeTab === 'reporte' && (
          <>
            <D365CommandDivider />
            <D365CommandButton icon={<ArrowDownload16Regular />} onClick={handleExportarExcel}>
              Exportar a Excel
            </D365CommandButton>
          </>
        )}
      </D365CommandBar>

      {/* 2. Selector de Pestañas */}
      <div style={{ padding: '0 24px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground1 }}>
        <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value as any)}>
          <Tab value="marcar" icon={<Clock20Regular />}>
            Mi Marcación de Asistencia
          </Tab>
          {canSupervise && (
            <Tab value="reporte" icon={<PeopleCommunity20Regular />}>
              Consolidado y Supervisión de Asistencias
            </Tab>
          )}
        </TabList>
      </div>

      {mensajeExito && (
        <div style={{ padding: '8px 24px' }}>
          <D365MessageBar intent="success" onDismiss={() => setMensajeExito(null)}>
            {mensajeExito}
          </D365MessageBar>
        </div>
      )}
      {mensajeError && (
        <div style={{ padding: '8px 24px' }}>
          <D365MessageBar intent="error" onDismiss={() => setMensajeError(null)}>
            {mensajeError}
          </D365MessageBar>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 1: MI MARCACION */}
      {activeTab === 'marcar' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
              <Spinner size="large" label="Cargando estado de asistencia..." />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Tarjeta Reloj Digital & Fecha */}
              <Card style={{ padding: '24px', textAlign: 'center', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                <Text size={300} style={{ color: tokens.colorNeutralForeground3, textTransform: 'capitalize' }}>
                  {fechaString}
                </Text>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: tokens.colorBrandForeground1, letterSpacing: '2px', margin: '8px 0' }}>
                  {horaString}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, color: tokens.colorNeutralForeground3 }}>
                  <Location20Regular />
                  <Text size={200}>
                    {coordenadas ? `Ubicación GPS sincronizada (${coordenadas.lat.toFixed(4)}, ${coordenadas.lng.toFixed(4)})` : 'Detectando ubicación GPS...'}
                  </Text>
                </div>
              </Card>

              {/* Tarjeta de Información del Colaborador & Turno */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <Card style={{ padding: '16px', display: 'flex', gap: 14, alignItems: 'center', backgroundColor: tokens.colorNeutralBackground1 }}>
                  <Avatar name={miEstado?.empleadoNombre || 'Colaborador'} size={48} />
                  <div>
                    <Text weight="semibold" size={300} style={{ display: 'block' }}>
                      {miEstado?.empleadoNombre}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                      {miEstado?.cargo || 'Puesto no asignado'} • {miEstado?.departamento || 'General'}
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      DNI: {miEstado?.documento}
                    </Text>
                  </div>
                </Card>

                <Card style={{ padding: '16px', backgroundColor: tokens.colorNeutralBackground1 }}>
                  <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground3, textTransform: 'uppercase' }}>
                    Horario de Trabajo Asignado
                  </Text>
                  {miEstado?.turno ? (
                    <div style={{ marginTop: 6 }}>
                      <Text weight="bold" size={300} style={{ color: tokens.colorBrandForeground1, display: 'block' }}>
                        {miEstado.turno.nombre}
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                        Franja: <strong>{miEstado.turno.horaInicio} a {miEstado.turno.horaFin}</strong> • Tolerancia: +{miEstado.turno.minutosToleranciaEntrada} min
                      </Text>
                    </div>
                  ) : (
                    <Text size={200} style={{ color: '#d83b01', marginTop: 4, display: 'block' }}>
                      Sin turno asignado. Comuníquese con RRHH para configurar su horario.
                    </Text>
                  )}
                </Card>
              </div>

              {/* Botón Principal de Marcado Inteligente */}
              <Card style={{ padding: '32px 24px', textAlign: 'center', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                {miEstado?.siguienteAccionSugerida === 'Entrada' && (
                  <div>
                    <Text size={400} weight="semibold" style={{ display: 'block', marginBottom: 16 }}>
                      Inicio de Jornada Laboral
                    </Text>
                    <Button
                      size="large"
                      appearance="primary"
                      icon={<DoorArrowLeft24Regular />}
                      style={{ height: '56px', fontSize: '18px', padding: '0 36px', backgroundColor: '#107c41', color: '#fff' }}
                      onClick={() => handleMarcar(1, 'Entrada')}
                      disabled={marcando}
                    >
                      {marcando ? <Spinner size="tiny" /> : 'Marcar Entrada'}
                    </Button>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginTop: 12 }}>
                      Al presionar, se registrará la hora exacta de ingreso a tus labores diarias.
                    </Text>
                  </div>
                )}

                {miEstado?.siguienteAccionSugerida === 'InicioRefrigerio' && (
                  <div>
                    <Text size={400} weight="semibold" style={{ display: 'block', marginBottom: 16 }}>
                      Jornada en Curso
                    </Text>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button
                        size="large"
                        appearance="primary"
                        icon={<Food24Regular />}
                        style={{ height: '52px', fontSize: '16px', padding: '0 28px', backgroundColor: '#0078d4', color: '#fff' }}
                        onClick={() => handleMarcar(3, 'Inicio de Refrigerio')}
                        disabled={marcando}
                      >
                        {marcando ? <Spinner size="tiny" /> : 'Iniciar Refrigerio / Almuerzo'}
                      </Button>
                      <Button
                        size="large"
                        appearance="secondary"
                        icon={<ArrowRight24Regular />}
                        style={{ height: '52px', fontSize: '16px', padding: '0 28px', borderColor: '#d83b01', color: '#d83b01' }}
                        onClick={() => handleMarcar(2, 'Salida')}
                        disabled={marcando}
                      >
                        {marcando ? <Spinner size="tiny" /> : 'Marcar Salida Directa'}
                      </Button>
                    </div>
                  </div>
                )}

                {miEstado?.siguienteAccionSugerida === 'FinRefrigerio' && (
                  <div>
                    <Text size={400} weight="semibold" style={{ display: 'block', marginBottom: 16 }}>
                      En Refrigerio / Almuerzo
                    </Text>
                    <Button
                      size="large"
                      appearance="primary"
                      icon={<Clock24Regular />}
                      style={{ height: '56px', fontSize: '18px', padding: '0 36px', backgroundColor: '#5c2d91', color: '#fff' }}
                      onClick={() => handleMarcar(4, 'Fin de Refrigerio')}
                      disabled={marcando}
                    >
                      {marcando ? <Spinner size="tiny" /> : 'Retornar de Refrigerio'}
                    </Button>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginTop: 12 }}>
                      Presione al terminar el horario de refrigerio para retomar sus horas laborales.
                    </Text>
                  </div>
                )}

                {miEstado?.siguienteAccionSugerida === 'Salida' && (
                  <div>
                    <Text size={400} weight="semibold" style={{ display: 'block', marginBottom: 16 }}>
                      Fin de Jornada
                    </Text>
                    <Button
                      size="large"
                      appearance="primary"
                      icon={<ArrowRight24Regular />}
                      style={{ height: '56px', fontSize: '18px', padding: '0 36px', backgroundColor: '#d83b01', color: '#fff' }}
                      onClick={() => handleMarcar(2, 'Salida')}
                      disabled={marcando}
                    >
                      {marcando ? <Spinner size="tiny" /> : 'Marcar Salida'}
                    </Button>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block', marginTop: 12 }}>
                      Registra el término de tu jornada laboral del día de hoy.
                    </Text>
                  </div>
                )}

                {miEstado?.siguienteAccionSugerida === 'Completado' && (
                  <div>
                    <CheckmarkCircle24Regular style={{ fontSize: 48, color: '#107c41', marginBottom: 10 }} />
                    <Text size={500} weight="bold" style={{ display: 'block', color: '#107c41' }}>
                      Jornada Laboral Completada
                    </Text>
                    <Text size={300} style={{ color: tokens.colorNeutralForeground2, marginTop: 8, display: 'block' }}>
                      Has registrado tu Entrada ({miEstado.asistenciaHoy?.horaEntradaReal}) y Salida ({miEstado.asistenciaHoy?.horaSalidaReal}).
                    </Text>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3, marginTop: 4, display: 'block' }}>
                      Total trabajado hoy: <strong>{miEstado.asistenciaHoy?.horasTrabajadas} horas</strong>.
                    </Text>
                  </div>
                )}
              </Card>

              {/* Historial de Marcas de Hoy */}
              <Card style={{ padding: '20px', backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                <Text size={300} weight="semibold" style={{ marginBottom: 14, display: 'block' }}>
                  Marcaciones Registradas Hoy ({miEstado?.marcacionesHoy.length ?? 0})
                </Text>
                {miEstado?.marcacionesHoy.length === 0 ? (
                  <Text size={200} style={{ color: tokens.colorNeutralForeground4, fontStyle: 'italic' }}>
                    No has realizado ninguna marcación el día de hoy.
                  </Text>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {miEstado?.marcacionesHoy.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          borderRadius: 6,
                          backgroundColor: tokens.colorNeutralBackground2,
                          border: `1px solid ${tokens.colorNeutralStroke2}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Clock20Regular style={{ color: '#0078d4' }} />
                          <div>
                            <Text weight="semibold" size={300}>{m.tipoMarcaNombre}</Text>
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                              Vía {m.origenNombre} {m.latitud ? '• Con GPS' : ''}
                            </Text>
                          </div>
                        </div>
                        <Badge appearance="filled" color="brand">
                          {new Date(m.fechaHora).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: CONSOLIDADO Y REPORTE */}
      {activeTab === 'reporte' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className={listStyles.viewHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarLtr20Regular />
                <Text size={200}>Desde:</Text>
                <Input
                  type="date"
                  size="small"
                  value={fechaInicioFiltro}
                  onChange={(_, d) => setFechaInicioFiltro(d.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text size={200}>Hasta:</Text>
                <Input
                  type="date"
                  size="small"
                  value={fechaFinFiltro}
                  onChange={(_, d) => setFechaFinFiltro(d.value)}
                />
              </div>
              <Button size="small" appearance="primary" onClick={cargarReporte}>
                Filtrar
              </Button>
            </div>

            <D365TableToolbarTools
              tableRef={tableRef}
              searchValue={searchTermReporte}
              onSearchChange={setSearchTermReporte}
              searchPlaceholder="Buscar colaborador o DNI..."
            />
          </div>

          <D365EntityTable<AsistenciaDiariaDto>
            ref={tableRef}
            columns={columnsReporte}
            items={itemsReporteFiltrados}
            loading={loadingReporte}
            entityName="Asistencias"
            filterFields={filterFieldsConsolidado}
          />
        </div>
      )}
    </div>
  );
};
