import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NotFoundView } from './NotFoundView';
import { ENTERPRISE_APPS } from '../../data/navigation.data';

export const PlaceholderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Find if current path belongs to any navigation item in ENTERPRISE_APPS
  let matchedTitle: string | null = null;
  let matchedPath: string | null = null;

  for (const app of ENTERPRISE_APPS) {
    for (const area of app.areas) {
      for (const group of area.groups) {
        for (const item of group.items) {
          if (location.pathname === item.path || location.pathname.startsWith(item.path + '/')) {
            matchedTitle = item.title;
            matchedPath = item.path;
            break;
          }
          if (item.subItems) {
            for (const subItem of item.subItems) {
              if (location.pathname === subItem.path || location.pathname.startsWith(subItem.path + '/')) {
                matchedTitle = subItem.title;
                matchedPath = subItem.path;
                break;
              }
            }
          }
        }
        if (matchedTitle) break;
      }
      if (matchedTitle) break;
    }
    if (matchedTitle) break;
  }

  if (matchedTitle && matchedPath) {
    return (
      <NotFoundView
        key={matchedPath}
        title={`Módulo en preparación: ${matchedTitle}`}
        message={`La vista para "${matchedTitle}" (${matchedPath}) aún no ha sido implementada. Puedes explorar el maestro de Productos y Servicios.`}
        onGoHome={() => navigate('/servicio-campo/productos')}
      />
    );
  }

  return (
    <NotFoundView
      title="Ruta no encontrada"
      message={`La ruta "${location.pathname}" no existe o fue movida.`}
      onGoHome={() => navigate('/servicio-campo/productos')}
    />
  );
};
