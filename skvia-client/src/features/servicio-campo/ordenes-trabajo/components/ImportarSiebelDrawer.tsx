import React, { useState, useRef } from 'react';
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
  DocumentArrowUp20Regular,
} from '@fluentui/react-icons';
import { OrdenTrabajoService } from '../services/ordenTrabajo.service';
import type { ResultadoImportacionSiebel } from '../types/ordenTrabajo.types';

const useStyles = makeStyles({
  drawer: {
    width: '600px',
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
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
    marginTop: '12px',
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
    maxHeight: '160px',
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: tokens.colorStatusDangerBackground1,
    border: `1px solid ${tokens.colorStatusDangerBorder1}`,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorStatusDangerForeground1,
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
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al importar el archivo.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResultado(null);
    setErrorMsg(null);
    onOpenChange(false);
  };

  return (
    <OverlayDrawer
      open={open}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, state) => onOpenChange(state.open)}
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
        <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
          Cargue la exportación de órdenes de trabajo de DIRECTV / Siebel (formato TSV o CSV con codificación UTF-16LE o UTF-8).
          El importador agrupará múltiples tareas por orden, registrará a los clientes, configurará los servicios con sus puntos y asignará técnicos.
        </Text>

        {/* Zona de selección de archivo */}
        <div
          className={styles.dropZone}
          onClick={() => fileInputRef.current?.click()}
        >
          <DocumentArrowUp20Regular style={{ fontSize: '36px', color: tokens.colorBrandForeground1 }} />
          <Text weight="semibold">
            {selectedFile ? selectedFile.name : 'Haga clic para seleccionar archivo .csv / .tsv'}
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
            {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Archivos exportados desde Siebel CRM'}
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Botón rápido para ruta local output.csv */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            appearance="subtle"
            size="small"
            disabled={loading}
            onClick={() => handleProcesar(true)}
          >
            Importar directamente archivo local: output.csv
          </Button>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px' }}>
            <Spinner label="Procesando órdenes, clientes y servicios de Siebel..." />
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Esto puede tomar unos segundos mientras se sincronizan los catálogos...
            </Text>
          </div>
        )}

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: tokens.colorStatusDangerBackground1, borderRadius: tokens.borderRadiusMedium }}>
            <Warning20Regular style={{ color: tokens.colorStatusDangerForeground1 }} />
            <Text style={{ color: tokens.colorStatusDangerForeground1 }}>{errorMsg}</Text>
          </div>
        )}

        {/* Resumen de resultados */}
        {resultado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckmarkCircle20Regular style={{ color: tokens.colorStatusSuccessForeground1 }} />
              <Text weight="semibold" size={400}>Importación completada con éxito</Text>
            </div>

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

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <Badge appearance="tint" color="informative">
                Total filas procesadas: {resultado.totalFilas}
              </Badge>
              <Badge appearance="tint" color="brand">
                Total órdenes en archivo: {resultado.totalOrdenesDetectadas}
              </Badge>
            </div>

            {resultado.errores && resultado.errores.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <Text weight="semibold" size={200}>Observaciones registradas:</Text>
                <div className={styles.errorList}>
                  {resultado.errores.map((err, idx) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DrawerBody>

      <DrawerFooter className={styles.drawerFooter}>
        <Button appearance="secondary" onClick={handleClose}>
          {resultado ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!resultado && (
          <Button
            appearance="primary"
            icon={<ArrowUpload20Regular />}
            disabled={!selectedFile || loading}
            onClick={() => handleProcesar(false)}
          >
            Importar Archivo
          </Button>
        )}
      </DrawerFooter>
    </OverlayDrawer>
  );
};
