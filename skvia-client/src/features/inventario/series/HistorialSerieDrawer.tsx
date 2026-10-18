import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Input,
  Badge,
  Spinner,
  Text,
  Card,
  Divider,
  makeStyles,
  tokens,
  typographyStyles,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Search16Regular,
  HistoryRegular,
  Box16Filled,
  ArrowRight16Regular,
  CheckmarkCircle16Filled,
  Warning16Filled,
  DismissCircle16Filled,
  Person16Regular,
  Document16Regular,
  VehicleTruckProfile16Regular,
  ArrowSync16Regular,
  ArrowExit16Regular,
  ArrowEnter16Regular,
} from '@fluentui/react-icons';
import { apiClient } from '../../../services/apiClient';

export interface MovimientoHistorialItemDto {
  id: string;
  fecha: string;
  tipo: string;
  tipoCodigo: number;
  origen: string | null;
  destino: string | null;
  documento: string | null;
  responsable: string | null;
  condicion: string;
  observaciones: string | null;
}

export interface HistorialSerieDto {
  id: string;
  numeroSerie: string;
  numeroSmartCard: string | null;
  macAddress: string | null;
  productoId: string;
  productoCodigo: string;
  productoNombre: string;
  categoriaNombre: string | null;
  estado: string;
  condicion: string;
  ubicacionActual: string;
  almacenActualId: string | null;
  almacenActualNombre: string | null;
  ubicacionActualId: string | null;
  ubicacionActualNombre: string | null;
  clienteActualNombre: string | null;
  fechaIngreso: string;
  diasEnEmpresa: number;
  fechaUltimoMovimiento: string | null;
  movimientos: MovimientoHistorialItemDto[];
}

const useStyles = makeStyles({
  drawer: {
    width: '540px',
    maxWidth: '90vw',
  },
  searchBox: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  searchInput: {
    flex: 1,
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
    boxShadow: tokens.shadow4,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingVerticalS,
  },
  gridTwoCols: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalS,
  },
  label: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    display: 'block',
  },
  value: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  timelineSection: {
    marginTop: tokens.spacingVerticalM,
  },
  timelineTitle: {
    ...typographyStyles.subtitle2,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalM,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  timelineList: {
    position: 'relative',
    paddingLeft: '28px',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '11px',
      top: '12px',
      bottom: '12px',
      width: '2px',
      backgroundColor: tokens.colorNeutralStroke2,
    },
  },
  timelineItem: {
    position: 'relative',
    marginBottom: tokens.spacingVerticalL,
  },
  timelineDot: {
    position: 'absolute',
    left: '-28px',
    top: '4px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorBrandBackground2,
    border: `2px solid ${tokens.colorBrandStroke1}`,
    color: tokens.colorBrandForeground1,
    zIndex: 1,
  },
  timelineCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    boxShadow: tokens.shadow2,
  },
  movementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  movementRoute: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: '4px',
  },
  documentBadge: {
    marginTop: '6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '2px 8px',
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  observations: {
    marginTop: '6px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
  },
  errorBox: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteRedBackground1,
    border: `1px solid ${tokens.colorPaletteRedBorderActive}`,
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorPaletteRedForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
});

interface HistorialSerieDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serieInicial?: string | null;
}

