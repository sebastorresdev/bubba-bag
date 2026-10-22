import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  typographyStyles,
  Input,
  Button,
  Spinner,
  Text,
  Tooltip,
} from '@fluentui/react-components';
import {
  Search16Regular,
  Tag16Regular,
  ArrowClockwise16Regular,
  Dismiss16Regular,
  Copy16Regular,
  Checkmark16Regular,
  Warning16Filled,
  DismissCircle16Filled,
  Box16Regular,
  Person16Regular,
  VehicleTruckProfile16Regular,
  Building16Regular,
  DocumentText16Regular,
  ArrowSync16Regular,
  ArrowEnter16Regular,
  ArrowExit16Regular,
  ArrowRepeatAll16Regular,
} from '@fluentui/react-icons';
import { D365CommandBar, D365CommandButton } from '../../../components/common/D365CommandBar';
import { D365StatusBadge } from '../../../components/common/D365StatusBadge';
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
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  content: {
    padding: '20px 24px 40px 24px',
    maxWidth: '1280px',
    width: '100%',
    boxSizing: 'border-box',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  searchCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '20px 24px',
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  searchRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
  searchInput: {
    flex: 1,
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.5px',
  },
  searchHint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  infoCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '20px 24px',
    boxShadow: tokens.shadow4,
  },
  infoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  serieTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  serieCode: {
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    letterSpacing: '0.8px',
  },
  badgesRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  gridInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: tokens.spacingHorizontalL,
    paddingTop: tokens.spacingVerticalL,
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightRegular,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    wordBreak: 'break-word',
  },
  infoSubtext: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  sectionCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '20px 24px',
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...typographyStyles.subtitle2,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  tableWrapper: {
    overflowX: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusSmall,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: tokens.fontSizeBase200,
  },
  th: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    padding: '10px 14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    color: tokens.colorNeutralForeground1,
    verticalAlign: 'middle',
  },
  rowEven: {
    backgroundColor: tokens.colorNeutralBackground1,
  },
  rowOdd: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
  },
  errorBanner: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    border: `1px solid ${tokens.colorPaletteRedBorderActive}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px 20px',
    color: tokens.colorPaletteRedForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  documentTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandStroke2}`,
    padding: '2px 8px',
    borderRadius: tokens.borderRadiusSmall,
    whiteSpace: 'nowrap',
  },
  documentTagIcon: {
    fontSize: '13px',
    color: tokens.colorBrandForeground1,
  },
});

