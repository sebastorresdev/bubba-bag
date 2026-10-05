import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Radio,
  RadioGroup,
  Text,
} from '@fluentui/react-components';
import {
  LockClosed16Regular,
  Copy16Regular,
  ArrowSync16Regular,
} from '@fluentui/react-icons';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { useD365FormStyles } from '../../../styles/d365FormStyles';
import { SeguridadService, type UsuarioDto } from '../services/seguridad.service';

export function generarPasswordSegura(longitud = 14): string {
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minusculas = 'abcdefghijkmnopqrstuvwxyz';
  const numeros = '23456789';
  const simbolos = '!@#$%&*+=?';
  const todos = mayusculas + minusculas + numeros + simbolos;

  const array = new Uint32Array(longitud);
  crypto.getRandomValues(array);

  const chars = [
    mayusculas[array[0] % mayusculas.length],
    minusculas[array[1] % minusculas.length],
    numeros[array[2] % numeros.length],
    simbolos[array[3] % simbolos.length],
  ];

  for (let i = 4; i < longitud; i++) {
    chars.push(todos[array[i] % todos.length]);
  }

  return chars.sort(() => Math.random() - 0.5).join('');
}

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: UsuarioDto | null;
  onSuccess: (mensaje: string) => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  usuario,
  onSuccess,
}: ResetPasswordDialogProps) {
  const styles = useD365FormStyles();
  const [busy, setBusy] = useState(false);
  const [modo, setModo] = useState<'automatica' | 'manual'>('automatica');
  const [passwordAuto, setPasswordAuto] = useState('');
  const [passwordManual, setPasswordManual] = useState('');
  const [confirmarManual, setConfirmarManual] = useState('');
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError('');
    setCopiado(false);
    setModo('automatica');
    setPasswordAuto(generarPasswordSegura());
    setPasswordManual('');
    setConfirmarManual('');
  }, [open, usuario]);

  const copiarPassword = async () => {
    try {
      await navigator.clipboard.writeText(passwordAuto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Ignorar
    }
  };

  const handleReset = async () => {
    if (!usuario) return;
    setError('');
    let finalPassword = '';

    if (modo === 'automatica') {
      finalPassword = passwordAuto;
    } else {
      if (passwordManual.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (passwordManual !== confirmarManual) {
        setError('Las contraseñas no coinciden.');
        return;
      }
      finalPassword = passwordManual;
    }

    setBusy(true);
    try {
      await SeguridadService.password(usuario.id, finalPassword);
      onOpenChange(false);
      onSuccess(`Contraseña restablecida para ${usuario.nombreCompleto}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(_, d) => {
        if (!busy && !d.open) onOpenChange(false);
      }}
    >
      <DialogSurface style={{ maxWidth: '480px', width: '100%' }}>
        <DialogBody>
          <DialogTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LockClosed16Regular />
              <span>Restablecer contraseña</span>
            </div>
          </DialogTitle>

          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '8px' }}>
            <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
              Se establecerá una nueva clave y se invalidarán las sesiones activas de <strong>{usuario?.nombreCompleto}</strong>.
            </Text>

            {error && <D365MessageBar intent="error">{error}</D365MessageBar>}

            <RadioGroup
              value={modo}
              onChange={(_, d) => setModo(d.value as 'automatica' | 'manual')}
            >
              <Radio value="automatica" label="Generar automáticamente (Recomendado)" />
              <Radio value="manual" label="Ingresar manualmente" />
            </RadioGroup>

            {modo === 'automatica' ? (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--colorNeutralBackground2)',
                  borderRadius: '4px',
                  border: '1px solid var(--colorNeutralStroke2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Input
                  readOnly
                  value={passwordAuto}
                  style={{ flex: 1, fontFamily: 'monospace' }}
                />
                <Button
                  size="small"
                  icon={<Copy16Regular />}
                  onClick={() => void copiarPassword()}
                >
                  {copiado ? 'Copiado' : 'Copiar'}
                </Button>
                <Button
                  size="small"
                  icon={<ArrowSync16Regular />}
                  title="Generar otra"
                  onClick={() => {
                    setPasswordAuto(generarPasswordSegura());
                    setCopiado(false);
                  }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <D365FormField label="Nueva contraseña" required htmlFor="dlg-reset-pass">
                  <Input
                    id="dlg-reset-pass"
                    type="password"
                    autoComplete="new-password"
                    className={styles.d365ControlFull}
                    value={passwordManual}
                    onChange={(_, d) => setPasswordManual(d.value)}
                  />
                </D365FormField>
                <D365FormField label="Confirmar contraseña" required htmlFor="dlg-reset-conf">
                  <Input
                    id="dlg-reset-conf"
                    type="password"
                    autoComplete="new-password"
                    className={styles.d365ControlFull}
                    value={confirmarManual}
                    onChange={(_, d) => setConfirmarManual(d.value)}
                  />
                </D365FormField>
              </div>
            )}
          </DialogContent>

          <DialogActions>
            <Button disabled={busy} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              appearance="primary"
              disabled={busy}
              onClick={() => void handleReset()}
            >
              {busy ? 'Restableciendo...' : 'Restablecer'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