export const HistorialSerieDrawer: React.FC<HistorialSerieDrawerProps> = ({
  open,
  onOpenChange,
  serieInicial,
}) => {
  const styles = useStyles();
  const [serieInput, setSerieInput] = useState(serieInicial || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialSerieDto | null>(null);

  const fetchHistorial = useCallback(async (serie: string) => {
    if (!serie.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<HistorialSerieDto>(
        `/api/inventario/stock/series/${encodeURIComponent(serie.trim())}/historial`
      );
      setHistorial(res);
    } catch (err: any) {
      setHistorial(null);
      setError(err.message || `No se encontró historial para la serie '${serie}'.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      if (serieInicial) {
        setSerieInput(serieInicial);
        fetchHistorial(serieInicial);
      } else {
        setHistorial(null);
        setError(null);
      }
    }
  }, [open, serieInicial, fetchHistorial]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (serieInput.trim()) {
      fetchHistorial(serieInput.trim());
    }
  };

  const renderBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'EnAlmacen':
        return <Badge appearance="tint" shape="rounded" color="success" icon={<CheckmarkCircle16Filled />}>En Almacén</Badge>;
      case 'EnCustodiaTecnico':
        return <Badge appearance="tint" shape="rounded" color="brand" icon={<VehicleTruckProfile16Regular />}>Custodia Técnico</Badge>;
      case 'InstaladoEnCliente':
        return <Badge appearance="tint" shape="rounded" color="informative" icon={<Box16Filled />}>Instalado en Cliente</Badge>;
      case 'DevueltoAProveedor':
        return <Badge appearance="tint" shape="rounded" color="warning" icon={<ArrowExit16Regular />}>Devuelto a Proveedor</Badge>;
      case 'EnTransito':
        return <Badge appearance="tint" shape="rounded" color="warning" icon={<ArrowSync16Regular />}>En Tránsito</Badge>;
      case 'AveriadoEnAlmacen':
      case 'RetiradoPorAveria':
        return <Badge appearance="tint" shape="rounded" color="danger" icon={<Warning16Filled />}>Averiado</Badge>;
      case 'BajaPorPerdida':
        return <Badge appearance="tint" shape="rounded" color="danger" icon={<DismissCircle16Filled />}>Baja / Pérdida</Badge>;
      default:
        return <Badge appearance="tint" shape="rounded">{estado}</Badge>;
    }
  };

  const getMovementIcon = (tipoCodigo: number) => {
    switch (tipoCodigo) {
      case 1: return <ArrowEnter16Regular />; // IngresoProveedor
      case 2: return <ArrowSync16Regular />; // Transferencia
      case 3: return <VehicleTruckProfile16Regular />; // DespachoATecnico
      case 4: return <ArrowSync16Regular />; // DevolucionTecnico
      case 5: return <Person16Regular />; // ConsumoCliente
      case 6: return <Warning16Filled />; // RetiroCliente
      case 8: return <ArrowExit16Regular />; // DevolucionAProveedor
      default: return <Box16Filled />;
    }
  };

  return (
    <Drawer
      type="overlay"
      separator
      open={open}
      onOpenChange={(_, { open }) => onOpenChange(open)}
      position="end"
      className={styles.drawer}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Cerrar"
              icon={<Dismiss24Regular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HistoryRegular style={{ color: tokens.colorBrandForeground1 }} />
            <span>Trazabilidad 360° de Serie</span>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        {/* Buscador de Serie */}
        <form onSubmit={handleSearch} className={styles.searchBox}>
          <Input
            className={styles.searchInput}
            placeholder="Ingrese o escanee el N° de Serie..."
            value={serieInput}
            onChange={(_, d) => setSerieInput(d.value)}
            contentBefore={<Search16Regular />}
          />
          <Button appearance="primary" onClick={() => handleSearch()} disabled={loading || !serieInput.trim()}>
            Buscar
          </Button>
        </form>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
            <Spinner label="Consultando trazabilidad completa..." />
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorBox}>
            <Text weight="semibold">No se encontraron resultados</Text>
            <div style={{ marginTop: '4px', fontSize: tokens.fontSizeBase200 }}>{error}</div>
          </div>
        )}

        {historial && !loading && (
          <>
            {/* Tarjeta Resumen Principal */}
            <Card className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <Text weight="bold" size={500} style={{ fontFamily: 'monospace' }}>
                    {historial.numeroSerie}
                  </Text>
                  <div style={{ color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 }}>
                    {historial.productoCodigo} - {historial.productoNombre}
                  </div>
                </div>
                <div>{renderBadgeEstado(historial.estado)}</div>
              </div>

              <Divider style={{ margin: `${tokens.spacingVerticalS} 0` }} />

              <div className={styles.gridTwoCols}>
                <div>
                  <span className={styles.label}>Almacén / Custodio</span>
                  <span className={styles.value}>{historial.almacenActualNombre || '—'}</span>
                </div>
                <div>
                  <span className={styles.label}>Ubicación Interna</span>
                  <span className={styles.value}>{historial.ubicacionActualNombre || historial.ubicacionActual || '—'}</span>
                </div>
                {historial.numeroSmartCard && (
                  <div>
                    <span className={styles.label}>SmartCard</span>
                    <span className={styles.value} style={{ fontFamily: 'monospace' }}>
                      {historial.numeroSmartCard}
                    </span>
                  </div>
                )}
                {historial.macAddress && (
                  <div>
                    <span className={styles.label}>MAC Address</span>
                    <span className={styles.value} style={{ fontFamily: 'monospace' }}>
                      {historial.macAddress}
                    </span>
                  </div>
                )}
                <div>
                  <span className={styles.label}>Fecha de Primer Ingreso</span>
                  <span className={styles.value}>
                    {new Date(historial.fechaIngreso).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className={styles.label}>Permanencia en Empresa</span>
                  <span className={styles.value}>
                    {historial.diasEnEmpresa} {historial.diasEnEmpresa === 1 ? 'día' : 'días'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Línea de Tiempo de Movimientos */}
            <div className={styles.timelineSection}>
              <div className={styles.timelineTitle}>
                <HistoryRegular />
                <span>Historial de Movimientos ({historial.movimientos.length})</span>
              </div>

              {historial.movimientos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: tokens.colorNeutralForeground3 }}>
                  No hay transacciones registradas para este equipo.
                </div>
              ) : (
                <div className={styles.timelineList}>
                  {historial.movimientos.map((mov, idx) => (
                    <div key={mov.id || idx} className={styles.timelineItem}>
                      <div className={styles.timelineDot}>
                        {getMovementIcon(mov.tipoCodigo)}
                      </div>
                      <div className={styles.timelineCard}>
                        <div className={styles.movementHeader}>
                          <Text weight="bold" size={300}>
                            {mov.tipo}
                          </Text>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                            {new Date(mov.fecha).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </Text>
                        </div>

                        {(mov.origen || mov.destino) && (
                          <div className={styles.movementRoute}>
                            <span>{mov.origen || 'Origen'}</span>
                            <ArrowRight16Regular style={{ fontSize: '12px' }} />
                            <Text weight="semibold">{mov.destino || 'Destino'}</Text>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {mov.documento && (
                            <span className={styles.documentBadge}>
                              <Document16Regular style={{ fontSize: '12px' }} />
                              <span>{mov.documento}</span>
                            </span>
                          )}
                          {mov.condicion && (
                            <Badge appearance="tint" shape="rounded" size="small">
                              {mov.condicion}
                            </Badge>
                          )}
                          {mov.responsable && (
                            <span style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>
                              Resp: {mov.responsable}
                            </span>
                          )}
                        </div>

                        {mov.observaciones && (
                          <div className={styles.observations}>
                            "{mov.observaciones}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DrawerBody>
    </Drawer>
  );
};