export function TrazabilidadSeriesPage() {
  const styles = useStyles();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSerie = searchParams.get('serie') || '';

  const [serieInput, setSerieInput] = useState(initialSerie);
  const [serieConsultada, setSerieConsultada] = useState(initialSerie);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialSerieDto | null>(null);
  const [copiado, setCopiado] = useState(false);

  const consultarSerie = useCallback(async (target?: string) => {
    const raw = (target !== undefined ? target : serieInput).trim().toUpperCase();
    if (!raw) return;

    try {
      setLoading(true);
      setError(null);
      setSerieConsultada(raw);
      setSearchParams({ serie: raw }, { replace: true });

      const res = await apiClient<HistorialSerieDto>(
        `/api/inventario/stock/series/${encodeURIComponent(raw)}/historial`
      );
      setHistorial(res);
    } catch (err: any) {
      setHistorial(null);
      setError(err.message || `No se encontró la serie '${raw}' en el sistema.`);
    } finally {
      setLoading(false);
    }
  }, [serieInput, setSearchParams]);

  useEffect(() => {
    if (initialSerie) {
      void consultarSerie(initialSerie);
    }
  }, [initialSerie, consultarSerie]);

  const handleCopiarSerie = () => {
    if (!historial?.numeroSerie) return;
    navigator.clipboard.writeText(historial.numeroSerie).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleLimpiar = () => {
    setSerieInput('');
    setSerieConsultada('');
    setHistorial(null);
    setError(null);
    setSearchParams({}, { replace: true });
  };

  const renderBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'EnAlmacen':
      case 'AveriadoEnAlmacen':
        return <D365StatusBadge color="brand" text="En Almacén" />;
      case 'EnCustodiaTecnico':
      case 'RetiradoPorAveria':
        return <D365StatusBadge color="informative" text="Custodia Técnico" />;
      case 'InstaladoEnCliente':
        return <D365StatusBadge color="success" text="Instalado en Cliente" />;
      case 'EnTransito':
        return <D365StatusBadge color="warning" text="En Tránsito" />;
      case 'DevueltoAProveedor':
        return <D365StatusBadge color="subtle" text="Devuelto a OL" />;
      case 'BajaPorPerdida':
        return <D365StatusBadge color="danger" text="Baja por Pérdida" />;
      default:
        return <D365StatusBadge color="subtle" text={estado} />;
    }
  };

  const renderBadgeCondicion = (condicion: string) => {
    const normalizada = condicion.toLowerCase();
    if (normalizada.includes('utilizable') || normalizada.includes('bueno') || normalizada === 'operativo') {
      return <D365StatusBadge color="success" text="Operativo" style={{ whiteSpace: 'nowrap' }} />;
    }
    return <D365StatusBadge color="danger" text="Defectuoso" style={{ whiteSpace: 'nowrap' }} />;
  };

  const formatearTipoMovimiento = (tipo: string, tipoCodigo: number) => {
    if (tipoCodigo === 13 || tipo === 'ReclasificacionDOA') return 'Reclasificación DOA';
    if (tipoCodigo === 12 || tipo === 'ReubicacionInterna') return 'Reubicación Interna';
    if (tipoCodigo === 1 || tipo === 'IngresoProveedor') return 'Ingreso por Recepción';
    if (tipoCodigo === 2 || tipo === 'TransferenciaAlmacenes') return 'Transferencia entre Almacenes';
    if (tipoCodigo === 3 || tipo === 'DespachoATecnico') return 'Despacho a Técnico';
    if (tipoCodigo === 4 || tipo === 'DevolucionTecnico') return 'Devolución de Técnico';
    if (tipoCodigo === 5 || tipo === 'ConsumoEnOrdenTrabajo') return 'Instalación en Cliente (OT)';
    if (tipoCodigo === 6 || tipo === 'RetiroEnOrdenTrabajo') return 'Retiro por Avería (OT)';
    if (tipoCodigo === 8 || tipo === 'DevolucionAProveedor') return 'Devolución a Proveedor (OL)';
    return tipo;
  };

  const renderIconoMovimiento = (tipoCodigo: number) => {
    switch (tipoCodigo) {
      case 1: // IngresoProveedor
        return <ArrowEnter16Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />;
      case 2: // TransferenciaAlmacenes
      case 12: // ReubicacionInterna
        return <ArrowSync16Regular style={{ color: tokens.colorBrandForeground1 }} />;
      case 3: // DespachoATecnico
        return <VehicleTruckProfile16Regular style={{ color: tokens.colorPaletteBlueForeground2 }} />;
      case 4: // DevolucionTecnico
        return <ArrowRepeatAll16Regular style={{ color: tokens.colorPaletteDarkOrangeForeground1 }} />;
      case 5: // ConsumoEnOrdenTrabajo (Instalación)
        return <Person16Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />;
      case 6: // RetiroEnOrdenTrabajo (Avería en cliente)
      case 13: // ReclasificacionDOA
        return <Warning16Filled style={{ color: tokens.colorStatusDangerForeground1 }} />;
      case 8: // DevolucionAProveedor
        return <ArrowExit16Regular style={{ color: tokens.colorPaletteMarigoldForeground1 }} />;
      default:
        return <Box16Regular style={{ color: tokens.colorNeutralForeground2 }} />;
    }
  };

  return (
    <div className={styles.root}>
      {/* 1. Barra de comandos superior */}
      <D365CommandBar ariaLabel="Comandos de Trazabilidad de Series">
        <D365CommandButton
          icon={<ArrowClockwise16Regular />}
          onClick={() => void consultarSerie(serieConsultada || serieInput)}
          disabled={!serieConsultada && !serieInput}
        >
          Actualizar
        </D365CommandButton>
        <D365CommandButton
          icon={<Dismiss16Regular />}
          onClick={handleLimpiar}
          disabled={!serieInput && !historial && !error}
        >
          Nueva Consulta
        </D365CommandButton>
      </D365CommandBar>

      <div className={styles.content}>
        {/* 2. Buscador Directo */}
        <div className={styles.searchCard}>
          <div className={styles.searchRow}>
            <Input
              className={styles.searchInput}
              size="large"
              value={serieInput}
              onChange={(_, data) => setSerieInput(data.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void consultarSerie();
                }
              }}
              autoFocus
            />
            <Button
              appearance="primary"
              size="large"
              icon={<Search16Regular />}
              onClick={() => void consultarSerie()}
              disabled={!serieInput.trim() || loading}
            >
              Consultar
            </Button>
          </div>
        </div>

        {/* 3. Estados de Carga / Error */}
        {loading && (
          <div className={styles.emptyState}>
            <Spinner size="large" label="Consultando..." />
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorBanner}>
            <DismissCircle16Filled style={{ fontSize: 24, flexShrink: 0 }} />
            <div>
              <Text weight="semibold" block>
                {error}
              </Text>
            </div>
          </div>
        )}

        {/* 4. Resultados de la Serie Encontrada */}
        {historial && !loading && (
          <>
            {/* Ficha Resumen de la Serie */}
            <div className={styles.infoCard}>
              <div className={styles.infoHeader}>
                <div className={styles.serieTitleRow}>
                  <Tag16Regular style={{ fontSize: 24, color: tokens.colorBrandForeground1 }} />
                  <span className={styles.serieCode}>{historial.numeroSerie}</span>
                  <Tooltip content={copiado ? '¡Copiado!' : 'Copiar número de serie'} relationship="label">
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={copiado ? <Checkmark16Regular style={{ color: tokens.colorPaletteGreenForeground1 }} /> : <Copy16Regular />}
                      onClick={handleCopiarSerie}
                    />
                  </Tooltip>
                </div>
                <div className={styles.badgesRow}>
                  {renderBadgeEstado(historial.estado)}
                  {renderBadgeCondicion(historial.condicion)}
                </div>
              </div>

              <div className={styles.gridInfo}>
                {/* Bloque 1: Producto */}
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Producto / Modelo</span>
                  <span className={styles.infoValue}>{historial.productoNombre}</span>
                  <span className={styles.infoSubtext}>
                    Código: <strong>{historial.productoCodigo}</strong>
                    {historial.categoriaNombre ? ` · ${historial.categoriaNombre}` : ''}
                  </span>
                </div>

                {/* Bloque 2: Hardware / Red */}
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>SmartCard / MAC</span>
                  <span className={styles.infoValue}>
                    {historial.numeroSmartCard || historial.macAddress ? (
                      <>
                        {historial.numeroSmartCard && <div>SC: {historial.numeroSmartCard}</div>}
                        {historial.macAddress && <div>MAC: {historial.macAddress}</div>}
                      </>
                    ) : (
                      '— No registrado'
                    )}
                  </span>
                </div>

                {/* Bloque 3: Custodio / Ubicación Actual */}
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Ubicación / Custodio Actual</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {historial.estado === 'EnCustodiaTecnico' ? (
                      <VehicleTruckProfile16Regular style={{ color: tokens.colorBrandForeground1 }} />
                    ) : historial.estado === 'InstaladoEnCliente' ? (
                      <Person16Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
                    ) : (
                      <Building16Regular style={{ color: tokens.colorBrandForeground1 }} />
                    )}
                    <span className={styles.infoValue}>{historial.ubicacionActual}</span>
                  </div>
                  {historial.clienteActualNombre && (
                    <span className={styles.infoSubtext}>Abonado: {historial.clienteActualNombre}</span>
                  )}
                </div>

                {/* Bloque 4: Origen y Antigüedad */}
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Origen y Antigüedad</span>
                  <span className={styles.infoValue}>
                    {new Date(historial.fechaIngreso).toLocaleDateString('es-PE')}
                    <span style={{ fontWeight: 'normal', color: tokens.colorNeutralForeground3 }}>
                      {' '}({historial.diasEnEmpresa} días en la empresa)
                    </span>
                  </span>
                  <span className={styles.infoSubtext}>
                    Último mov.: {historial.fechaUltimoMovimiento ? new Date(historial.fechaUltimoMovimiento).toLocaleDateString('es-PE') : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Historial Cronológico de Movimientos */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  Historial de Movimientos ({historial.movimientos.length})
                </h3>
              </div>

              {historial.movimientos.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                  No se registran movimientos para esta serie.
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>#</th>
                        <th className={styles.th}>Fecha y Hora</th>
                        <th className={styles.th}>Tipo de Movimiento</th>
                        <th className={styles.th}>Origen</th>
                        <th className={styles.th}>Destino</th>
                        <th className={styles.th}>Documento / Ref.</th>
                        <th className={styles.th}>Condición</th>
                        <th className={styles.th}>Responsable</th>
                        <th className={styles.th}>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.movimientos.map((m, idx) => {
                        const fecha = new Date(m.fecha);
                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={m.id || idx} className={isEven ? styles.rowEven : styles.rowOdd}>
                            <td className={styles.td} style={{ color: tokens.colorNeutralForeground3, fontWeight: 'bold' }}>
                              {idx + 1}
                            </td>
                            <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>
                              <Text weight="semibold">
                                {fecha.toLocaleDateString('es-PE')}
                              </Text>
                              <div style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>
                                {fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className={styles.td}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {renderIconoMovimiento(m.tipoCodigo)}
                                <Text weight="semibold">{formatearTipoMovimiento(m.tipo, m.tipoCodigo)}</Text>
                              </div>
                            </td>
                            <td className={styles.td}>
                              {m.origen ? (
                                <Text>{m.origen}</Text>
                              ) : (
                                <span style={{ color: tokens.colorNeutralForeground4 }}>—</span>
                              )}
                            </td>
                            <td className={styles.td}>
                              {m.destino ? (
                                <Text weight="medium">{m.destino}</Text>
                              ) : (
                                <span style={{ color: tokens.colorNeutralForeground4 }}>—</span>
                              )}
                            </td>
                            <td className={styles.td}>
                              {m.documento ? (
                                <span className={styles.documentTag}>
                                  <DocumentText16Regular className={styles.documentTagIcon} />
                                  {m.documento}
                                </span>
                              ) : (
                                <span style={{ color: tokens.colorNeutralForeground4 }}>—</span>
                              )}
                            </td>
                            <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>
                              {renderBadgeCondicion(m.condicion)}
                            </td>
                            <td className={styles.td}>
                              {m.responsable ? (
                                <Text size={200}>{m.responsable}</Text>
                              ) : (
                                <span style={{ color: tokens.colorNeutralForeground4 }}>—</span>
                              )}
                            </td>
                            <td className={styles.td} style={{ maxWidth: '280px' }}>
                              {m.observaciones ? (
                                <Text size={200} style={{ fontStyle: 'italic', color: tokens.colorNeutralForeground2 }}>
                                  {m.observaciones}
                                </Text>
                              ) : (
                                <span style={{ color: tokens.colorNeutralForeground4 }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
