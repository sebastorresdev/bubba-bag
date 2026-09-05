import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ErrorResponse } from '../models/error-response.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NzNotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Dejamos que el authInterceptor maneje 401 (redirección a login)
      if (error.status === 401) {
        return throwError(() => error);
      }

      handleHttpError(error, notification);
      return throwError(() => error);
    })
  );
};

function handleHttpError(error: HttpErrorResponse, notification: NzNotificationService): void {
  const errBody = error.error as ErrorResponse | undefined;

  switch (error.status) {
    case 0:
      notification.error(
        'Error de Conexión',
        'No se pudo comunicar con el servidor. Por favor, verifica tu conexión de red.',
        { nzDuration: 5000 }
      );
      break;

    case 400:
      if (errBody?.errors && Object.keys(errBody.errors).length > 0) {
        const errorLines: string[] = [];
        for (const [field, messages] of Object.entries(errBody.errors)) {
          const fieldLabel = formatFieldLabel(field);
          if (Array.isArray(messages)) {
            messages.forEach(msg => errorLines.push(`• ${fieldLabel}: ${msg}`));
          }
        }
        notification.error(
          errBody.title || 'Error de Validación',
          errorLines.join('\n'),
          { nzDuration: 6000 }
        );
      } else {
        notification.error(
          errBody?.title || 'Datos Inválidos',
          errBody?.detail || 'La solicitud contiene parámetros no válidos.',
          { nzDuration: 5000 }
        );
      }
      break;

    case 403:
      notification.error(
        'Acceso Denegado',
        errBody?.detail || 'No dispones de los permisos necesarios para realizar esta acción.',
        { nzDuration: 5000 }
      );
      break;

    case 404:
      notification.warning(
        errBody?.title || 'Recurso No Encontrado',
        errBody?.detail || 'El elemento solicitado no fue encontrado.',
        { nzDuration: 4000 }
      );
      break;

    case 409:
      notification.error(
        errBody?.title || 'Conflicto de Información',
        errBody?.detail || 'La operación entra en conflicto con registros existentes.',
        { nzDuration: 5000 }
      );
      break;

    case 500:
    default:
      const traceSuffix = errBody?.traceId ? ` (Código de rastreo: ${errBody.traceId})` : '';
      notification.error(
        errBody?.title || 'Error del Servidor',
        errBody?.detail || `Ocurrió un error inesperado al procesar la solicitud${traceSuffix}.`,
        { nzDuration: 6000 }
      );
      break;
  }
}

function formatFieldLabel(field: string): string {
  // Convierte camelCase a palabras legibles: "numeroDocumento" -> "Número Documento"
  const dictionary: Record<string, string> = {
    nombres: 'Nombres',
    apellidos: 'Apellidos',
    tipoDocumento: 'Tipo de Documento',
    numeroDocumento: 'Número de Documento',
    email: 'Correo Electrónico',
    telefono: 'Teléfono',
    salarioBase: 'Salario Base',
    cargo: 'Cargo',
    departamento: 'Departamento',
    tipoContrato: 'Tipo de Contrato',
    fechaNacimiento: 'Fecha de Nacimiento',
    fechaIngreso: 'Fecha de Ingreso',
    regimenPensionario: 'Régimen Pensionario',
    cuspp: 'CUSPP',
    entidadFinanciera: 'Banco',
    cuentaBancaria: 'Cuenta Bancaria',
    cuentaInterbancaria: 'CCI'
  };

  if (dictionary[field]) {
    return dictionary[field];
  }

  // Fallback genérico para otros campos
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}
