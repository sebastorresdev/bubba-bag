import React from 'react';
import { Link, Tag } from '@fluentui/react-components';

export interface EnlaceEntidadProps {
  id: string;
  nombre: string;
  icono?: React.ReactElement;
  alNavegar?: (id: string) => void;
  alEliminar?: (id: string) => void;
  titulo?: string;
  esLink?: boolean;
}

/**
 * Componente que combina el Tag nativo de Fluent UI con funcionalidad de enlace (Link)
 * para entidades relacionadas en selectores y formularios.
 */
export const EnlaceEntidad: React.FC<EnlaceEntidadProps> = ({
  id,
  nombre,
  icono,
  alNavegar,
  alEliminar,
  titulo,
  esLink = true,
}) => {
  const handleTagClick = (evento: React.MouseEvent) => {
    if ((evento.target as HTMLElement).closest('.fui-Tag__dismissIcon')) {
      return;
    }
    if (alNavegar) {
      evento.stopPropagation();
      alNavegar(id);
    }
  };

  return (
    <Tag
      key={id}
      appearance="brand"
      shape="rounded"
      size="small"
      media={icono}
      value={id}
      onClick={alNavegar ? handleTagClick : undefined}
      dismissible={Boolean(alEliminar)}
      dismissIcon={
        alEliminar
          ? {
              'aria-label': `Eliminar ${nombre}`,
              onClick: (evento: React.MouseEvent) => {
                evento.stopPropagation();
                alEliminar(id);
              },
            }
          : undefined
      }
    >
      {alNavegar && esLink ? (
        <Link
          as="span"
          title={titulo || `Abrir ${nombre}`}
          style={{
            color: 'inherit',
            cursor: 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
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

