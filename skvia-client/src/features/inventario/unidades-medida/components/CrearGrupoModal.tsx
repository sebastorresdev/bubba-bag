import React, { useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface,
  DialogTitle, Input, Text, makeStyles, tokens,
} from '@fluentui/react-components';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { GrupoUnidadMedidaService } from '../services/unidadMedida.service';

const usarEstilos = makeStyles({
  superficie: { width: '480px', maxWidth: 'calc(100vw - 32px)' },
  contenido: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM },
  ayuda: { color: tokens.colorNeutralForeground3 },
  control: { width: '100%' },
});

export interface CrearGrupoModalProps {
  abierto: boolean;
  alCerrar: () => void;
  alCrear: (id: string) => void;
}

export const CrearGrupoModal: React.FC<CrearGrupoModalProps> = ({ abierto, alCerrar, alCrear }) => {
  const estilos = usarEstilos();
  const [datos, setDatos] = useState({ nombre: '', nombreUnidadBase: '' });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cerrar = () => {
    if (guardando) return;
    setDatos({ nombre: '', nombreUnidadBase: '' });
    setError('');
    alCerrar();
  };

  const aceptar = async () => {
    const nombre = datos.nombre.trim();
    const nombreUnidadBase = datos.nombreUnidadBase.trim();
    if (!nombre || !nombreUnidadBase) {
      setError('El nombre del grupo y la unidad base son obligatorios.');
      return;
    }

    try {
      setGuardando(true);
      setError('');
      const resultado = await GrupoUnidadMedidaService.createGrupo({ nombre, nombreUnidadBase });
      setDatos({ nombre: '', nombreUnidadBase: '' });
      alCrear(resultado.id);
    } catch (excepcion: any) {
      setError(excepcion?.message || 'No se pudo crear el grupo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} modalType="modal" onOpenChange={(_, datosApertura) => !datosApertura.open && cerrar()}>
      <DialogSurface className={estilos.superficie}>
        <DialogBody>
          <DialogTitle>Crear grupo de unidades</DialogTitle>
          <DialogContent className={estilos.contenido}>
            {error && <D365MessageBar intent="error">{error}</D365MessageBar>}
            <Text className={estilos.ayuda}>
              Especifique el nombre del grupo y la unidad base primaria indivisible. Esta unidad será la base del inventario y no podrá modificarse posteriormente.
            </Text>
            <D365FormField label="Nombre del grupo" required htmlFor="crear-grupo-nombre">
              <Input
                id="crear-grupo-nombre"
                className={estilos.control}
                placeholder="---"
                value={datos.nombre}
                onChange={(_, cambio) => setDatos((actual) => ({ ...actual, nombre: cambio.value }))}
              />
            </D365FormField>
            <D365FormField label="Unidad base" required htmlFor="crear-grupo-unidad-base">
              <Input
                id="crear-grupo-unidad-base"
                className={estilos.control}
                placeholder="---"
                value={datos.nombreUnidadBase}
                onChange={(_, cambio) => setDatos((actual) => ({ ...actual, nombreUnidadBase: cambio.value }))}
              />
            </D365FormField>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" disabled={guardando} onClick={cerrar}>Cancelar</Button>
            <Button appearance="primary" disabled={guardando} onClick={() => void aceptar()}>
              {guardando ? 'Guardando…' : 'Aceptar'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default CrearGrupoModal;
