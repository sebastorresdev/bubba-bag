import React from 'react';
import { UnidadMedidaFormPage, type UnidadMedidaFormPageProps } from './UnidadMedidaFormPage';

/** Página de detalle del grupo; conserva el alias anterior para compatibilidad de rutas. */
export const GrupoUnidadDetallePage: React.FC<UnidadMedidaFormPageProps> = (propiedades) => (
  <UnidadMedidaFormPage {...propiedades} />
);

export default GrupoUnidadDetallePage;
