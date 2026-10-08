import React, { useState, useEffect } from 'react';
import {
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Badge,
  Spinner,
  Text,
  makeStyles,
  tokens,
  typographyStyles,
  Tooltip,
} from '@fluentui/react-components';
import {
  Dismiss16Regular,
  Box20Regular,
  Tag16Regular,
  ArrowDownload16Regular,
  Open16Regular,
  ArrowRight16Regular,
} from '@fluentui/react-icons';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { TableEmptyState } from '../../../../components/common/TableEmptyState';
import { TransferenciaService } from '../services/transferencia.service';
import type {
  TransferenciaInventarioDto,
  TransferenciaDetalladaDto,
} from '../types/transferencia.types';

const useStyles = makeStyles({
  drawer: {
    width: '580px',
    maxWidth: '95vw',
  },
  header: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: '14px',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerSubtitle: {
    ...typographyStyles.caption1,
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px 24px',
    overflowY: 'auto',
  },
  metricsBanner: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricLabel: {
    ...typographyStyles.caption2,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    fontWeight: tokens.fontWeightSemibold,
  },
  metricValue: {
    ...typographyStyles.body1Strong,
    color: tokens.colorNeutralForeground1,
  },
  sectionTitle: {
    ...typographyStyles.subtitle2,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  materialCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '14px 16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    ':hover': {
      borderTopColor: tokens.colorBrandStroke1,
      borderBottomColor: tokens.colorBrandStroke1,
      borderLeftColor: tokens.colorBrandStroke1,
      borderRightColor: tokens.colorBrandStroke1,
    },
  },
  materialHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  materialNombre: {
    ...typographyStyles.body1Strong,
    color: tokens.colorNeutralForeground1,
  },
  materialSku: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  seriesContainer: {
    marginTop: '4px',
    padding: '10px 12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  seriesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    ...typographyStyles.caption1Strong,
    color: tokens.colorNeutralForeground2,
    marginBottom: '8px',
  },
  seriesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  serieBadge: {
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '11px',
    padding: '3px 8px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorBrandStroke2}`,
    color: tokens.colorBrandForeground1,
    borderRadius: tokens.borderRadiusSmall,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 24px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  footerActionsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});

export interface DetalleMaterialesTransferenciaDrawerProps {
  open: boolean;
  transferencia: TransferenciaInventarioDto | null;
  onClose: () => void;
  onVerFichaCompleta?: (id: string) => void;
}

