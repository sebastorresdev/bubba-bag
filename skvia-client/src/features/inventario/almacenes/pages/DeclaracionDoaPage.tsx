import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  Textarea,
  Input,
  Text,
  Badge,
  Card,
  TableCellLayout,
  createTableColumn,
  Toast,
  Toaster,
  ToastTitle,
  useToastController,
  useId,
  Button,
} from '@fluentui/react-components';
import type { TableColumnDefinition, SelectionItemId } from '@fluentui/react-components';
import {
  ArrowLeft16Regular,
  ArrowClockwise16Regular,
  Warning16Regular,
  BarcodeScanner20Regular,
  Save16Regular,
  Box16Regular,
} from '@fluentui/react-icons';
import { AlmacenService } from '../services/almacen.service';
import type {
  AlmacenDto,
  UbicacionInventarioDto,
  SerieDisponibleAlmacenDto,
} from '../types/almacen.types';
import { MotivoRetiroEquipoService } from '../../../servicio-campo/motivos-retiro-equipo/services/motivoRetiroEquipo.service';
import type { MotivoRetiroEquipoDto } from '../../../servicio-campo/motivos-retiro-equipo/types/motivoRetiroEquipo.types';
import { TIPOS_RETIRO_EQUIPO_INFO } from '../../../servicio-campo/motivos-retiro-equipo/types/motivoRetiroEquipo.types';
import { D365CommandBar, D365CommandButton, D365CommandDivider } from '../../../../components/common/D365CommandBar';
import { D365EntityHeader } from '../../../../components/common/D365EntityHeader';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { D365EntityTable } from '../../../../components/common/D365EntityTable';
import { SelectorEntidadRelacionada } from '../../../../components/common/SelectorEntidadRelacionada';
import { useD365FormStyles } from '../../../../styles/d365FormStyles';

