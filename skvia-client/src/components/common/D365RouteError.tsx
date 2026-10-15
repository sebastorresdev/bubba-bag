import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { Button, Text, tokens } from '@fluentui/react-components';

export function D365RouteError() {
  const error = useRouteError();
  useEffect(() => { console.error('No se pudo mostrar la vista', error); }, [error]);
  return <main style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: tokens.colorNeutralBackground1, color: tokens.colorNeutralForeground1, height: '100dvh' }}>
    <Text as="h1" size={500}>No se pudo mostrar esta vista</Text>
    <Text>Vuelva a cargar la página para intentarlo de nuevo.</Text>
    <Button style={{ alignSelf: 'start' }} onClick={() => window.location.reload()}>Volver a cargar</Button>
  </main>;
}
