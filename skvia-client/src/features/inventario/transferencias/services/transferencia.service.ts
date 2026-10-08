import { apiClient } from '../../../../services/apiClient';
import type {
  CrearTransferenciaDto,
  RecepcionarTransferenciaDto,
  TransferenciaCreadaRespuestaDto,
  TransferenciaDetalladaDto,
  TransferenciaInventarioDto,
} from '../types/transferencia.types';

export const TransferenciaService = {
  resolver: (id:string,datos:{detalleId:string;cantidad:number;resultado:number;motivo:string;evidencia:string;series:string[];operacionId:string}) => apiClient(`/api/inventario/transferencias/${id}/resolver`,{method:'POST',body:JSON.stringify(datos)}),
  obtener: () => apiClient<TransferenciaInventarioDto[]>('/api/inventario/transferencias'),

  obtenerDetalle: (id: string) => apiClient<TransferenciaDetalladaDto>(`/api/inventario/transferencias/${id}`),

  crear: (datos: CrearTransferenciaDto) =>
    apiClient<TransferenciaCreadaRespuestaDto>('/api/inventario/transferencias', {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  recepcionar: (id: string, datos: RecepcionarTransferenciaDto) =>
    apiClient<{ numeroRecepcion: string }>(`/api/inventario/transferencias/${id}/recepcionar`, {
      method: 'POST',
      body: JSON.stringify(datos),
    }),

  eliminar: (id: string) =>
    apiClient<void>(`/api/inventario/transferencias/${id}`, {
      method: 'DELETE',
    }),

  descargarCargoPdf: async (id: string, numero?: string) => {
    const token = await import('../../../../services/apiClient').then(m => m.getValidAuthToken());
    const res = await fetch(`/api/inventario/transferencias/${id}/cargo-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo generar o descargar el cargo en PDF.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cargo-${numero || id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  abrirCargoPdf: async (id: string) => {
    const token = await import('../../../../services/apiClient').then(m => m.getValidAuthToken());
    const res = await fetch(`/api/inventario/transferencias/${id}/cargo-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo abrir el cargo en PDF.');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  },

  compartirCargoWhatsapp: async (
    id: string,
    numero?: string,
    opciones?: {
      telefono?: string;
      destinatario?: string;
      tipoOperacion?: string;
    }
  ) => {
    const token = await import('../../../../services/apiClient').then((m) => m.getValidAuthToken());
    const res = await fetch(`/api/inventario/transferencias/${id}/cargo-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo generar el cargo en PDF.');
    const blob = await res.blob();
    const fileName = `Cargo-${numero || id}.pdf`;
    const file = new File([blob], fileName, { type: 'application/pdf' });

    const tipo = opciones?.tipoOperacion || 'Despacho / Cargo Oficial';
    const lines = [
      `*CARGO OFICIAL - SKVIA*`,
      `*Operación:* ${tipo}`,
      `*N° Documento:* ${numero || id}`,
    ];
    if (opciones?.destinatario) {
      lines.push(`*Destinatario:* ${opciones.destinatario}`);
    }
    lines.push(
      `*Fecha:* ${new Date().toLocaleDateString('es-PE')}`,
      `\nHola, te comparto el documento oficial correspondiente.`
    );
    const mensajeTexto = lines.join('\n');

    // 1. Si el navegador soporta compartir archivos nativamente (móviles y navegadores modernos)
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Cargo Oficial - ${numero || id}`,
          text: mensajeTexto,
          files: [file],
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('Web Share no disponible o cancelado, usando fallback a WhatsApp Web:', err);
      }
    }

    // 2. Fallback para escritorio / navegadores estándar:
    // Se descarga el archivo PDF para adjuntarlo fácilmente
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);

    // Abrir WhatsApp con el mensaje estructurado
    let phoneParam = '';
    if (opciones?.telefono) {
      let rawPhone = opciones.telefono.replace(/\D/g, '');
      if (rawPhone.length === 9 && rawPhone.startsWith('9')) {
        rawPhone = `51${rawPhone}`;
      }
      if (rawPhone) {
        phoneParam = `phone=${rawPhone}&`;
      }
    }

    const mensajeWhatsApp = `${mensajeTexto}\n\n_(El archivo "${fileName}" se ha descargado en tu equipo para adjuntarlo en esta conversación)._`;
    const waUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(mensajeWhatsApp)}`;
    window.open(waUrl, '_blank');
  },
};