export const DetalleMaterialesTransferenciaDrawer: React.FC<DetalleMaterialesTransferenciaDrawerProps> = ({
  open,
  transferencia,
  onClose,
  onVerFichaCompleta,
}) => {
  const styles = useStyles();
  const [detalle, setDetalle] = useState<TransferenciaDetalladaDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !transferencia) {
      setDetalle(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    TransferenciaService.obtenerDetalle(transferencia.id)
      .then((data) => {
        if (isMounted) {
          setDetalle(data);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'No se pudo cargar el detalle de materiales.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, transferencia]);

  if (!transferencia) return null;

  // Cálculos rápidos
  const totalCantidad = detalle?.lineas
    ? detalle.lineas.reduce((acc, l) => acc + (l.cantidadEnviada || 0), 0)
    : transferencia.totalCantidad ?? transferencia.cantidad ?? 0;

  const totalLineas = detalle?.lineas ? detalle.lineas.length : transferencia.totalLineas ?? 0;

  const estado = transferencia.estado ?? 'Cerrada';
  let estadoColor: 'informative' | 'warning' | 'important' | 'success' | 'danger' = 'informative';
  let estadoLabel = estado;

  if (estado === 'EnTransito') {
    estadoColor = 'warning';
    estadoLabel = 'En Tránsito';
  } else if (estado === 'ParcialmenteRecibida') {
    estadoColor = 'important';
    estadoLabel = 'Parcialmente Recibida';
  } else if (estado === 'Cerrada') {
    estadoColor = 'success';
    estadoLabel = 'Cerrada';
  } else if (estado === 'Cancelada') {
    estadoColor = 'danger';
    estadoLabel = 'Cancelada';
  } else if (estado === 'Borrador') {
    estadoColor = 'informative';
    estadoLabel = 'Borrador';
  }

  return (
    <OverlayDrawer
      open={open}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, data) => {
        if (!data.open) onClose();
      }}
    >
      <DrawerHeader className={styles.header}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              size="medium"
              icon={<Dismiss16Regular />}
              aria-label="Cerrar panel"
              onClick={onClose}
            />
          }
        >
          <div className={styles.headerTitleRow}>
            <Box20Regular style={{ color: tokens.colorBrandForeground1 }} />
            <Text weight="bold" size={400}>
              {transferencia.numero}
            </Text>
            <Badge appearance="tint" shape="rounded" color={estadoColor} size="small">
              {estadoLabel}
            </Badge>
          </div>
        </DrawerHeaderTitle>

        <div className={styles.headerSubtitle}>
          <span>{transferencia.almacenOrigen}</span>
          <ArrowRight16Regular style={{ fontSize: '12px', color: tokens.colorNeutralForeground4 }} />
          <Text weight="semibold">{transferencia.almacenDestino}</Text>
          {transferencia.numeroGuiaRemision && (
            <Badge appearance="outline" shape="rounded" size="small" style={{ marginLeft: '6px' }}>
              Guía: {transferencia.numeroGuiaRemision}
            </Badge>
          )}
        </div>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        {/* Banner de Métricas */}
        <div className={styles.metricsBanner}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Materiales</span>
            <span className={styles.metricValue}>{totalLineas} {totalLineas === 1 ? 'ítem' : 'ítems'}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Total Unidades</span>
            <span className={styles.metricValue}>{totalCantidad.toLocaleString('es-PE')}</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Operación</span>
            <span className={styles.metricValue}>
              {transferencia.tipoOperacion || 'Traslado'}
            </span>
          </div>
        </div>

        {/* Sección de Materiales */}
        <div className={styles.sectionTitle}>
          <span>Materiales Transferidos</span>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {totalLineas} {totalLineas === 1 ? 'producto' : 'productos'}
          </Text>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Spinner label="Cargando detalle de materiales y series..." />
          </div>
        ) : error ? (
          <D365MessageBar intent="error">{error}</D365MessageBar>
        ) : !detalle || detalle.lineas.length === 0 ? (
          <TableEmptyState message="No se han registrado materiales en esta transferencia" />
        ) : (
          detalle.lineas.map((linea) => {
            const seriesList = linea.series || [];
            return (
              <div key={linea.id || linea.productoId} className={styles.materialCard}>
                <div className={styles.materialHeader}>
                  <div>
                    <div className={styles.materialNombre}>{linea.productoNombre}</div>
                    <div className={styles.materialSku}>SKU: {linea.codigoProducto || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <Badge appearance="filled" shape="rounded" color="brand" size="medium">
                      {linea.cantidadEnviada} {linea.unidadMedidaNombre || 'UND'}
                    </Badge>
                    <Badge
                      appearance="tint"
                      shape="rounded"
                      color={linea.condicion === 'Defectuoso' ? 'danger' : 'informative'}
                      size="small"
                    >
                      {linea.condicion || 'Utilizable'}
                    </Badge>
                  </div>
                </div>

                {/* Series asignadas/devueltas si las hay */}
                {seriesList.length > 0 && (
                  <div className={styles.seriesContainer}>
                    <div className={styles.seriesHeader}>
                      <Tag16Regular style={{ color: tokens.colorBrandForeground1 }} />
                      <span>Números de serie registrados ({seriesList.length}):</span>
                    </div>
                    <div className={styles.seriesList}>
                      {seriesList.map((s, idx) => (
                        <span key={s.numeroSerie || idx} className={styles.serieBadge}>
                          {s.numeroSerie}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </DrawerBody>

      <DrawerFooter className={styles.footer}>
        <Tooltip content="Descargar Cargo Oficial en PDF" relationship="label">
          <Button
            appearance="outline"
            size="medium"
            icon={<ArrowDownload16Regular />}
            onClick={() => void TransferenciaService.descargarCargoPdf(transferencia.id, transferencia.numero)}
          >
            Cargo PDF
          </Button>
        </Tooltip>

        <div className={styles.footerActionsRight}>
          {onVerFichaCompleta && (
            <Button
              appearance="primary"
              size="medium"
              icon={<Open16Regular />}
              onClick={() => onVerFichaCompleta(transferencia.id)}
            >
              Ver Ficha Completa
            </Button>
          )}
          <Button appearance="secondary" size="medium" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DrawerFooter>
    </OverlayDrawer>
  );
};