export const DeclaracionDoaPage: React.FC = () => {
  const styles = useD365FormStyles();
  const navigate = useNavigate();

  const toasterId = useId('declaracion-doa-toaster');
  const { dispatchToast } = useToastController(toasterId);

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

  // Almacenes y catálogos
  const [almacenes, setAlmacenes] = useState<AlmacenDto[]>([]);
  const [almacenId, setAlmacenId] = useState<string>('');
  const [busquedaAlmacen, setBusquedaAlmacen] = useState<string>('');
  const [ubicaciones, setUbicaciones] = useState<UbicacionInventarioDto[]>([]);
  const [motivosRetiro, setMotivosRetiro] = useState<MotivoRetiroEquipoDto[]>([]);

  // Series en Disponible
  const [seriesDisponibles, setSeriesDisponibles] = useState<SerieDisponibleAlmacenDto[]>([]);
  const [loadingSeries, setLoadingSeries] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<SelectionItemId>>(new Set());

  // Formulario de Reclasificación DOA
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState<string>('');
  const [motivoRetiroId, setMotivoRetiroId] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [serieScanner, setSerieScanner] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Cargar almacenes y catálogo de motivos
  useEffect(() => {
    AlmacenService.getAlmacenes(true)
      .then((alms) => {
        const bodegas = alms.filter((a) => a.tipo === 1);
        setAlmacenes(bodegas);
        if (bodegas.length > 0) {
          setAlmacenId(bodegas[0].id);
        }
      })
      .catch((err) => console.error('Error al cargar almacenes:', err));

    MotivoRetiroEquipoService.getMotivos(undefined, true)
      .then((mots) => {
        setMotivosRetiro(mots);
        const doa = mots.find((m) => m.tipoRetiro === 'DefectoFabricaDOA') || mots[0];
        if (doa) setMotivoRetiroId(doa.id);
      })
      .catch((err) => console.error('Error al cargar motivos de retiro:', err));
  }, []);

  // 2. Al cambiar almacén, cargar ubicaciones y series en DISPONIBLE
  const cargarDatosAlmacen = useCallback(async (almId: string) => {
    if (!almId) {
      setUbicaciones([]);
      setSeriesDisponibles([]);
      setUbicacionDestinoId('');
      return;
    }
    try {
      setLoadingSeries(true);
      setStatusMessage(null);
      setSelectedIds(new Set());

      const [ubics, sers] = await Promise.all([
        AlmacenService.getUbicaciones(almId),
        AlmacenService.getSeriesDisponiblesAlmacen(almId),
      ]);

      setUbicaciones(ubics || []);
      setSeriesDisponibles(sers || []);

      // Preseleccionar ubicación destino (devolución)
      const uDev = (ubics || []).find((u) => u.tipoUbicacionNombre === 'Devolucion' || u.tipoUbicacion === 2);
      if (uDev) {
        setUbicacionDestinoId(uDev.id);
      } else {
        setUbicacionDestinoId('');
      }
    } catch (err: any) {
      console.error('Error al cargar datos del almacén:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al conectar con el inventario del almacén.',
      });
    } finally {
      setLoadingSeries(false);
    }
  }, []);

  useEffect(() => {
    if (almacenId) {
      void cargarDatosAlmacen(almacenId);
    }
  }, [almacenId, cargarDatosAlmacen]);

  // Ubicaciones de destino en la rama DEVOLUCIÓN
  const ubicacionesDevolucion = useMemo(() => {
    return ubicaciones.filter(
      (u) => u.tipoUbicacionNombre === 'Devolucion' || u.tipoUbicacion === 2
    );
  }, [ubicaciones]);

  const almacenActual = useMemo(() => {
    return almacenes.find((a) => a.id === almacenId) || null;
  }, [almacenes, almacenId]);

  // TagPicker: opciones y selección
  const opcionesAlmacenes = useMemo(() => {
    return almacenes.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      detalle: a.codigo ? `Código: ${a.codigo}` : undefined,
    }));
  }, [almacenes]);

  const almacenSeleccionado = useMemo(() => {
    if (!almacenActual) return null;
    return {
      id: almacenActual.id,
      nombre: almacenActual.nombre,
      detalle: almacenActual.codigo ? `Código: ${almacenActual.codigo}` : undefined,
    };
  }, [almacenActual]);

  // Manejo de escáner / ingreso rápido de serie
  const handleScanSerie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serieScanner.trim()) return;

    const query = serieScanner.trim().toUpperCase();
    const match = seriesDisponibles.find(
      (s) =>
        s.numeroSerie.toUpperCase() === query ||
        (s.numeroSmartCard && s.numeroSmartCard.toUpperCase() === query)
    );

    if (match) {
      setSelectedIds((prev) => new Set([...Array.from(prev), match.id]));
      setSerieScanner('');
      notifySuccess(`Serie ${match.numeroSerie} agregada.`);
    } else {
      setStatusMessage({
        type: 'error',
        text: `La serie "${query}" no fue encontrada en la ubicación DISPONIBLE de este almacén.`,
      });
    }
  };

  // Confirmar Reclasificación DOA
  const handleConfirmarDoa = async () => {
    if (!almacenId) {
      setStatusMessage({ type: 'error', text: 'Seleccione un almacén base.' });
      return;
    }
    if (selectedIds.size === 0) {
      setStatusMessage({ type: 'error', text: 'Seleccione al menos una serie para declarar DOA.' });
      return;
    }
    if (!ubicacionDestinoId) {
      setStatusMessage({ type: 'error', text: 'El almacén no cuenta con una ubicación de Devolución configurada.' });
      return;
    }
    if (!motivoRetiroId) {
      setStatusMessage({ type: 'error', text: 'Seleccione el motivo de retiro / falla.' });
      return;
    }

    const seriesObjetivo = seriesDisponibles
      .filter((s) => selectedIds.has(s.id))
      .map((s) => s.numeroSerie);

    try {
      setSaving(true);
      setStatusMessage(null);

      const ubicOrigen = seriesDisponibles.find((s) => selectedIds.has(s.id))?.ubicacionActualId;
      if (!ubicOrigen) {
        throw new Error('No se pudo identificar la ubicación de origen de las series seleccionadas.');
      }

      const res = await AlmacenService.declararDoa(almacenId, {
        ubicacionOrigenId: ubicOrigen,
        ubicacionDestinoId,
        motivoRetiroId,
        series: seriesObjetivo,
        observaciones: observaciones.trim() || undefined,
      });

      notifySuccess(res.mensaje || 'Series declaradas DOA exitosamente.');
      setStatusMessage({
        type: 'success',
        text: res.mensaje || 'Reclasificación DOA completada. Las series pasaron a la ubicación de Devolución.',
      });

      setObservaciones('');
      setSelectedIds(new Set());
      await cargarDatosAlmacen(almacenId);
    } catch (err: any) {
      console.error('Error al declarar DOA:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Error al procesar la declaración DOA en el servidor.',
      });
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnDefinition<SerieDisponibleAlmacenDto>[] = useMemo(
    () => [
      createTableColumn<SerieDisponibleAlmacenDto>({
        columnId: 'numeroSerie',
        compare: (a, b) => a.numeroSerie.localeCompare(b.numeroSerie),
        renderHeaderCell: () => 'Número de Serie',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text weight="semibold" style={{ fontFamily: 'Consolas, monospace' }}>
              {item.numeroSerie}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<SerieDisponibleAlmacenDto>({
        columnId: 'productoNombre',
        compare: (a, b) => a.productoNombre.localeCompare(b.productoNombre),
        renderHeaderCell: () => 'Producto / Modelo',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text>{item.productoNombre}</Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<SerieDisponibleAlmacenDto>({
        columnId: 'numeroSmartCard',
        renderHeaderCell: () => 'SmartCard / MAC',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Text size={200} style={{ color: '#605e5c', fontFamily: 'Consolas, monospace' }}>
              {item.numeroSmartCard || item.macAddress || '—'}
            </Text>
          </TableCellLayout>
        ),
      }),
      createTableColumn<SerieDisponibleAlmacenDto>({
        columnId: 'ubicacionNombre',
        renderHeaderCell: () => 'Ubicación Origen',
        renderCell: (item) => (
          <TableCellLayout truncate>
            <Badge appearance="tint" color="success">
              {item.ubicacionNombre}
            </Badge>
          </TableCellLayout>
        ),
      }),
    ],
    []
  );

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />

      {/* 0. Notification Message Bar */}
      {statusMessage && (
        <D365MessageBar
          intent={statusMessage.type === 'success' ? 'success' : 'error'}
          className={styles.messageBarContainer}
          onDismiss={() => setStatusMessage(null)}
        >
          {statusMessage.text}
        </D365MessageBar>
      )}

      {/* 1. Dynamics 365 Standard Command Bar */}
      <D365CommandBar
        ariaLabel="Comandos de declaración DOA"
        busy={saving || loadingSeries}
        busyLabel={saving ? 'Procesando declaración DOA...' : 'Cargando series...'}
      >
        <div className={styles.toolbarLeft}>
          <D365CommandButton
            icon={<ArrowLeft16Regular />}
            tone="brand"
            onClick={() => navigate('/servicio-campo/declaracion-doa')}
            title="Volver al Historial"
            aria-label="Volver"
          />
          <D365CommandDivider />

          <D365CommandButton
            icon={<Save16Regular />}
            tone="save"
            onClick={handleConfirmarDoa}
            disabled={saving || loadingSeries || selectedIds.size === 0}
            appearance="subtle"
          >
            Confirmar Declaración DOA ({selectedIds.size})
          </D365CommandButton>

          <D365CommandButton
            icon={<ArrowClockwise16Regular />}
            onClick={() => void cargarDatosAlmacen(almacenId)}
            disabled={saving || loadingSeries || !almacenId}
            appearance="subtle"
          >
            Actualizar Series
          </D365CommandButton>
        </div>
      </D365CommandBar>

      {/* 2. D365 Entity Header */}
      <D365EntityHeader
        title="Nueva Declaración DOA / Reclasificación"
        subtitle="Pase de equipos disponibles a cuarentena y devolución por falla técnica"
        avatarIcon={<Warning16Regular />}
        metadata={[
          { label: 'Almacén Base', value: almacenActual?.nombre || '—' },
          { label: 'Disponibles', value: `${seriesDisponibles.length} series` },
          { label: 'Seleccionados', value: `${selectedIds.size}` },
        ]}
      />

      {/* 3. Form Layout */}
      <div className={styles.contentBody} style={{ padding: '16px' }}>
        <div className={styles.grid2Cols}>
          {/* Panel Izquierdo: Datos de la Declaración */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card className={styles.card}>
              <Text className={styles.cardSectionTitle}>
                Datos de la Reclasificación
              </Text>

              {/* Almacén Base con SelectorEntidadRelacionada (TagPicker) */}
              <D365FormField label="Almacén Base" required>
                <SelectorEntidadRelacionada
                  etiquetaGrupo="Almacenes / Bodegas"
                  icono={<Box16Regular />}
                  deshabilitado={saving || loadingSeries}
                  tituloEnlace="Ver detalles del almacén"
                  alNavegar={(id) => navigate(`/servicio-campo/almacenes/${id}`)}
                  opciones={opcionesAlmacenes}
                  seleccionada={almacenSeleccionado}
                  textoBusqueda={busquedaAlmacen}
                  alCambiarBusqueda={setBusquedaAlmacen}
                  alSeleccionar={(id) => setAlmacenId(id || '')}
                />
              </D365FormField>

              {/* Ubicación Destino dentro del Almacén (Devolución) */}
              <D365FormField
                label="Ubicación Destino (Devolución)"
                required
                htmlFor="doa-ubic-destino"
              >
                {ubicacionesDevolucion.length <= 1 ? (
                  <div
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#f3f2f1',
                      borderRadius: 4,
                      border: '1px solid #d1d1d1',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Badge appearance="tint" color="danger">
                      {ubicacionesDevolucion[0]?.codigo || 'DEVOLUCION'}
                    </Badge>
                    <Text weight="medium">
                      {ubicacionesDevolucion[0]?.nombre || 'Ubicación Devolución del Almacén'}
                    </Text>
                  </div>
                ) : (
                  <Select
                    id="doa-ubic-destino"
                    size="medium"
                    value={ubicacionDestinoId}
                    onChange={(_, data) => setUbicacionDestinoId(data.value)}
                    disabled={saving || loadingSeries}
                    className={styles.d365ControlFull}
                  >
                    {ubicacionesDevolucion.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.codigo})
                      </option>
                    ))}
                  </Select>
                )}
              </D365FormField>

              {/* Motivo de Retiro */}
              <D365FormField
                label="Motivo de Retiro"
                required
                htmlFor="doa-motivo"
              >
                <Select
                  id="doa-motivo"
                  size="medium"
                  value={motivoRetiroId}
                  onChange={(_, data) => setMotivoRetiroId(data.value)}
                  disabled={saving || loadingSeries}
                  className={styles.d365ControlFull}
                >
                  {motivosRetiro.map((m) => {
                    const info = TIPOS_RETIRO_EQUIPO_INFO[m.tipoRetiro];
                    return (
                      <option key={m.id} value={m.id}>
                        {m.nombre} [{info?.badgeLabel || m.tipoRetiro}]
                      </option>
                    );
                  })}
                </Select>
              </D365FormField>

              {/* Observaciones técnicas */}
              <D365FormField
                label="Observaciones"
                htmlFor="doa-observaciones"
                align="top"
              >
                <Textarea
                  id="doa-observaciones"
                  value={observaciones}
                  onChange={(_, data) => setObservaciones(data.value)}
                  disabled={saving || loadingSeries}
                  rows={3}
                  className={styles.d365ControlFull}
                />
              </D365FormField>
            </Card>
          </div>

          {/* Panel Derecho: Escaneo y Tabla de Series en Disponible */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card className={styles.card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text className={styles.cardSectionTitle}>
                  Selección de Equipos en Disponible
                </Text>
                <Badge appearance="tint" color={selectedIds.size > 0 ? 'important' : 'subtle'}>
                  {selectedIds.size} seleccionados
                </Badge>
              </div>

              {/* Pistoleo / Escaneo rápido */}
              <form onSubmit={handleScanSerie} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Input
                  size="medium"
                  style={{ flexGrow: 1 }}
                  placeholder="Escanear número de serie o SmartCard..."
                  value={serieScanner}
                  onChange={(_, d) => setSerieScanner(d.value)}
                  contentBefore={<BarcodeScanner20Regular style={{ color: '#0f6cbd' }} />}
                  aria-label="Pistolear número de serie"
                />
                <Button appearance="secondary" type="submit">
                  Agregar
                </Button>
              </form>

              {/* Tabla de Series Disponibles */}
              <D365EntityTable<SerieDisponibleAlmacenDto>
                entityName="SeriesDisponibles"
                tableId="series-disponibles-doa"
                items={seriesDisponibles}
                columns={columns}
                loading={loadingSeries}
                selectionMode="multiselect"
                selectedItems={selectedIds}
                onSelectionChange={(_, data) => setSelectedIds(data.selectedItems)}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
