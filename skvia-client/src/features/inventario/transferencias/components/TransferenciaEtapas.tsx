import React from 'react';
import { Text, makeStyles, tokens, Tooltip } from '@fluentui/react-components';
import {
  CheckmarkCircle16Filled,
  Warning16Filled,
  DismissCircle16Filled,
} from '@fluentui/react-icons';

export interface EtapaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  subtitulo: string;
}

const ETAPAS_DESPACHO: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Preparación', descripcion: 'Selección y asignación de materiales para el técnico', subtitulo: 'Registro inicial' },
  { id: 'Cerrada', nombre: 'Entregado al Técnico', descripcion: 'Despacho aprobado y entrega inmediata al técnico en ventanilla', subtitulo: 'Aprobado al instante' },
];

const ETAPAS_DEVOLUCION: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Verificación', descripcion: 'Recepción y validación física de materiales devueltos', subtitulo: 'Registro inicial' },
  { id: 'Cerrada', nombre: 'Ingresado al Almacén', descripcion: 'Desabastecimiento aprobado y reingreso inmediato a stock', subtitulo: 'Aprobado al instante' },
];

const ETAPAS_DOA: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Identificación', descripcion: 'Selección de series averiadas y asignación de motivos de retiro', subtitulo: 'Preparación' },
  { id: 'Cerrada', nombre: 'Reclasificado a Devolución', descripcion: 'Reclasificación aprobada de Disponible a Devolución en bodega', subtitulo: 'Aprobado al instante' },
];

const ETAPAS_TRASLADO: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Preparación', descripcion: 'Edición y preparación de la transferencia', subtitulo: 'Registro inicial' },
  { id: 'EnTransito', nombre: 'En Tránsito', descripcion: 'Mercadería en carretera hacia almacén de destino', subtitulo: 'En despacho' },
  { id: 'Cerrada', nombre: 'Recibida en Destino', descripcion: 'Control físico y stock ingresado en destino', subtitulo: 'Ingreso final' },
];

const ETAPAS_RETIRO_DEFECTUOSO: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Borrador', descripcion: 'Información base y preparación de materiales defectuosos', subtitulo: 'Registro inicial' },
  { id: 'EnTransito', nombre: 'En Retiro a OL', descripcion: 'Guía emitida y equipos en traslado al Proveedor / OL', subtitulo: 'En traslado' },
  { id: 'Completada', nombre: 'Recibido por OL', descripcion: 'Equipos entregados y acta o guía sellada recibida', subtitulo: 'Completado' },
];

const ETAPAS_RETIRO_OK: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Borrador', descripcion: 'Información base y selección de material en buen estado (>60 días sin activación)', subtitulo: 'Registro inicial' },
  { id: 'EnTransito', nombre: 'En Retiro a OL', descripcion: 'Guía emitida y equipos en traslado al Proveedor / OL', subtitulo: 'En traslado' },
  { id: 'Completada', nombre: 'Recibido por OL', descripcion: 'Equipos entregados y acta o guía sellada recibida', subtitulo: 'Completado' },
];

const ETAPAS_RECEPCION_COMPRA: EtapaConfig[] = [
  { id: 'Borrador', nombre: 'Borrador', descripcion: 'Orden de compra registrada y emitida', subtitulo: 'Orden emitida' },
  { id: 'Enviada', nombre: 'En Despacho', descripcion: 'Mercadería en camino o enviada por el proveedor', subtitulo: 'En camino' },
  { id: 'Recibida', nombre: 'Recibida', descripcion: 'Control físico y de series verificado e ingresado al stock', subtitulo: 'Completado' },
];



const useStyles = makeStyles({
  container: {
    padding: '0',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    width: '100%',
  },
  containerEmbedded: {
    padding: '0',
    backgroundColor: 'transparent',
    borderBottom: 'none',
    width: '100%',
  },
  scrollWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  track: {
    display: 'flex',
    alignItems: 'stretch',
    width: '100%',
    minWidth: '540px',
    height: '46px',
    borderRadius: 0,
    border: 'none',
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    boxShadow: 'none',
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  },
  step: {
    flex: '1 1 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    position: 'relative',
    padding: '0 16px 0 24px',
    userSelect: 'none',
    transition: 'background-color 0.15s ease',
  },
  stepFirst: {
    paddingLeft: '16px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minWidth: 0,
    lineHeight: '1.2',
  },
  title: {
    fontSize: '13px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    fontSize: '10px',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    marginTop: '2px',
  },
});

interface TransferenciaEtapasProps {
  estado?: string | null;
  tipoOperacion?: 'Despacho' | 'Devolucion' | 'Traslado' | 'RetiroDefectuoso' | 'RetiroOk' | 'RecepcionCompra' | 'DeclaracionDoa' | string;
  embedded?: boolean;
}

