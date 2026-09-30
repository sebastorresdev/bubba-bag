import React, { useEffect, useState } from 'react';
import {
  Button, DrawerBody, DrawerFooter, DrawerHeader, DrawerHeaderTitle, Input,
  OverlayDrawer, Textarea, makeStyles, tokens,
} from '@fluentui/react-components';
import { Dismiss16Regular } from '@fluentui/react-icons';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { CategoriaService } from '../services/categoria.service';
import type { CategoriaProductoDto } from '../types/categoria.types';

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

export interface CrearCategoriaDrawerProps {
  abierto: boolean;
  nombreInicial?: string;
  categoriaPadreId?: string | null;
  alCerrar: () => void;
  alGuardar: (categoria: CategoriaProductoDto) => void | Promise<void>;
}

export const CrearCategoriaDrawer: React.FC<CrearCategoriaDrawerProps> = ({
  abierto, nombreInicial = '', categoriaPadreId = null, alCerrar, alGuardar,
}) => {
  const estilos = usarEstilos();
  const [datos, setDatos] = useState({ nombre: nombreInicial, descripcion: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!abierto) return;
    setDatos({ nombre: nombreInicial, descripcion: '' });
    setError('');
  }, [abierto, nombreInicial]);

  const cerrar = () => {
    if (!guardando) alCerrar();
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
      const resultado = await CategoriaService.createCategoria({
        nombre,
        categoriaPadreId,
        descripcion: datos.descripcion.trim() || null,
      });
      await alGuardar({
        id: resultado.id,
        nombre,
        categoriaPadreId,
        descripcion: datos.descripcion.trim() || null,
        activo: true,
      });
      alCerrar();
    } catch (excepcion: any) {
      setError(excepcion?.message || 'No se pudo crear la categoría.');
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
        )}>Creación rápida: Categoría</DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody className={estilos.cuerpo}>
        {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
        <D365FormField label="Nombre" required htmlFor="nueva-categoria-nombre">
          <Input id="nueva-categoria-nombre" className={estilos.control} placeholder="---"
            value={datos.nombre} onChange={(_, cambio) => setDatos((actual) => ({ ...actual, nombre: cambio.value }))} />
        </D365FormField>
        <D365FormField label="Descripción" htmlFor="nueva-categoria-descripcion" align="top">
          <Textarea id="nueva-categoria-descripcion" className={estilos.control} rows={4} placeholder="---"
            value={datos.descripcion} onChange={(_, cambio) => setDatos((actual) => ({ ...actual, descripcion: cambio.value }))} />
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

export default CrearCategoriaDrawer;
