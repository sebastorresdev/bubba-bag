import { useState, useEffect } from 'react';
import {
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Input,
  OverlayDrawer,
  Textarea,
  makeStyles,
  tokens,
  typographyStyles,
} from '@fluentui/react-components';
import { Dismiss16Regular, Save16Regular } from '@fluentui/react-icons';
import { D365FormField } from '../../../components/common/D365FormField';
import { D365MessageBar } from '../../../components/common/D365MessageBar';
import { AlmacenService } from '../almacenes/services/almacen.service';

const useStyles = makeStyles({
  drawer: {
    width: '460px',
    maxWidth: '92vw',
  },
  header: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: '12px',
  },
  headerSubtitle: {
    ...typographyStyles.caption1,
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
  },
  control: {
    width: '100%',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '16px 24px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
});

export interface CreacionRapidaEntidadDrawerProps {
  entidad: 'almacen' | null;
  nombreInicial?: string;
  alCerrar: () => void;
  alGuardar: (id: string) => void;
}

export function CreacionRapidaEntidadDrawer({
  entidad,
  nombreInicial = '',
  alCerrar,
  alGuardar,
}: CreacionRapidaEntidadDrawerProps) {
  const styles = useStyles();
  const [nombre, setNombre] = useState(nombreInicial);
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entidad) {
      setNombre(nombreInicial);
      setDescripcion('');
      setError(null);
    }
  }, [entidad, nombreInicial]);

  const handleGuardar = async () => {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('El nombre del almacén es obligatorio.');
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      const resultado = await AlmacenService.createAlmacen({
        nombre: nombreLimpio,
        descripcion: descripcion.trim() || null,
      });
      alGuardar(resultado.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el almacén.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <OverlayDrawer
      open={Boolean(entidad)}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, d) => {
        if (!d.open && !guardando) alCerrar();
      }}
    >
      <DrawerHeader className={styles.header}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              disabled={guardando}
              icon={<Dismiss16Regular />}
              aria-label="Cerrar creación rápida"
              onClick={alCerrar}
            />
          }
        >
          Creación rápida: Almacén
        </DrawerHeaderTitle>
        <div className={styles.headerSubtitle}>
          Complete los campos requeridos para dar de alta el almacén de forma inmediata.
        </div>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        {error && (
          <D365MessageBar intent="error" onDismiss={() => setError(null)}>
            {error}
          </D365MessageBar>
        )}

        <D365FormField label="Nombre *" required htmlFor="quick-almacen-nombre">
          <Input
            id="quick-almacen-nombre"
            className={styles.control}
            value={nombre}
            disabled={guardando}
            autoFocus
            maxLength={100}
            onChange={(_, d) => {
              setNombre(d.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleGuardar();
              }
            }}
          />
        </D365FormField>

        <D365FormField label="Descripción" align="top" htmlFor="quick-almacen-desc">
          <Textarea
            id="quick-almacen-desc"
            className={styles.control}
            value={descripcion}
            disabled={guardando}
            rows={3}
            maxLength={300}
            onChange={(_, d) => setDescripcion(d.value)}
          />
        </D365FormField>
      </DrawerBody>

      <DrawerFooter className={styles.footer}>
        <Button disabled={guardando} onClick={alCerrar}>
          Cancelar
        </Button>
        <Button
          appearance="primary"
          icon={<Save16Regular />}
          disabled={guardando || !nombre.trim()}
          onClick={() => void handleGuardar()}
        >
          {guardando ? 'Guardando...' : 'Guardar y cerrar'}
        </Button>
      </DrawerFooter>
    </OverlayDrawer>
  );
}
