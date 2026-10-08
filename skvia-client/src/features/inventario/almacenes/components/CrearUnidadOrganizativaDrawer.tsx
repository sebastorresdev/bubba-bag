import { useState, useEffect } from 'react';
import {
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Input,
  Checkbox,
  OverlayDrawer,
  makeStyles,
  tokens,
  typographyStyles,
} from '@fluentui/react-components';
import { Dismiss16Regular, Save16Regular, Building16Regular } from '@fluentui/react-icons';
import { D365FormField } from '../../../../components/common/D365FormField';
import { D365MessageBar } from '../../../../components/common/D365MessageBar';
import { OrganizacionService } from '../../../organizacion/services/organizacion.service';
import type { UnidadOrganizativaDto } from '../types/almacen.types';

const useStyles = makeStyles({
  drawer: {
    width: '520px',
    maxWidth: '95vw',
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
    overflowX: 'hidden',
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

export interface CrearUnidadOrganizativaDrawerProps {
  abierto: boolean;
  alCerrar: () => void;
  alGuardar: (nuevaUnidad: UnidadOrganizativaDto) => void;
}

export function CrearUnidadOrganizativaDrawer({
  abierto,
  alCerrar,
  alGuardar,
}: CrearUnidadOrganizativaDrawerProps) {
  const styles = useStyles();
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [esPrincipal, setEsPrincipal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setCodigo(`SEDE-${Math.floor(100 + Math.random() * 900)}`);
      setNombre('');
      setCiudad('');
      setDireccion('');
      setTelefono('');
      setEsPrincipal(false);
      setError(null);
    }
  }, [abierto]);

  const handleGuardar = async () => {
    const nombreLimpio = nombre.trim();
    const codigoLimpio = codigo.trim().toUpperCase();

    if (!codigoLimpio) {
      setError('El código identificador de la sede es obligatorio.');
      return;
    }
    if (!nombreLimpio) {
      setError('El nombre de la sede es obligatorio.');
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      const res = await OrganizacionService.createUnidadOrganizativa({
        codigo: codigoLimpio,
        nombre: nombreLimpio,
        ciudad: ciudad.trim() || null,
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        esSedePrincipal: esPrincipal,
      });

      alGuardar({
        id: res.id,
        codigo: codigoLimpio,
        nombre: nombreLimpio,
        ciudad: ciudad.trim() || null,
        esSedePrincipal: esPrincipal,
      });
      alCerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la sede organizacional.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <OverlayDrawer
      open={abierto}
      position="end"
      className={styles.drawer}
      onOpenChange={(_, { open }) => {
        if (!open) alCerrar();
      }}
    >
      <DrawerHeader className={styles.header}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Cerrar"
              icon={<Dismiss16Regular />}
              onClick={alCerrar}
            />
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building16Regular style={{ color: tokens.colorBrandForeground1 }} />
            <span>Creación Rápida de Sede</span>
          </div>
          <div className={styles.headerSubtitle}>
            Unidad Organizativa para delimitación de almacenes y operaciones
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        {error && (
          <D365MessageBar intent="error" onDismiss={() => setError(null)}>
            {error}
          </D365MessageBar>
        )}

        <D365FormField label="Código de Sede" required>
          <Input
            value={codigo}
            maxLength={30}
            placeholder="Ej. SEDE-CENTRAL, LIMA-01"
            onChange={(_, d) => setCodigo(d.value)}
          />
        </D365FormField>

        <D365FormField label="Nombre de la Sede" required>
          <Input
            value={nombre}
            maxLength={150}
            placeholder="Ej. Sede Central Principal, Base Arequipa"
            onChange={(_, d) => setNombre(d.value)}
          />
        </D365FormField>

        <D365FormField label="Ciudad / Departamento">
          <Input
            value={ciudad}
            maxLength={100}
            placeholder="Ej. Lima, Trujillo, Arequipa"
            onChange={(_, d) => setCiudad(d.value)}
          />
        </D365FormField>

        <D365FormField label="Dirección Física">
          <Input
            value={direccion}
            maxLength={250}
            placeholder="Ej. Av. Los Laureles 123, Parque Industrial"
            onChange={(_, d) => setDireccion(d.value)}
          />
        </D365FormField>

        <D365FormField label="Teléfono de Contacto">
          <Input
            value={telefono}
            maxLength={50}
            placeholder="Ej. (01) 555-1234"
            onChange={(_, d) => setTelefono(d.value)}
          />
        </D365FormField>

        <Checkbox
          label="Establecer como Sede Principal de la empresa"
          checked={esPrincipal}
          onChange={(_, d) => setEsPrincipal(Boolean(d.checked))}
        />
      </DrawerBody>

      <DrawerFooter className={styles.footer}>
        <Button appearance="subtle" disabled={guardando} onClick={alCerrar}>
          Cancelar
        </Button>
        <Button
          appearance="primary"
          icon={<Save16Regular />}
          disabled={guardando}
          onClick={() => void handleGuardar()}
        >
          {guardando ? 'Guardando...' : 'Crear Sede'}
        </Button>
      </DrawerFooter>
    </OverlayDrawer>
  );
}
