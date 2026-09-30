import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, DrawerBody, DrawerFooter, DrawerHeader, DrawerHeaderTitle, Input,
  Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, OverlayDrawer, Select,
  SplitButton, Text, makeStyles, tokens, type MenuButtonProps,
} from '@fluentui/react-components';
import { Dismiss16Regular, LockClosed16Regular } from '@fluentui/react-icons';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { GrupoUnidadMedidaService, UnidadMedidaService } from '../services/unidadMedida.service';
import type {
  AgregarUnidadMedidaDto, GrupoUnidadMedidaDto, UnidadMedidaDto, UnidadMedidaReferenciaDto,
} from '../types/unidadMedida.types';

const usarEstilos = makeStyles({
  drawer: { width: '440px', maxWidth: '95vw' },
  cabecera: { borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  cuerpo: {
    display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
  },
  pie: {
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex', justifyContent: 'flex-end', gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
  },
  control: { width: '100%' },
  equivalencia: {
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorBrandBackground2,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
  },
});

const datosIniciales: AgregarUnidadMedidaDto = { nombre: '', cantidad: 0, unidadMedidaBaseId: '' };

export interface CrearUnidadDrawerProps {
  abierto: boolean;
  grupoId?: string;
  nombreGrupo?: string;
  nombreUnidadRaiz?: string;
  gruposDisponibles?: GrupoUnidadMedidaDto[];
  nombreInicial?: string;
  alCerrar: () => void;
  alGuardar: (unidad: UnidadMedidaDto) => void | Promise<void>;
}

export const CrearUnidadDrawer: React.FC<CrearUnidadDrawerProps> = ({
  abierto, grupoId, nombreGrupo, nombreUnidadRaiz, gruposDisponibles = [], nombreInicial = '',
  alCerrar, alGuardar,
}) => {
  const estilos = usarEstilos();
  const [datos, setDatos] = useState<AgregarUnidadMedidaDto>(datosIniciales);
  const [referencias, setReferencias] = useState<UnidadMedidaReferenciaDto[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState(grupoId || '');

  const grupoSeleccionado = gruposDisponibles.find((grupo) => grupo.id === grupoSeleccionadoId);
  const idGrupoActual = grupoId || grupoSeleccionadoId;
  const nombreGrupoActual = nombreGrupo || grupoSeleccionado?.nombre || '';
  const nombreRaizActual = nombreUnidadRaiz
    || grupoSeleccionado?.unidades.find((unidad) => unidad.esUnidadBase)?.nombre
    || '';

  useEffect(() => {
    if (!abierto) return;
    setGrupoSeleccionadoId(grupoId || '');
    setDatos({ ...datosIniciales, nombre: nombreInicial });
    setError('');
    setReferencias([]);
  }, [abierto, grupoId, nombreInicial]);

  useEffect(() => {
    if (!abierto || !idGrupoActual) return;
    setCargando(true);
    GrupoUnidadMedidaService.getUnidadesReferencia(idGrupoActual)
      .then((items) => {
        setReferencias(items);
        const raiz = items.find((item) => item.esUnidadBase) || items[0];
        if (raiz) setDatos((actual) => ({ ...actual, unidadMedidaBaseId: raiz.id }));
      })
      .catch((excepcion) => setError(excepcion?.message || 'No se pudieron cargar las unidades.'))
      .finally(() => setCargando(false));
  }, [abierto, idGrupoActual]);

  const referencia = referencias.find((item) => item.id === datos.unidadMedidaBaseId);
  const equivalencia = useMemo(() => referencia && datos.cantidad > 0
    ? datos.cantidad * referencia.factorConversionTotal
    : null, [datos.cantidad, referencia]);

  const cerrar = () => {
    if (guardando) return;
    setDatos(datosIniciales);
    setReferencias([]);
    setError('');
    alCerrar();
  };

  const guardar = async (cerrarAlGuardar: boolean) => {
    if (!idGrupoActual || !datos.nombre.trim() || !datos.unidadMedidaBaseId || datos.cantidad <= 0) {
      setError('Complete los campos obligatorios.');
      return;
    }
    try {
      setGuardando(true);
      setError('');
      const resultado = await GrupoUnidadMedidaService.agregarUnidad(
        idGrupoActual,
        { ...datos, nombre: datos.nombre.trim() },
      );
      const unidadCreada = await UnidadMedidaService.getUnidadMedidaById(resultado.id);
      await alGuardar(unidadCreada);
      if (cerrarAlGuardar) {
        setDatos(datosIniciales);
        setReferencias([]);
        alCerrar();
      } else {
        const items = await GrupoUnidadMedidaService.getUnidadesReferencia(idGrupoActual);
        setReferencias(items);
        const raiz = items.find((item) => item.esUnidadBase) || items[0];
        setDatos({ ...datosIniciales, unidadMedidaBaseId: raiz?.id || '' });
      }
    } catch (excepcion: any) {
      setError(excepcion?.message || 'No se pudo guardar la unidad.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <OverlayDrawer open={abierto} position="end" className={estilos.drawer}
      onOpenChange={(_, cambio) => !cambio.open && cerrar()}>
      <DrawerHeader className={estilos.cabecera}>
        <DrawerHeaderTitle action={(
          <Button appearance="subtle" icon={<Dismiss16Regular />} aria-label="Cerrar" onClick={cerrar} />
        )}>Creación rápida: Unidad</DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody className={estilos.cuerpo}>
        {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
        <D365FormField label="Grupo" required htmlFor="nueva-unidad-grupo">
          {grupoId ? (
            <Input id="nueva-unidad-grupo" className={estilos.control} value={nombreGrupoActual}
              appearance="filled-darker" readOnly
              contentAfter={<LockClosed16Regular aria-label="Solo lectura" />} />
          ) : (
            <Select id="nueva-unidad-grupo" className={estilos.control} value={grupoSeleccionadoId}
              onChange={(_, cambio) => {
                setGrupoSeleccionadoId(cambio.value);
                setDatos((actual) => ({ ...actual, unidadMedidaBaseId: '' }));
              }}>
              <option value="">---</option>
              {gruposDisponibles.map((grupo) => <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>)}
            </Select>
          )}
        </D365FormField>
        <D365FormField label="Nombre" required htmlFor="nueva-unidad-nombre">
          <Input id="nueva-unidad-nombre" className={estilos.control} placeholder="---" value={datos.nombre}
            onChange={(_, cambio) => setDatos((actual) => ({ ...actual, nombre: cambio.value }))} />
        </D365FormField>
        <D365FormField label="Cantidad" required htmlFor="nueva-unidad-cantidad">
          <Input id="nueva-unidad-cantidad" className={estilos.control} type="number" min={0.000001}
            step="any" placeholder="---" value={datos.cantidad > 0 ? String(datos.cantidad) : ''}
            onChange={(_, cambio) => setDatos((actual) => ({ ...actual, cantidad: Number(cambio.value) }))} />
        </D365FormField>
        <D365FormField label="Referencia" required htmlFor="nueva-unidad-referencia">
          <Select id="nueva-unidad-referencia" className={estilos.control} value={datos.unidadMedidaBaseId}
            disabled={cargando} onChange={(_, cambio) => setDatos((actual) => ({ ...actual, unidadMedidaBaseId: cambio.value }))}>
            <option value="">---</option>
            {referencias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </Select>
        </D365FormField>
        {equivalencia !== null && (
          <div className={estilos.equivalencia}>
            <Text weight="semibold">Equivale a: {equivalencia.toLocaleString('es-PE', { maximumFractionDigits: 4 })} {nombreRaizActual}</Text>
          </div>
        )}
      </DrawerBody>
      <DrawerFooter className={estilos.pie}>
        <Button appearance="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
        <Menu positioning="above-end">
          <MenuTrigger disableButtonEnhancement>
            {(propiedades: MenuButtonProps) => (
              <SplitButton
                appearance="primary"
                disabled={guardando}
                menuButton={propiedades}
                primaryActionButton={{ onClick: () => void guardar(true) }}
              >
                {guardando ? 'Guardando…' : 'Guardar y cerrar'}
              </SplitButton>
            )}
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem disabled={guardando} onClick={() => void guardar(false)}>
                Guardar y nuevo
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </DrawerFooter>
    </OverlayDrawer>
  );
};

export default CrearUnidadDrawer;
