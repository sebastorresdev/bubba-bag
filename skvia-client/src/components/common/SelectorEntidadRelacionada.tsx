import React, { useMemo } from 'react';
import {
  Button,
  Spinner,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  TagPickerOptionGroup,
  Text,
  makeStyles,
  tokens,
  type TagPickerProps,
} from '@fluentui/react-components';
import { Add16Regular, Person16Regular } from '@fluentui/react-icons';
import { EnlaceEntidad } from './EnlaceEntidad';

const usarEstilos = makeStyles({
  control: { width: '100%', minHeight: '32px', height: '32px', flexWrap: 'nowrap' },
  grupo: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  entrada: { minHeight: '28px' },
  pie: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
  },
  estado: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    color: tokens.colorNeutralForeground3,
  },
  detalle: { color: tokens.colorNeutralForeground3 },
});

export interface OpcionEntidadRelacionada {
  id: string;
  nombre: string;
  detalle?: string | null;
}

export interface SelectorEntidadRelacionadaProps {
  etiquetaGrupo: string;
  opciones: OpcionEntidadRelacionada[];
  seleccionada?: OpcionEntidadRelacionada | null;
  textoBusqueda: string;
  alCambiarBusqueda: (texto: string) => void;
  alSeleccionar: (id: string | null) => void;
  alCrearNuevo?: (nombreInicial: string) => void;
  alNavegar?: (id: string) => void;
  icono?: React.ReactElement;
  cargando?: boolean;
  deshabilitado?: boolean;
  textoVacio?: string;
  tituloEnlace?: string;
  idEntrada?: string;
}

/** Selector reutilizable para relaciones con búsqueda, navegación y creación rápida. */
export const SelectorEntidadRelacionada: React.FC<SelectorEntidadRelacionadaProps> = ({
  etiquetaGrupo,
  opciones,
  seleccionada,
  textoBusqueda,
  alCambiarBusqueda,
  alSeleccionar,
  alCrearNuevo,
  alNavegar,
  icono,
  cargando = false,
  deshabilitado = false,
  textoVacio = 'No se encontraron registros',
  tituloEnlace,
  idEntrada,
}) => {
  const estilos = usarEstilos();
  const iconoFinal =
    icono ?? (etiquetaGrupo.toLowerCase().includes('usuario') ? <Person16Regular /> : undefined);

  const opcionesFiltradas = useMemo(() => {
    const consulta = textoBusqueda.trim().toLocaleLowerCase('es');
    return opciones.filter((opcion) => {
      if (opcion.id === seleccionada?.id) return false;
      if (!consulta) return true;
      return opcion.nombre.toLocaleLowerCase('es').includes(consulta)
        || opcion.detalle?.toLocaleLowerCase('es').includes(consulta);
    });
  }, [opciones, seleccionada?.id, textoBusqueda]);

  const alElegir: TagPickerProps['onOptionSelect'] = (_evento, datos) => {
    const id = String(datos.value);
    alSeleccionar(id === seleccionada?.id ? null : id);
    alCambiarBusqueda('');
  };

  return (
    <TagPicker
      selectedOptions={seleccionada ? [seleccionada.id] : []}
      onOptionSelect={alElegir}
      disabled={deshabilitado}
    >
      <TagPickerControl className={estilos.control}>
        {seleccionada && (
          <TagPickerGroup className={estilos.grupo} aria-label={`${etiquetaGrupo} seleccionada`}>
            <EnlaceEntidad
              id={seleccionada.id}
              nombre={seleccionada.nombre}
              icono={iconoFinal}
              alNavegar={alNavegar}
              titulo={tituloEnlace}
            />
          </TagPickerGroup>
        )}
        <TagPickerInput
          id={idEntrada}
          className={estilos.entrada}
          value={textoBusqueda}
          clearable
          onChange={(evento) => alCambiarBusqueda(evento.target.value)}
        />
      </TagPickerControl>
      <TagPickerList>
        <TagPickerOptionGroup label={etiquetaGrupo}>
          {cargando ? (
            <div className={estilos.estado}><Spinner size="tiny" /><Text>Cargando…</Text></div>
          ) : opcionesFiltradas.length ? (
            opcionesFiltradas.map((opcion) => (
              <TagPickerOption
                key={opcion.id}
                value={opcion.id}
                media={iconoFinal}
                secondaryContent={opcion.detalle ? (
                  <Text size={100} className={estilos.detalle}>{opcion.detalle}</Text>
                ) : undefined}
              >
                {opcion.nombre}
              </TagPickerOption>
            ))
          ) : (
            <div className={estilos.estado}>{textoVacio}</div>
          )}
        </TagPickerOptionGroup>
        {alCrearNuevo && (
          <div className={estilos.pie}>
            <Button
              appearance="subtle"
              size="small"
              icon={<Add16Regular />}
              onClick={(evento) => {
                evento.stopPropagation();
                alCrearNuevo(textoBusqueda.trim());
              }}
            >
              Nuevo
            </Button>
          </div>
        )}
      </TagPickerList>
    </TagPicker>
  );
};

export default SelectorEntidadRelacionada;
