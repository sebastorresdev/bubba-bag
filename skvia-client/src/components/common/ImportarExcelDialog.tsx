import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Spinner,
  Text,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  tokens,
  makeStyles,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from '@fluentui/react-components';
import {
  ArrowDownload16Regular,
  ArrowUpload24Regular,
  DismissRegular,
  DocumentCheckmark24Regular,
  Delete16Regular,
} from '@fluentui/react-icons';
import type { ImportarExcelResultadoDto } from '../../types/excelImport.types';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '580px',
    width: '100%',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '12px',
  },
  stepCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  dropZone: {
    border: `2px dashed ${tokens.colorBrandStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  dropZoneActive: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `2px dashed ${tokens.colorBrandStroke2}`,
  },
  fileSelectedInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  errorTableContainer: {
    maxHeight: '180px',
    overflowY: 'auto',
    marginTop: '10px',
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
  onUploadFile: (file: File) => Promise<ImportarExcelResultadoDto>;
  onSuccess: () => void;
}

export const ImportarExcelDialog: React.FC<ImportarExcelDialogProps> = ({
  open,
  onOpenChange,
  title,
  entityName,
  onDownloadTemplate,
  onUploadFile,
  onSuccess,
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<ImportarExcelResultadoDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
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
      const res = await onUploadFile(selectedFile);
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
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogTitle
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
        </DialogTitle>

        <DialogBody>
          <DialogContent>
            {errorMessage && (
              <MessageBar intent="error" shape="square" style={{ marginBottom: 12 }}>
                <MessageBarBody>
                  <MessageBarTitle>Error</MessageBarTitle>
                  {errorMessage}
                </MessageBarBody>
              </MessageBar>
            )}

            {result && (
              <MessageBar
                intent={result.exitoso ? 'success' : result.creados > 0 || result.actualizados > 0 ? 'warning' : 'error'}
                shape="square"
                style={{ marginBottom: 14 }}
              >
                <MessageBarBody>
                  <MessageBarTitle>
                    {result.exitoso
                      ? 'Importación completada con éxito'
                      : 'Importación procesada con observaciones'}
                  </MessageBarTitle>
                  <div style={{ marginTop: 4 }}>
                    <Text size={200}>
                      Registros creados: <strong>{result.creados}</strong> | Registros actualizados: <strong>{result.actualizados}</strong>
                      {result.errores.length > 0 && ` | Filas con error: ${result.errores.length}`}
                    </Text>
                  </div>
                </MessageBarBody>
              </MessageBar>
            )}

            {result && result.errores.length > 0 && (
              <div className={styles.errorTableContainer}>
                <Table size="small">
                  <TableHeader>
                    <TableRow>
                      <TableHeaderCell style={{ width: '60px' }}>Fila</TableHeaderCell>
                      <TableHeaderCell style={{ width: '100px' }}>Código</TableHeaderCell>
                      <TableHeaderCell>Detalle del error</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errores.map((err, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{err.fila}</TableCell>
                        <TableCell>{err.codigo || '—'}</TableCell>
                        <TableCell>{err.mensaje}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!result && (
              <div className={styles.stepContainer}>
                {/* Paso 1: Descargar Plantilla */}
                <div className={styles.stepCard}>
                  <Text weight="semibold" size={300}>
                    Paso 1: Descargar plantilla con listas desplegables
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Descarga la plantilla oficial configurada para {entityName}. Incluye listas de validación y selectores desplegables para evitar errores de escritura.
                  </Text>
                  <div>
                    <Button
                      appearance="outline"
                      size="medium"
                      icon={<ArrowDownload16Regular />}
                      onClick={handleDownload}
                      disabled={downloadingTemplate || uploading}
                    >
                      {downloadingTemplate ? 'Generando plantilla...' : 'Descargar plantilla Excel (.xlsx)'}
                    </Button>
                  </div>
                </div>

                {/* Paso 2: Subir Archivo */}
                <div className={styles.stepCard}>
                  <Text weight="semibold" size={300}>
                    Paso 2: Cargar archivo completado
                  </Text>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />

                  {!selectedFile ? (
                    <div
                      className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <ArrowUpload24Regular style={{ color: tokens.colorCompoundBrandForeground1, fontSize: 32 }} />
                      <Text weight="semibold" size={300}>
                        Haz clic aquí o arrastra tu archivo Excel
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
                        Archivos compatibles: .xlsx o .xls
                      </Text>
                    </div>
                  ) : (
                    <div className={styles.fileSelectedInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <DocumentCheckmark24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
                        <div>
                          <Text weight="semibold" size={300} block>
                            {selectedFile.name}
                          </Text>
                          <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </Text>
                        </div>
                      </div>
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<Delete16Regular />}
                        onClick={handleReset}
                        title="Quitar archivo"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>

          <DialogActions className={styles.dialogActions}>
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
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
