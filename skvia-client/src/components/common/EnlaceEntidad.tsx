import React from 'react';
import { Link, Tag, makeStyles, tokens } from '@fluentui/react-components';

const usarEstilos = makeStyles({
  tagBrand: {
    backgroundColor: tokens.colorBrandBackground2,
    borderTopStyle: 'none',
    borderRightStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRadius: tokens.borderRadiusMedium,
    color: tokens.colorBrandForeground1,
    cursor: 'pointer',
    transitionProperty: 'background-color, color',
    transitionDuration: tokens.durationFaster,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
    },
    // Media / Icono de entidad con tono de marca
    '& .fui-Tag__media': {
      color: tokens.colorBrandForeground1,
      display: 'inline-flex',
      alignItems: 'center',
    },
    // Texto primario
    '& .fui-Tag__primaryText': {
      color: tokens.colorBrandForeground1,
    },
    // Icono de eliminación (✕) estilizado con tono de marca
    '& .fui-Tag__dismissIcon': {
      color: tokens.colorBrandForeground1,
      ':hover': {
        color: tokens.colorBrandForeground1,
        backgroundColor: tokens.colorBrandBackground2Pressed,
      },
    },
  },
  enlace: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightRegular,
    textDecorationLine: 'none',
    ':hover': {
      color: tokens.colorBrandForegroundLinkHover,
      textDecorationLine: 'underline',
    },
  },
});

export interface EnlaceEntidadProps {
  id: string;
  nombre: string;
  icono?: React.ReactElement;
  alNavegar?: (id: string) => void;
  alEliminar?: (id: string) => void;
  titulo?: string;
  esLink?: boolean;
}

/** Etiqueta reutilizable con diseño Dynamics 365 que identifica una entidad relacionada con tono primario. */
export const EnlaceEntidad: React.FC<EnlaceEntidadProps> = ({
  id,
  nombre,
  icono,
  alNavegar,
  alEliminar,
  titulo,
  esLink = true,
}) => {
  const estilos = usarEstilos();

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
      className={esLink ? estilos.tagBrand : undefined}
      onClick={handleTagClick}
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
      ) : esLink ? (
        <span className={estilos.enlace} title={titulo || nombre}>
          {nombre}
        </span>
      ) : (
        nombre
      )}
    </Tag>
  );
};

export default EnlaceEntidad;
