import { useState, useEffect, type FormEvent } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Spinner,
} from '@fluentui/react-components';
import {
  Key20Regular,
  Eye20Regular,
  EyeOff20Regular,
  ShieldCheckmark20Regular,
  Dismiss20Regular,
} from '@fluentui/react-icons';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { SeguridadService } from '../services/seguridad.service';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

interface CambiarMiPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  esAlertaInicial?: boolean;
  onSuccess?: () => void;
}

export function CambiarMiPasswordDialog({
  open,
  onOpenChange,
  esAlertaInicial = false,
  onSuccess,
}: CambiarMiPasswordDialogProps) {
  const currentUser = useCurrentUser();

  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setPasswordActual(esAlertaInicial ? 'Admin123*!' : '');
      setNuevaPassword('');
      setConfirmarPassword('');
      setError('');
    }
  }, [open, esAlertaInicial]);

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!passwordActual) {
      setError('Por favor ingrese su contraseña actual.');
      return;
    }

    if (!nuevaPassword || nuevaPassword.trim().length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword === passwordActual) {
      setError('La nueva contraseña debe ser diferente a la contraseña actual.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    setGuardando(true);
    try {
      await SeguridadService.cambiarMiPassword({
        passwordActual,
        nuevaPassword,
      });

      currentUser.refreshUser();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface style={{ maxWidth: '440px', width: '100%' }}>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="Cerrar"
                  icon={<Dismiss20Regular />}
                  onClick={() => onOpenChange(false)}
                />
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key20Regular style={{ color: '#0078d4' }} />
                <span>{esAlertaInicial ? 'Actualizar Contraseña Inicial' : 'Cambiar Mi Contraseña'}</span>
              </div>
            </DialogTitle>

            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
              {esAlertaInicial && (
                <D365MessageBar intent="warning">
                  Por seguridad, detectamos que está usando la contraseña genérica de fábrica (<code>Admin123*!</code>). 
                  Establezca su contraseña personal para proteger el sistema.
                </D365MessageBar>
              )}

              {error && (
                <D365MessageBar intent="error">
                  {error}
                </D365MessageBar>
              )}

              <D365FormField
                label="Contraseña Actual"
                required
                info={esAlertaInicial ? 'Se ha colocado la contraseña genérica por defecto.' : undefined}
              >
                <Input
                  type={mostrarActual ? 'text' : 'password'}
                  value={passwordActual}
                  onChange={(_, d) => setPasswordActual(d.value)}
                  placeholder="Ingrese contraseña actual"
                  disabled={guardando}
                  style={{ width: '100%' }}
                  contentAfter={
                    <Button
                      appearance="transparent"
                      size="small"
                      icon={mostrarActual ? <EyeOff20Regular /> : <Eye20Regular />}
                      onClick={() => setMostrarActual(!mostrarActual)}
                      aria-label="Ver u ocultar contraseña"
                    />
                  }
                />
              </D365FormField>

              <D365FormField
                label="Nueva Contraseña"
                required
                info="Mínimo 6 caracteres. Se recomienda incluir letras, números y símbolos."
              >
                <Input
                  type={mostrarNueva ? 'text' : 'password'}
                  value={nuevaPassword}
                  onChange={(_, d) => setNuevaPassword(d.value)}
                  placeholder="Ingrese nueva contraseña"
                  disabled={guardando}
                  style={{ width: '100%' }}
                  contentAfter={
                    <Button
                      appearance="transparent"
                      size="small"
                      icon={mostrarNueva ? <EyeOff20Regular /> : <Eye20Regular />}
                      onClick={() => setMostrarNueva(!mostrarNueva)}
                      aria-label="Ver u ocultar contraseña"
                    />
                  }
                />
              </D365FormField>

              <D365FormField
                label="Confirmar Nueva Contraseña"
                required
              >
                <Input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  value={confirmarPassword}
                  onChange={(_, d) => setConfirmarPassword(d.value)}
                  placeholder="Repita la nueva contraseña"
                  disabled={guardando}
                  style={{ width: '100%' }}
                  contentAfter={
                    <Button
                      appearance="transparent"
                      size="small"
                      icon={mostrarConfirmar ? <EyeOff20Regular /> : <Eye20Regular />}
                      onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                      aria-label="Ver u ocultar contraseña"
                    />
                  }
                />
              </D365FormField>
            </DialogContent>

            <DialogActions style={{ marginTop: '16px' }}>
              <Button
                appearance="secondary"
                disabled={guardando}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                type="submit"
                disabled={guardando || !passwordActual || !nuevaPassword}
                icon={guardando ? <Spinner size="tiny" /> : <ShieldCheckmark20Regular />}
              >
                {guardando ? 'Guardando...' : 'Guardar Nueva Contraseña'}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
