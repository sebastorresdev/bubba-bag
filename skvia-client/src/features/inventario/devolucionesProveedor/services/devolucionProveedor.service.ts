import { apiClient } from '../../../../services/apiClient';
import type {
  DevolucionProveedorDto,
  CrearDevolucionProveedorInput,
  ActualizarDevolucionProveedorInput,
} from '../types/devolucionProveedor.types';

export const DevolucionProveedorService = {
  obtenerTodas: (almacenId?: string) => {
    const query = almacenId ? `?almacenId=${almacenId}` : '';
    return apiClient<DevolucionProveedorDto[]>(`/api/inventario/devoluciones-proveedor${query}`);
  },

  obtenerPorId: (id: string) => {
    return apiClient<DevolucionProveedorDto>(`/api/inventario/devoluciones-proveedor/${id}`);
  },

  crear: (input: CrearDevolucionProveedorInput) => {
    return apiClient<{ id: string }>('/api/inventario/devoluciones-proveedor', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  actualizar: (id: string, input: ActualizarDevolucionProveedorInput) => {
    return apiClient<void>(`/api/inventario/devoluciones-proveedor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  completar: (id: string) => {
    return apiClient<void>(`/api/inventario/devoluciones-proveedor/${id}/completar`, {
      method: 'POST',
    });
  },

  eliminar: (id: string) => {
    return apiClient<void>(`/api/inventario/devoluciones-proveedor/${id}`, {
      method: 'DELETE',
    });
  },

  descargarCargoPdf: async (id: string, numero?: string) => {
    const token = await import('../../../../services/apiClient').then((m) => m.getValidAuthToken());
    const res = await fetch(`/api/inventario/devoluciones-proveedor/${id}/cargo-pdf`, {
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
    const token = await import('../../../../services/apiClient').then((m) => m.getValidAuthToken());
    const res = await fetch(`/api/inventario/devoluciones-proveedor/${id}/cargo-pdf`, {
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
      destinatario?: string;
      tipoOperacion?: string;
    }
  ) => {
    const token = await import('../../../../services/apiClient').then((m) => m.getValidAuthToken());
    const res = await fetch(`/api/inventario/devoluciones-proveedor/${id}/cargo-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo generar el cargo en PDF.');
    const blob = await res.blob();
    const fileName = `Cargo-${numero || id}.pdf`;
    const file = new File([blob], fileName, { type: 'application/pdf' });

    const tipo = opciones?.tipoOperacion || 'Retiro de Material a Operador Logístico';
    const lines = [
      `*ACTA OFICIAL DE RETIRO / DEVOLUCIÓN A PROVEEDOR*`,
      `*Operación:* ${tipo}`,
      `*N° Documento:* ${numero || id}`,
    ];
    if (opciones?.destinatario) {
      lines.push(`*Destinatario:* ${opciones.destinatario}`);
    }
    lines.push(
      `*Fecha:* ${new Date().toLocaleDateString('es-PE')}`,
      `\nHola, se adjunta el acta y cargo oficial correspondiente al retiro de materiales.`
    );
    const mensajeTexto = lines.join('\n');

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Acta Oficial - ${numero || id}`,
          text: mensajeTexto,
          files: [file],
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.warn('Web Share no disponible o cancelado:', err);
      }
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    const urlWhatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensajeTexto)}`;
    window.open(urlWhatsapp, '_blank');
  },

  compartirCargoCorreo: (
    id: string,
    numero?: string,
    opciones?: {
      destinatario?: string;
      email?: string;
      tipoOperacion?: string;
    }
  ) => {
    const tipo = opciones?.tipoOperacion || 'Acta Oficial de Retiro / Devolución';
    const num = numero || id;
    const asunto = `${tipo} - ${num}`;
    const cuerpo = [
      `Estimado(a)${opciones?.destinatario ? ` ${opciones.destinatario}` : ''},`,
      '',
      `Se remite la constancia oficial correspondiente a la operación de retiro:`,
      `• Tipo: ${tipo}`,
      `• N° Documento: ${num}`,
      `• Fecha: ${new Date().toLocaleDateString('es-PE')}`,
      '',
      'Saludos cordiales,',
      'Equipo de Logística Inversa - SKVIA',
    ].filter(Boolean).join('\n');

    const mailto = `mailto:${opciones?.email || ''}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = mailto;
  },
};
