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
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@fluentui/react-components';
import { D365MessageBar } from './D365MessageBar';
import { useD365ImportStyles } from '../../styles/d365ImportStyles';
import {
  ArrowDownload16Regular,
  DismissRegular,
} from '@fluentui/react-icons';
import type { ImportarExcelResultadoDto } from '../../types/excelImport.types';

const useStyles = makeStyles({
  drawer: {
    width: '560px',
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
    padding: '16px 20px',
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
  messageBarSpacing: { marginBottom: tokens.spacingVerticalM },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  errorTableContainer: {
    maxHeight: '220px',
    overflowY: 'auto',
    marginTop: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  dialogActions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
  },
  actionButton: {
    whiteSpace: 'nowrap',
    minWidth: '96px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export interface ImportarExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  entityName: string;
  onDownloadTemplate: () => Promise<void>;
  onUploadFile: (file: File, actualizarExistentes: boolean) => Promise<ImportarExcelResultadoDto>;
  onSuccess: () => void;
}

export const ImportarExcelDialog: React.FC<ImportarExcelDialogProps> = ({
  open,
  onOpenChange,
  title,
  onDownloadTemplate,
  onUploadFile,
  onSuccess,
}) => {
  const styles = useStyles();
  const importStyles = useD365ImportStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<ImportarExcelResultadoDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleDownload = async () => {
    try {
      setDownloadingTemplate(true);
      setErrorMessage(null);
      await onDownloadTemplate();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al descargar la plantilla.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setErrorMessage(null);
        setResult(null);
      } else {
        setErrorMessage('Por favor seleccione un archivo con formato Excel (.xlsx).');
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setErrorMessage(null);
      setResult(null);
      const res = await onUploadFile(selectedFile, true);
      setResult(res);
      if (res.creados > 0 || res.actualizados > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al procesar el archivo Excel.');
    } finally {
      setUploading(false);
    }
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
          {title}
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.drawerBody}>
            {errorMessage && (
              <D365MessageBar intent="error" title="Error" className={styles.messageBarSpacing}>
                {errorMessage}
              </D365MessageBar>
            )}

            {result && (
              <div className={importStyles.resultColumn}>
                <D365MessageBar
                  intent={
                    result.errores.length === 0
                      ? 'success'
                      : result.creados > 0 || result.actualizados > 0
                      ? 'warning'
                      : 'error'
                  }
                  title={
                    result.errores.length === 0
                      ? 'Importación completada con éxito'
                      : result.creados > 0 || result.actualizados > 0
                      ? 'Importación procesada con observaciones'
                      : 'La importación no pudo registrar los datos'
                  }
                >
                  <>
                    <Text size={200} className={importStyles.neutral}>
                      {result.errores.length === 0
                        ? 'Todos los registros del archivo fueron validados y procesados correctamente.'
                        : 'Se procesaron las filas válidas y se generó un informe detallado con las filas observadas.'}
                    </Text>
                  </>
                </D365MessageBar>

                {/* Resumen numérico tipo SAP / Dynamics */}
                <div className={importStyles.metricsGrid}>
                  <div className={importStyles.column}>
                    <Text size={100} className={importStyles.muted}>Total Filas</Text>
                    <Text size={400} weight="bold">{result.totalFilas}</Text>
                  </div>
                  <div className={importStyles.column}>
                    <Text size={100} className={importStyles.success}>Creados</Text>
                    <Text size={400} weight="bold" className={importStyles.success}>{result.creados}</Text>
                  </div>
                  <div className={importStyles.column}>
                    <Text size={100} className={importStyles.brand}>Actualizados</Text>
                    <Text size={400} weight="bold" className={importStyles.brand}>{result.actualizados}</Text>
                  </div>
                  <div className={importStyles.column}>
                    <Text size={100} className={importStyles.muted}>Omitidos</Text>
                    <Text size={400} weight="bold" className={importStyles.neutral}>{result.omitidos ?? 0}</Text>
                  </div>
                  <div className={importStyles.column}>
                    <Text size={100} className={importStyles.danger}>Incidencias</Text>
                    <Text size={400} weight="bold" className={importStyles.danger}>{result.errores.length}</Text>
                  </div>
                </div>
              </div>
            )}

            {result && result.errores.length > 0 && (
              <div>
                <Text weight="semibold" size={200} className={importStyles.resultHeading}>
                  Informe de incidencias ({result.errores.length} fila{result.errores.length > 1 ? 's' : ''}):
                </Text>
                <div className={styles.errorTableContainer}>
                  <Table size="small">
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell className={importStyles.tableRowNumber}>Fila</TableHeaderCell>
                        <TableHeaderCell className={importStyles.tableCode}>Código</TableHeaderCell>
                        <TableHeaderCell>Motivo / Observación</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.errores.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{err.fila}</TableCell>
                          <TableCell className={importStyles.codeCell}>{err.codigo || '—'}</TableCell>
                          <TableCell>{err.mensaje}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {!result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.formRow}>
                  <label htmlFor="archivo-importacion-excel" style={{ fontSize: '13px', fontWeight: 600 }}>
                    Archivo
                  </label>
                  <input
                    id="archivo-importacion-excel"
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                  {selectedFile && (
                    <small style={{ color: tokens.colorNeutralForeground3, marginTop: '2px' }}>
                      {selectedFile.name} · {(selectedFile.size / 1024).toFixed(1)} KB
                    </small>
                  )}
                </div>

                <div style={{ paddingTop: '8px', borderTop: `1px solid ${tokens.colorNeutralStroke2}` }}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ArrowDownload16Regular />}
                    onClick={handleDownload}
                    disabled={downloadingTemplate || uploading}
                  >
                    {downloadingTemplate ? 'Generando plantilla...' : 'Descargar plantilla Excel (.xlsx)'}
                  </Button>
                </div>
              </div>
            )}
      </DrawerBody>

      <DrawerFooter className={styles.drawerFooter}>
        <Button appearance="secondary" onClick={handleClose} className={styles.actionButton}>
          {result ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!result ? (
          <Button
            appearance="primary"
            onClick={handleImport}
            disabled={!selectedFile || uploading}
            icon={uploading ? <Spinner size="tiny" /> : undefined}
            className={styles.actionButton}
          >
            {uploading ? 'Importando registros...' : 'Iniciar Importación'}
          </Button>
        ) : (
          <Button appearance="primary" onClick={handleReset} className={styles.actionButton}>
            Importar otro archivo
          </Button>
        )}
      </DrawerFooter>
    </OverlayDrawer>
  );
};

export const ImportarExcelDrawer = ImportarExcelDialog;
