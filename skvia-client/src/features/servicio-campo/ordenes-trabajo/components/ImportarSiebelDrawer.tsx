import React, { useState, useRef, useMemo } from 'react';
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Button,
  Spinner,
  Text,
  tokens,
  makeStyles,
  Badge,
} from '@fluentui/react-components';
import {
  DismissRegular,
  ArrowUpload20Regular,
  CheckmarkCircle20Regular,
  Warning20Regular,
  DismissCircle20Regular,
  ArrowDownload20Regular,
  DocumentArrowUp20Regular,
} from '@fluentui/react-icons';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import type { ResultadoImportacionSiebel, FilaDetalleImportacionSiebel } from '../types/ordenTrabajo.types';

const useStyles = makeStyles({
  drawer: {
    width: '650px',
    maxWidth: '95vw',
  },
  drawerHeader: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: '12px',
  },
  drawerBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
  },
  drawerFooter: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  dropZone: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '28px 16px',
    textAlign: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderTopColor: tokens.colorBrandStroke1,
      borderRightColor: tokens.colorBrandStroke1,
      borderBottomColor: tokens.colorBrandStroke1,
      borderLeftColor: tokens.colorBrandStroke1,
    },
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '8px',
  },
  statCard: {
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  errorList: {
    maxHeight: '140px',
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorStatusDangerForeground1,
  },
  detailsTableContainer: {
    maxHeight: '260px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  detailRow: {
    display: 'grid',
    gridTemplateColumns: '50px 130px 1fr 90px',
    gap: '8px',
    padding: '8px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    fontSize: tokens.fontSizeBase200,
    alignItems: 'center',
    ':last-child': {
      borderBottom: 'none',
    },
  },
  detailRowHeader: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
});

