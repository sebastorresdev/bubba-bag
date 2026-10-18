import React, { useRef, useState } from 'react';
import {
  Button,
  Spinner,
  Text,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Attach16Regular,
  Camera16Regular,
  Delete16Regular,
  Eye16Regular,
  DocumentPdf16Regular,
  CheckmarkCircle16Filled,
  Warning16Filled,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    border: `1px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  thumbnail: {
    width: '48px',
    height: '48px',
    objectFit: 'cover',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'pointer',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flex: 1,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '75vh',
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto',
    borderRadius: tokens.borderRadiusMedium,
  },
});

interface DocumentoRespaldoUploadProps {
  url?: string | null;
  onUrlChange?: (url: string | null) => void;
  disabled?: boolean;
  titulo?: string;
  descripcion?: string;
}

export const DocumentoRespaldoUpload: React.FC<DocumentoRespaldoUploadProps> = ({
  url,
  onUrlChange,
  disabled = false,
  titulo = 'Documento de Respaldo Firmado',
  descripcion = 'Adjunte la foto o PDF de la guía/acta firmada por quien entrega o recibe como respaldo legal.',
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const esPdf = url?.toLowerCase().endsWith('.pdf');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo seleccionado supera el límite de 10 MB.');
      return;
    }

    try {
      setSubiendo(true);
      setError(null);

      const formData = new FormData();
      formData.append('archivo', file);

      // Usar apiClient o fetch nativo con auth
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/inventario/archivos/subir', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || 'Error al subir el archivo de respaldo.');
      }

      const data = await response.json();
      if (onUrlChange) {
        onUrlChange(data.url);
      }
    } catch (err: any) {
      setError(err.message || 'Error de red al cargar el documento.');
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEliminar = () => {
    if (onUrlChange) {
      onUrlChange(null);
    }
  };

  return (
    <div className={styles.container}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        style={{ display: 'none' }}
        disabled={disabled || subiendo}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text weight="semibold" size={300} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Camera16Regular />
            <span>{titulo}</span>
          </Text>
          <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 }}>
            {descripcion}
          </div>
        </div>

        {!url && !disabled && (
          <Button
            appearance="primary"
            icon={<Attach16Regular />}
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendo}
          >
            {subiendo ? 'Subiendo...' : 'Adjuntar Foto / Acta'}
          </Button>
        )}
      </div>

      {subiendo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px' }}>
          <Spinner size="small" />
          <Text size={200}>Subiendo archivo de respaldo...</Text>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colorPaletteRedForeground1 }}>
          <Warning16Filled />
          <Text size={200}>{error}</Text>
        </div>
      )}

      {url && !subiendo && (
        <div className={styles.previewRow}>
          <div className={styles.fileInfo}>
            {esPdf ? (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: tokens.colorPaletteRedBackground1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: tokens.borderRadiusSmall,
                }}
              >
                <DocumentPdf16Regular style={{ fontSize: '24px', color: tokens.colorPaletteRedForeground1 }} />
              </div>
            ) : (
              <img
                src={url}
                alt="Documento de respaldo firmado"
                className={styles.thumbnail}
                onClick={() => setPreviewOpen(true)}
              />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckmarkCircle16Filled style={{ color: tokens.colorPaletteGreenForeground1 }} />
                <Text weight="semibold" size={300}>
                  {esPdf ? 'Documento PDF Firmado' : 'Fotografía / Escaneo Firmado'}
                </Text>
              </div>
              <div style={{ fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3 }}>
                Respaldo adjuntado correctamente
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            {esPdf ? (
              <Button
                appearance="subtle"
                size="small"
                icon={<Eye16Regular />}
                onClick={() => window.open(url, '_blank')}
              >
                Abrir PDF
              </Button>
            ) : (
              <Button
                appearance="subtle"
                size="small"
                icon={<Eye16Regular />}
                onClick={() => setPreviewOpen(true)}
              >
                Ver Foto
              </Button>
            )}

            {!disabled && (
              <Button
                appearance="subtle"
                size="small"
                icon={<Delete16Regular />}
                onClick={handleEliminar}
                title="Quitar respaldo"
              />
            )}
          </div>
        </div>
      )}

      {/* Modal para ver imagen en tamaño completo */}
      <Dialog open={previewOpen} onOpenChange={(_, d) => setPreviewOpen(d.open)}>
        <DialogSurface style={{ maxWidth: '85vw', width: 'auto' }}>
          <DialogTitle>Documento de Respaldo Firmado</DialogTitle>
          <DialogBody>
            <DialogContent>
              {url && !esPdf && (
                <img src={url} alt="Vista previa del comprobante" className={styles.modalImage} />
              )}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => window.open(url!, '_blank')}>
                Abrir en nueva pestaña
              </Button>
              <Button appearance="primary" onClick={() => setPreviewOpen(false)}>
                Cerrar
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
