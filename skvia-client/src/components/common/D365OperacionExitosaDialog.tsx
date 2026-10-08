import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  DialogActions,
  Text,
  Badge,
  tokens,
} from '@fluentui/react-components';
import {
  CheckmarkCircle24Filled,
  Copy16Regular,
  Person16Regular,
  Building16Regular,
  Box16Regular,
  ArrowDownload16Regular,
  Print16Regular,
  Add16Regular,
  ArrowRight16Regular,
} from '@fluentui/react-icons';
import { WhatsAppIcon } from './WhatsAppIcon';

export interface OperacionExitosaDatos {
  id?: string;
  numero: string;
  tipoOperacion?: 'Despacho' | 'Devolucion' | 'Transferencia';
  personaNombre?: string;
  personaRol?: string;
  almacenNombre?: string;
  almacenRol?: string;
  guiaRemision?: string;
  totalItems?: number;
  totalLineas?: number;
}

export interface D365OperacionExitosaDialogProps {
  open: boolean;
  datos: OperacionExitosaDatos | null;
  onClose: () => void;
  onDescargarPdf: () => void;
  onImprimir: () => void;
  onCompartirWhatsApp: () => void;
  onNuevaOperacion: () => void;
  onIrHistorial: () => void;
}

export const D365OperacionExitosaDialog: React.FC<D365OperacionExitosaDialogProps> = ({
  open,
  datos,
  onClose,
  onDescargarPdf,
  onImprimir,
  onCompartirWhatsApp,
  onNuevaOperacion,
  onIrHistorial,
}) => {
  const [copiado, setCopiado] = useState(false);

  if (!datos) return null;

  const esDevolucion = datos.tipoOperacion === 'Devolucion';
  const titulo = esDevolucion ? '¡Devolución Procesada con Éxito!' : '¡Despacho Registrado con Éxito!';
  const subtitulo = esDevolucion
    ? 'Las existencias y números de serie han reingresado oficialmente al stock de la bodega.'
    : 'El material y los números de serie ahora se encuentran bajo custodia del técnico.';

  const docTitulo = esDevolucion ? 'Acta N°' : 'Operación N°';
  const personaEtiqueta = esDevolucion ? 'Técnico Emisor' : 'Técnico Receptor';
  const almacenEtiqueta = esDevolucion ? 'Bodega Receptora' : 'Bodega Origen';
  const accionDocTitulo = esDevolucion
    ? 'Acta Oficial de Devolución (Para archivo y firmas)'
    : 'Cargo Oficial de Custodia (Para firma y constancia)';
  const botonNuevoTexto = esDevolucion ? 'Nueva devolución' : 'Nuevo despacho';

  const handleCopiar = () => {
    if (datos.numero) {
      void navigator.clipboard.writeText(datos.numero);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface style={{ maxWidth: '520px', width: '100%', padding: '0', borderRadius: tokens.borderRadiusXLarge, overflow: 'hidden' }}>
        <DialogBody style={{ padding: '0', margin: '0' }}>
          {/* Header con acento verde de éxito usando 100% tokens oficiales de Fluent UI */}
          <div
            style={{
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: tokens.colorPaletteGreenBackground2,
              padding: '20px 24px',
              borderBottom: `1px solid ${tokens.colorPaletteGreenBorder2}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: tokens.borderRadiusCircular,
                backgroundColor: tokens.colorPaletteGreenBackground1,
                color: tokens.colorPaletteGreenForeground1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: tokens.shadow4,
              }}
            >
              <CheckmarkCircle24Filled style={{ fontSize: '26px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text weight="bold" size={500} style={{ color: tokens.colorPaletteGreenForeground1, display: 'block', lineHeight: 1.25 }}>
                {titulo}
              </Text>
              <Text size={200} style={{ color: tokens.colorPaletteGreenForeground2, marginTop: '2px', display: 'block' }}>
                {subtitulo}
              </Text>
            </div>
          </div>

          <DialogContent style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tarjeta de Resumen / Comprobante */}
            <div
              style={{
                border: `1px solid ${tokens.colorNeutralStroke2}`,
                borderRadius: tokens.borderRadiusMedium,
                backgroundColor: tokens.colorNeutralBackground2,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Cabecera del Comprobante */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text size={100} weight="semibold" style={{ textTransform: 'uppercase', color: tokens.colorNeutralForeground3, letterSpacing: '0.5px' }}>
                    {docTitulo}
                  </Text>
                  <Text weight="bold" size={400} style={{ fontFamily: 'monospace', color: tokens.colorBrandForeground1 }}>
                    {datos.numero}
                  </Text>
                </div>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Copy16Regular />}
                  onClick={handleCopiar}
                >
                  {copiado ? 'Copiado' : 'Copiar'}
                </Button>
              </div>

              <div style={{ height: '1px', backgroundColor: tokens.colorNeutralStroke3 }} />

              {/* Grilla de metadatos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: 'uppercase' }}>
                    {personaEtiqueta}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Person16Regular style={{ color: tokens.colorNeutralForeground3 }} />
                    <Text size={200} weight="semibold" truncate>
                      {datos.personaNombre || 'Técnico'}
                    </Text>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: 'uppercase' }}>
                    {almacenEtiqueta}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building16Regular style={{ color: tokens.colorNeutralForeground3 }} />
                    <Text size={200} weight="semibold" truncate>
                      {datos.almacenNombre || 'Bodega Central'}
                    </Text>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: 'uppercase' }}>
                    Materiales
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Box16Regular style={{ color: tokens.colorNeutralForeground3 }} />
                    <Text size={200} weight="semibold">
                      {datos.totalItems ?? 0} {Number(datos.totalItems) === 1 ? 'unidad' : 'unidades'} ({datos.totalLineas ?? 0} {Number(datos.totalLineas) === 1 ? 'material' : 'materiales'})
                    </Text>
                  </div>
                </div>

                {datos.guiaRemision ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: 'uppercase' }}>
                      Guía de Remisión
                    </Text>
                    <Text size={200} weight="semibold" style={{ fontFamily: 'monospace' }}>
                      {datos.guiaRemision}
                    </Text>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: 'uppercase' }}>
                      Estado
                    </Text>
                    <Badge appearance="tint" color="success" shape="rounded" size="small" style={{ alignSelf: 'flex-start' }}>
                      Cerrada / Conforme
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones de Documentación Oficial */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
                {accionDocTitulo}
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <Button
                  appearance="primary"
                  size="medium"
                  style={{ whiteSpace: 'nowrap' }}
                  icon={<ArrowDownload16Regular />}
                  onClick={onDescargarPdf}
                >
                  Descargar (PDF)
                </Button>
                <Button
                  appearance="secondary"
                  size="medium"
                  style={{ whiteSpace: 'nowrap' }}
                  icon={<Print16Regular />}
                  onClick={onImprimir}
                >
                  Imprimir
                </Button>
                <Button
                  appearance="secondary"
                  size="medium"
                  style={{ whiteSpace: 'nowrap' }}
                  icon={<WhatsAppIcon size={16} />}
                  onClick={onCompartirWhatsApp}
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          </DialogContent>

          {/* Acciones del Footer usando DialogActions nativo */}
          <DialogActions
            style={{
              padding: '14px 24px',
              borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
              backgroundColor: tokens.colorNeutralBackground1,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
              margin: 0,
            }}
          >
            <Button
              appearance="subtle"
              icon={<Add16Regular />}
              style={{ whiteSpace: 'nowrap' }}
              onClick={onNuevaOperacion}
            >
              {botonNuevoTexto}
            </Button>
            <Button
              appearance="primary"
              icon={<ArrowRight16Regular />}
              iconPosition="after"
              style={{ whiteSpace: 'nowrap' }}
              onClick={onIrHistorial}
            >
              Ir al historial
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