interface ImportarSiebelDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ImportarSiebelDrawer: React.FC<ImportarSiebelDrawerProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionSiebel | null>(null);
  const [filtroDetalle, setFiltroDetalle] = useState<'todos' | 'errores' | 'creadas' | 'omitidas'>('todos');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setResultado(null);
      setErrorMsg(null);
    }
  };

  const handleProcesar = async (useDefaultPath = false) => {
    setLoading(true);
    setErrorMsg(null);
    setResultado(null);

    try {
      let res: ResultadoImportacionSiebel;
      if (useDefaultPath) {
        res = await OrdenTrabajoService.importarSiebel(undefined, 'c:\\Users\\sebas\\Downloads\\output.csv');
      } else if (selectedFile) {
        res = await OrdenTrabajoService.importarSiebel(selectedFile);
      } else {
        setErrorMsg('Seleccione un archivo CSV de Siebel o use el archivo de muestra.');
        setLoading(false);
        return;
      }

      setResultado(res);
      if (res.ordenesCreadas > 0) {
        onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al importar el archivo.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarReporte = () => {
    if (!resultado) return;

    if (resultado.reporteCsvBase64) {
      const byteCharacters = atob(resultado.reporteCsvBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Importacion_Siebel_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    // Fallback de generación directa en frontend
    const header = ['Fila', 'Numero_Orden', 'Cliente', 'Servicio', 'Tecnico', 'Estado', 'Detalle'];
    const dataRows = (resultado.detalles || []).map((d) => [
      d.fila.toString(),
      d.numeroOrden,
      d.cliente,
      d.servicio,
      d.tecnico,
      d.estado,
      d.detalle,
    ]);
    const errorRows = (resultado.errores || []).map((err) => ['0', 'GENERAL', '-', '-', '-', 'Error General', err]);

    const allRows = [header, ...dataRows, ...errorRows];
    const csvContent =
      '\uFEFF' +
      allRows
        .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Importacion_Siebel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const detallesFiltrados = useMemo(() => {
    if (!resultado?.detalles) return [];
    if (filtroDetalle === 'todos') return resultado.detalles;
    if (filtroDetalle === 'errores') {
      return resultado.detalles.filter(
        (d) => d.estado.toLowerCase().includes('error') || d.estado.toLowerCase().includes('invalida')
      );
    }
    if (filtroDetalle === 'creadas') {
      return resultado.detalles.filter((d) => d.estado.toLowerCase().includes('creada'));
    }
    if (filtroDetalle === 'omitidas') {
      return resultado.detalles.filter((d) => d.estado.toLowerCase().includes('omitida'));
    }
    return resultado.detalles;
  }, [resultado, filtroDetalle]);

  const handleClose = () => {
    setSelectedFile(null);
    setResultado(null);
    setErrorMsg(null);
    onOpenChange(false);
  };

  const getStatusColor = (estado: string) => {
    const est = estado.toLowerCase();
    if (est.includes('creada')) return 'success';
    if (est.includes('omitida')) return 'informative';
    if (est.includes('error') || est.includes('invalida')) return 'danger';
    return 'neutral';
  };

  return (
    <OverlayDrawer
      open={open}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, data) => onOpenChange(data.open)}
    >
      <DrawerHeader className={styles.drawerHeader}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Cerrar"
              icon={<DismissRegular />}
              onClick={handleClose}
            />
          }
        >
          Importar Órdenes desde Siebel
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.drawerBody}>
        {/* Zona de Carga de Archivo */}
        {!resultado && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <div
              className={styles.dropZone}
              onClick={() => fileInputRef.current?.click()}
            >
              <DocumentArrowUp20Regular style={{ fontSize: '36px', color: tokens.colorBrandForeground1 }} />
              <div>
                <Text weight="semibold" block>
                  {selectedFile ? selectedFile.name : 'Haga clic para seleccionar o arrastre el archivo CSV de Siebel'}
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : 'Formatos soportados: CSV delimitado por tabulaciones o comas (UTF-16LE / UTF-8)'}
                </Text>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '-4px' }}>
              <Button
                appearance="subtle"
                size="small"
                disabled={loading}
                onClick={() => handleProcesar(true)}
              >
                Importar directamente archivo local: output.csv
              </Button>
            </div>
          </>
        )}

        {/* Estado de carga */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '24px 0' }}>
            <Spinner label="Procesando órdenes, clientes y servicios de Siebel..." />
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Esto puede tomar unos segundos mientras se sincronizan los catálogos y se evalúan las coordenadas...
            </Text>
          </div>
        )}

        {/* Mensaje de error a nivel de red / servicio */}
        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: tokens.colorStatusDangerBackground1, borderRadius: tokens.borderRadiusMedium }}>
            <Warning20Regular style={{ color: tokens.colorStatusDangerForeground1 }} />
            <Text style={{ color: tokens.colorStatusDangerForeground1 }}>{errorMsg}</Text>
          </div>
        )}

        {/* Resumen de resultados */}
        {resultado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {resultado.ordenesCreadas > 0 ? (
                <>
                  <CheckmarkCircle20Regular style={{ color: tokens.colorStatusSuccessForeground1 }} />
                  <Text weight="semibold" size={400} style={{ color: tokens.colorStatusSuccessForeground1 }}>
                    Importación completada: {resultado.ordenesCreadas} órdenes creadas
                  </Text>
                </>
              ) : resultado.totalOrdenesDetectadas > 0 ? (
                <>
                  <Warning20Regular style={{ color: tokens.colorStatusWarningForeground1 }} />
                  <Text weight="semibold" size={400} style={{ color: tokens.colorStatusWarningForeground1 }}>
                    Proceso completado: 0 órdenes creadas ({resultado.ordenesOmitidas} omitidas / ya existentes)
                  </Text>
                </>
              ) : (
                <>
                  <DismissCircle20Regular style={{ color: tokens.colorStatusDangerForeground1 }} />
                  <Text weight="semibold" size={400} style={{ color: tokens.colorStatusDangerForeground1 }}>
                    No se pudieron procesar órdenes del archivo
                  </Text>
                </>
              )}
            </div>

            {/* Tarjetas de Estadísticas */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Órdenes Nuevas Creadas</Text>
                <Text weight="bold" size={500} style={{ color: tokens.colorBrandForeground1 }}>
                  {resultado.ordenesCreadas}
                </Text>
              </div>

              <div className={styles.statCard}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Órdenes Omitidas (Existentes)</Text>
                <Text weight="bold" size={500} style={{ color: tokens.colorNeutralForeground2 }}>
                  {resultado.ordenesOmitidas}
                </Text>
              </div>

              <div className={styles.statCard}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Clientes Registrados</Text>
                <Text weight="bold" size={500}>
                  {resultado.clientesCreados}
                </Text>
              </div>

              <div className={styles.statCard}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Servicios / Trabajos SL</Text>
                <Text weight="bold" size={500}>
                  {resultado.serviciosCreados}
                </Text>
              </div>

              <div className={styles.statCard}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Zonas Operativas</Text>
                <Text weight="bold" size={500}>
                  {resultado.zonasCreadas}
                </Text>
              </div>

              <div className={styles.statCard}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>Técnicos Identificados</Text>
                <Text weight="bold" size={500}>
                  {resultado.tecnicosCreados}
                </Text>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Badge appearance="tint" color="informative">
                Total filas procesadas: {resultado.totalFilas}
              </Badge>
              <Badge appearance="tint" color="brand">
                Total órdenes en archivo: {resultado.totalOrdenesDetectadas}
              </Badge>
            </div>

            {/* Botón para Descargar Reporte de Importación / Errores */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', padding: '10px 14px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: tokens.borderRadiusMedium }}>
              <div>
                <Text weight="semibold" block size={300}>
                  Reporte Detallado de Importación
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  Descargue el archivo CSV con el detalle y estado de cada fila para auditarlo en Excel.
                </Text>
              </div>
              <Button
                appearance="primary"
                icon={<ArrowDownload20Regular />}
                size="small"
                onClick={handleDescargarReporte}
              >
                Descargar Reporte (.csv)
              </Button>
            </div>

            {/* Observaciones generales de error si existen */}
            {resultado.errores && resultado.errores.length > 0 && (
              <div>
                <Text weight="semibold" size={200} style={{ color: tokens.colorStatusDangerForeground1 }}>
                  Observaciones registradas ({resultado.errores.length}):
                </Text>
                <div className={styles.errorList} style={{ marginTop: '4px' }}>
                  {resultado.errores.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla con detalle fila por fila */}
            {resultado.detalles && resultado.detalles.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <Text weight="semibold" size={200}>
                    Detalle por Orden ({detallesFiltrados.length}):
                  </Text>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <Button
                      size="small"
                      appearance={filtroDetalle === 'todos' ? 'primary' : 'subtle'}
                      onClick={() => setFiltroDetalle('todos')}
                    >
                      Todos
                    </Button>
                    <Button
                      size="small"
                      appearance={filtroDetalle === 'creadas' ? 'primary' : 'subtle'}
                      onClick={() => setFiltroDetalle('creadas')}
                    >
                      Creadas ({resultado.detalles.filter(d => d.estado.toLowerCase().includes('creada')).length})
                    </Button>
                    <Button
                      size="small"
                      appearance={filtroDetalle === 'omitidas' ? 'primary' : 'subtle'}
                      onClick={() => setFiltroDetalle('omitidas')}
                    >
                      Omitidas ({resultado.detalles.filter(d => d.estado.toLowerCase().includes('omitida')).length})
                    </Button>
                    <Button
                      size="small"
                      appearance={filtroDetalle === 'errores' ? 'primary' : 'subtle'}
                      onClick={() => setFiltroDetalle('errores')}
                    >
                      Errores ({resultado.detalles.filter(d => d.estado.toLowerCase().includes('error') || d.estado.toLowerCase().includes('invalida')).length})
                    </Button>
                  </div>
                </div>

                <div className={styles.detailsTableContainer}>
                  <div className={`${styles.detailRow} ${styles.detailRowHeader}`}>
                    <div>Fila</div>
                    <div>Orden</div>
                    <div>Cliente / Detalle</div>
                    <div>Estado</div>
                  </div>
                  {detallesFiltrados.slice(0, 100).map((d: FilaDetalleImportacionSiebel, idx: number) => (
                    <div key={idx} className={styles.detailRow}>
                      <span style={{ color: tokens.colorNeutralForeground4 }}>{d.fila}</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{d.numeroOrden}</span>
                      <div>
                        <Text block weight="medium" size={200} truncate>{d.cliente}</Text>
                        <Text size={100} style={{ color: tokens.colorNeutralForeground3 }} truncate title={d.detalle}>
                          {d.detalle}
                        </Text>
                      </div>
                      <div>
                        <Badge
                          appearance="tint"
                          color={getStatusColor(d.estado) as any}
                          size="small"
                        >
                          {d.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {detallesFiltrados.length > 100 && (
                    <div style={{ padding: '8px 12px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                      <Text size={200}>Mostrando las primeras 100 de {detallesFiltrados.length} filas. Descargue el reporte CSV para ver el total.</Text>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DrawerBody>

      <DrawerFooter className={styles.drawerFooter}>
        {resultado ? (
          <>
            <Button
              appearance="secondary"
              onClick={() => {
                setResultado(null);
                setSelectedFile(null);
              }}
            >
              Importar otro archivo
            </Button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                appearance="secondary"
                icon={<ArrowDownload20Regular />}
                onClick={handleDescargarReporte}
              >
                Descargar Reporte
              </Button>
              <Button appearance="primary" onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button appearance="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              icon={<ArrowUpload20Regular />}
              disabled={!selectedFile || loading}
              onClick={() => handleProcesar(false)}
            >
              Importar Archivo
            </Button>
          </>
        )}
      </DrawerFooter>
    </OverlayDrawer>
  );
};
