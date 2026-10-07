import React from 'react';
import { Link, Tag, makeStyles, tokens } from '@fluentui/react-components';

const usarEstilos = makeStyles({
  enlace: {
    color: tokens.colorBrandForegroundLink,
    fontWeight: tokens.fontWeightSemibold,
    textDecorationLine: 'none',
    ':hover': { textDecorationLine: 'underline' },
  },
});

export interface EnlaceEntidadProps {
  id: string;
  nombre: string;
  icono?: React.ReactElement;
  alNavegar?: (id: string) => void;
  alEliminar?: (id: string) => void;
  titulo?: string;
}

/** Etiqueta reutilizable que identifica una entidad relacionada y permite abrir su detalle. */
export const EnlaceEntidad: React.FC<EnlaceEntidadProps> = ({
  id,
  nombre,
  icono,
  alNavegar,
  alEliminar,
  titulo,
}) => {
  const estilos = usarEstilos();

  return (
    <Tag
      key={id}
      shape="rounded"
      size="small"
      media={icono}
      value={id}
      dismissible={Boolean(alEliminar)}
      dismissIcon={
        alEliminar
          ? {
              onClick: (evento: React.MouseEvent) => {
                evento.stopPropagation();
                alEliminar(id);
              },
            }
          : undefined
      }
    >
      {alNavegar ? (
        <Link
          as="span"
          className={estilos.enlace}
          title={titulo || `Abrir ${nombre}`}
          onClick={(evento) => {
            evento.stopPropagation();
            alNavegar(id);
          }}
        >
          {nombre}
        </Link>
      ) : (
        nombre
      )}
    </Tag>
  );
};

export default EnlaceEntidad;
