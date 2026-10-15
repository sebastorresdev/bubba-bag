import { ListaPreciosService } from './listaPrecios.service';
import type { CreateListaPreciosDto, ElementoListaPreciosDto } from '../types/listaPrecios.types';

export interface ListaPreciosPendiente {
  id?: string;
  elementos: Map<string, { id: string; snapshot: string }>;
}

/** Conserva confirmaciones parciales para reintentar sin crear otra lista ni repetir precios. */
export async function guardarListaNuevaPendiente(context: ListaPreciosPendiente, datos: CreateListaPreciosDto, elementos: ElementoListaPreciosDto[], api = ListaPreciosService) {
  if (!context.id) context.id = (await api.createListaPrecios(datos)).id;
  else await api.updateListaPrecios(context.id, datos);
  for (const [localId, guardado] of context.elementos) {
    if (!elementos.some(item => item.id === localId)) {
      await api.eliminarElemento(guardado.id);
      context.elementos.delete(localId);
    }
  }
  for (const item of elementos) {
    const payload = { productoId: item.productoId, monto: item.monto, unidadMedidaId: item.unidadMedidaId || null, metodoFijacion: item.metodoFijacion };
    const snapshot = JSON.stringify(payload);
    const previous = context.elementos.get(item.id);
    if (previous?.snapshot === snapshot) continue;
    const result = await api.guardarElemento(context.id, { ...payload, elementoId: previous?.id });
    context.elementos.set(item.id, { id: result.id, snapshot });
  }
  return { id: context.id };
}