export const TransferenciaEtapas: React.FC<TransferenciaEtapasProps> = ({
  estado = 'Borrador',
  tipoOperacion = 'Despacho',
  embedded = false,
}) => {
  const styles = useStyles();

  const etapas =
    tipoOperacion === 'Devolucion'
      ? ETAPAS_DEVOLUCION
      : tipoOperacion === 'DeclaracionDoa'
      ? ETAPAS_DOA
      : tipoOperacion === 'Traslado'
      ? ETAPAS_TRASLADO
      : tipoOperacion === 'RetiroDefectuoso'
      ? ETAPAS_RETIRO_DEFECTUOSO
      : tipoOperacion === 'RetiroOk'
      ? ETAPAS_RETIRO_OK
      : tipoOperacion === 'RecepcionCompra'
      ? ETAPAS_RECEPCION_COMPRA
      : ETAPAS_DESPACHO;

  const esCancelada = estado === 'Cancelada' || estado === 'Anulada';
  const esParcial = estado === 'ParcialmenteRecibida';
  const esCerrada = estado === 'Cerrada' || estado === 'Completada' || estado === 'Recibida' || estado === 'Aplicado';

  let actual = 0;
  if (esCerrada || esParcial) {
    actual = etapas.length - 1;
  } else if (estado === 'EnTransito' || estado === 'EnRetiro' || estado === 'Enviada') {
    actual = etapas.length > 2 ? 1 : 0;
  } else {
    actual = 0;
  }

  return (
    <div
      className={embedded ? styles.containerEmbedded : styles.container}
      aria-label="Progreso del ciclo de transferencia e inventario"
    >
      <div className={styles.scrollWrapper}>
        <ol className={styles.track} role="list">
          {etapas.map((etapa, index) => {
            const esUltima = index === etapas.length - 1;
            const esCompletada = esCerrada ? true : index < actual;
            const esActiva = !esCerrada && index === actual;

            let bg = tokens.colorNeutralBackground1;
            let stroke = tokens.colorNeutralStroke2;

            if (esCancelada) {
              bg = tokens.colorNeutralBackground3;
              stroke = tokens.colorNeutralStroke3;
            } else if (esActiva) {
              bg = tokens.colorBrandBackground;
              stroke = tokens.colorBrandStroke1;
            } else if (esCompletada) {
              bg = tokens.colorNeutralBackground2;
              stroke = tokens.colorNeutralStroke2;
            } else {
              bg = tokens.colorNeutralBackground1;
              stroke = tokens.colorNeutralStroke2;
            }

            return (
              <Tooltip
                key={etapa.id}
                content={esCancelada ? 'Transferencia cancelada' : etapa.descripcion}
                relationship="description"
              >
                <li
                  className={`${styles.step} ${index === 0 ? styles.stepFirst : ''}`}
                  style={{
                    backgroundColor: bg,
                    zIndex: etapas.length - index,
                  }}
                  aria-current={esActiva ? 'step' : undefined}
                >
                  {/* Indicador de estado */}
                  {esCancelada ? (
                    <DismissCircle16Filled
                      style={{ color: tokens.colorPaletteRedForeground1, fontSize: '18px', flexShrink: 0 }}
                      aria-label="Cancelada"
                    />
                  ) : esParcial && esUltima ? (
                    <Warning16Filled
                      style={{ color: tokens.colorPaletteYellowForeground2, fontSize: '18px', flexShrink: 0 }}
                      aria-label="Con pendientes"
                    />
                  ) : esCompletada ? (
                    <CheckmarkCircle16Filled
                      style={{ color: tokens.colorPaletteGreenForeground1, fontSize: '18px', flexShrink: 0 }}
                      aria-label="Completado"
                    />
                  ) : esActiva ? (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: tokens.colorNeutralForegroundOnBrand,
                        color: tokens.colorBrandForeground1,
                        fontWeight: 'bold',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: tokens.shadow2,
                      }}
                    >
                      {index + 1}
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `1.5px solid ${tokens.colorNeutralStroke2}`,
                        color: tokens.colorNeutralForeground4,
                        fontWeight: 'bold',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </div>
                  )}

                  {/* Textos de la etapa */}
                  <div className={styles.content}>
                    <Text
                      className={styles.title}
                      weight={esActiva ? 'bold' : esCompletada ? 'semibold' : 'regular'}
                      style={{
                        color: esActiva
                          ? tokens.colorNeutralForegroundOnBrand
                          : esCompletada
                          ? tokens.colorNeutralForeground1
                          : tokens.colorNeutralForeground4,
                      }}
                    >
                      {esParcial && esUltima ? 'Parcialmente Recibida' : etapa.nombre}
                    </Text>
                    <span
                      className={styles.subtitle}
                      style={{
                        color: esActiva
                          ? tokens.colorNeutralForegroundOnBrand
                          : esCompletada
                          ? tokens.colorNeutralForeground3
                          : tokens.colorNeutralForeground4,
                        opacity: esActiva ? 0.85 : 1,
                      }}
                    >
                      {esCancelada
                        ? 'Anulada'
                        : esParcial && esUltima
                        ? 'Con saldo'
                        : esActiva
                        ? 'Etapa actual'
                        : esCompletada
                        ? 'Completada'
                        : 'Pendiente'}
                    </span>
                  </div>

                  {/* Flecha Chevron conectora */}
                  {!esUltima && (
                    <svg
                      style={{
                        position: 'absolute',
                        right: '-13px',
                        top: 0,
                        width: '14px',
                        height: '100%',
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}
                      viewBox="0 0 14 46"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path d="M0,0 L14,23 L0,46 Z" fill={bg} />
                      <path d="M0,0 L14,23 L0,46" fill="none" stroke={stroke} strokeWidth="1.5" />
                    </svg>
                  )}
                </li>
              </Tooltip>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
