import { useState, useEffect, useMemo } from 'react';
import {
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Input,
  OverlayDrawer,
  Badge,
  Spinner,
  makeStyles,
  tokens,
  typographyStyles,
} from '@fluentui/react-components';
import {
  Dismiss16Regular,
  Search16Regular,
  CheckmarkCircle16Filled,
  Calendar16Regular,
} from '@fluentui/react-icons';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { InventarioProductoService } from '../services/inventario-producto.service';
import type { InventarioProductoDto, ItemSeriadoStockDto } from '../types/inventario-producto.types';

const useStyles = makeStyles({
  drawer: {
    width: '560px',
    maxWidth: '95vw',
  },
  header: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: '12px',
  },
  headerSubtitle: {
    ...typographyStyles.caption1,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px 24px',
    overflowY: 'auto',
  },
  tableContainer: {
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 140px 100px',
    padding: '10px 14px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ...typographyStyles.caption1Strong,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 140px 100px',
    padding: '12px 14px',
    alignItems: 'center',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    ':last-child': {
      borderBottom: 'none',
    },
  },
  serieText: {
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
  },
  secondaryText: {
    ...typographyStyles.caption1,
    color: tokens.colorNeutralForeground3,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '16px 24px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

export interface SeriesAlmacenDrawerProps {
  item: InventarioProductoDto | null;
  alCerrar: () => void;
}

export function SeriesAlmacenDrawer({ item, alCerrar }: SeriesAlmacenDrawerProps) {
  const styles = useStyles();
  const [series, setSeries] = useState<ItemSeriadoStockDto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (!item) return;
    let activo = true;
    setCargando(true);
    setError(null);

    InventarioProductoService.obtenerSeries(item.almacenId, item.productoId, undefined, item.ubicacionId)
      .then(res => {
        if (activo) setSeries(res.filter(s => s.condicion === item.condicion));
      })
      .catch(e => {
        if (activo) setError(e instanceof Error ? e.message : 'No se pudieron cargar las series.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [item]);

  const seriesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return series;
    const b = busqueda.trim().toUpperCase();
    return series.filter(s =>
      s.numeroSerie.includes(b) ||
      (s.numeroSmartCard && s.numeroSmartCard.includes(b)) ||
      (s.macAddress && s.macAddress.includes(b))
    );
  }, [series, busqueda]);

  if (!item) return null;

  return (
    <OverlayDrawer
      open={Boolean(item)}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, d) => {
        if (!d.open) alCerrar();
      }}
    >
      <DrawerHeader className={styles.header}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              aria-label="Cerrar"
              onClick={alCerrar}
            />
          }
        >
          Series en Existencia
        </DrawerHeaderTitle>
        <div className={styles.headerSubtitle}>
          {item.nombreProducto} • Almacén: {item.nombreAlmacen} · {item.nombreUbicacion} · {item.condicion} ({series.length} registradas)
        </div>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        {error && <D365MessageBar intent="error">{error}</D365MessageBar>}

        <Input
          placeholder="Buscar" aria-label="Buscar por número de serie, smartcard o MAC"
          contentBefore={<Search16Regular />}
          value={busqueda}
          onChange={(_, d) => setBusqueda(d.value)}
        />

        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Spinner label="Consultando series en stock..." />
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <span>Número de Serie</span>
              <span>Estado</span>
              <span>Ingreso</span>
            </div>
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {seriesFiltradas.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                  No se encontraron series para los filtros seleccionados.
                </div>
              ) : (
                seriesFiltradas.map(s => (
                  <div key={s.id} className={styles.tableRow}>
                    <div>
                      <div className={styles.serieText}>{s.numeroSerie}</div>
                      {(s.numeroSmartCard || s.macAddress) && (
                        <div className={styles.secondaryText}>
                          {s.numeroSmartCard && `SC: ${s.numeroSmartCard} `}
                          {s.macAddress && `MAC: ${s.macAddress}`}
                        </div>
                      )}
                    </div>
                    <div>
                      <Badge
                        appearance="tint"
                        shape="rounded"
                        color="success"
                        icon={<CheckmarkCircle16Filled />}
                      >
                        {s.estado === 'EnAlmacen' ? 'En Almacén' : s.estado}
                      </Badge>
                    </div>
                    <div className={styles.secondaryText} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar16Regular />
                      {new Date(s.createdAt).toLocaleDateString('es-PE')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DrawerBody>

      <DrawerFooter className={styles.footer}>
        <Button appearance="secondary" onClick={alCerrar}>
          Cerrar
        </Button>
      </DrawerFooter>
    </OverlayDrawer>
  );
}
