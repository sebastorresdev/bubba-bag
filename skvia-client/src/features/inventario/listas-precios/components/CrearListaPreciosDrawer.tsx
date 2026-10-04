import React, { useEffect, useState } from 'react';
import {
  Button, DrawerBody, DrawerFooter, DrawerHeader, DrawerHeaderTitle, Input,
  OverlayDrawer, Select, makeStyles, tokens,
} from '@fluentui/react-components';
import { Dismiss16Regular } from '@fluentui/react-icons';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { ListaPreciosService } from '../services/listaPrecios.service';
import type { ListaPreciosDto } from '../types/listaPrecios.types';

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
});

export interface CrearListaPreciosDrawerProps {
  abierto: boolean;
  nombreInicial?: string;
  alCerrar: () => void;
  alGuardar: (lista: ListaPreciosDto) => void | Promise<void>;
}

export const CrearListaPreciosDrawer: React.FC<CrearListaPreciosDrawerProps> = ({
  abierto, nombreInicial = '', alCerrar, alGuardar,
}) => {
  const estilos = usarEstilos();
  const [datos, setDatos] = useState({ nombre: nombreInicial, moneda: 'PEN' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!abierto) return;
    setDatos({ nombre: nombreInicial, moneda: 'PEN' });
    setError('');
  }, [abierto, nombreInicial]);

  const cerrar = () => {
    if (guardando) return;
    alCerrar();
  };

  const guardar = async () => {
    const nombre = datos.nombre.trim();
    if (!nombre) {
      setError('El nombre es obligatorio.');
      return;
    }
    try {
      setGuardando(true);
      setError('');
      const resultado = await ListaPreciosService.createListaPrecios({ nombre, moneda: datos.moneda });
      await alGuardar({ id: resultado.id, nombre, moneda: datos.moneda, activo: true });
      alCerrar();
    } catch (excepcion: any) {
      setError(excepcion?.message || 'No se pudo crear la lista de precios.');
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
        )}>Creación rápida: Lista de precios</DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody className={estilos.cuerpo}>
        {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
        <D365FormField label="Nombre" required htmlFor="nueva-lista-nombre">
          <Input id="nueva-lista-nombre" className={estilos.control}
            value={datos.nombre} onChange={(_, cambio) => setDatos((actual) => ({ ...actual, nombre: cambio.value }))} />
        </D365FormField>
        <D365FormField label="Moneda" required htmlFor="nueva-lista-moneda">
          <Select id="nueva-lista-moneda" className={estilos.control} value={datos.moneda}
            onChange={(_, cambio) => setDatos((actual) => ({ ...actual, moneda: cambio.value }))}>
            <option value="PEN">PEN</option>
            <option value="USD">USD</option>
          </Select>
        </D365FormField>
      </DrawerBody>
      <DrawerFooter className={estilos.pie}>
        <Button appearance="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
        <Button appearance="primary" disabled={guardando} onClick={() => void guardar()}>
          {guardando ? 'Guardando…' : 'Guardar y cerrar'}
        </Button>
      </DrawerFooter>
    </OverlayDrawer>
  );
};

export default CrearListaPreciosDrawer;
