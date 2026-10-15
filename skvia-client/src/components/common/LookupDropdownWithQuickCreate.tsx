import React, { useState } from 'react';
import {
  SelectorEntidadRelacionada,
  type SelectorEntidadRelacionadaProps,
} from './SelectorEntidadRelacionada';

export interface ContextoCreacionRapida {
  abierto: boolean;
  nombreInicial: string;
  cerrar: () => void;
}

export interface LookupDropdownWithQuickCreateProps
  extends Omit<SelectorEntidadRelacionadaProps, 'alCrearNuevo'> {
  renderizarCreacionRapida: (contexto: ContextoCreacionRapida) => React.ReactNode;
  puedeCrear?: boolean;
}

/** Lookup empresarial con una única acción Nuevo que abre creación rápida lateral. */
export const LookupDropdownWithQuickCreate: React.FC<LookupDropdownWithQuickCreateProps> = ({
  renderizarCreacionRapida,
  puedeCrear = true,
  ...propiedadesSelector
}) => {
  const [abierto, setAbierto] = useState(false);
  const [nombreInicial, setNombreInicial] = useState('');

  return (
    <>
      <SelectorEntidadRelacionada
        {...propiedadesSelector}
        alCrearNuevo={puedeCrear ? (nombre) => {
          setNombreInicial(nombre);
          setAbierto(true);
        } : undefined}
      />
      {renderizarCreacionRapida({
        abierto,
        nombreInicial,
        cerrar: () => {
          setAbierto(false);
          setNombreInicial('');
        },
      })}
    </>
  );
};

export default LookupDropdownWithQuickCreate;
