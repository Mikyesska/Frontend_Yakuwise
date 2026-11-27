import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

function processNestedValue(valor: any): Record<string, string[]> {
  const subObjeto: Record<string, string[]> = {};
  
  for (const [subCampo, subValor] of Object.entries(valor)) {
    if (Array.isArray(subValor)) {
      subObjeto[subCampo] = subValor.map(String);
    } else {
      subObjeto[subCampo] = [String(subValor)];
    }
  }
  
  return subObjeto;
}

function processErrorDetalles(detalles: any): Record<string, any> {
  const mapaErrores: Record<string, any> = {};

  for (const [campo, valor] of Object.entries(detalles)) {
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      mapaErrores[campo] = processNestedValue(valor);
    } else if (Array.isArray(valor)) {
      mapaErrores[campo] = valor.map(String);
    } else {
      mapaErrores[campo] = [String(valor)];
    }
  }
  
  return mapaErrores;
}

function flattenDetalles(detalles: any): string[] {
  if (!detalles || typeof detalles !== 'object') {
    return [];
  }

  return Object.values(detalles).flatMap((value: any) =>
    Array.isArray(value)
      ? value.map(String)
      : value && typeof value === 'object'
        ? flattenDetalles(value)
        : [String(value)]
  );
}

function buildErrorResponse(err: HttpErrorResponse, body: any, mapaErrores: any) {
  const mensajeGeneral = body?.error
    || (mapaErrores ? 'Error de validación. Revisa los campos registrados.' : 'Ocurrió un problema inesperado en el servidor.');
  const detalles = mapaErrores ? flattenDetalles(mapaErrores) : [];

  return throwError(() => ({
    status: err.status,
    mensajeGeneral,
    mensajeCompleto: [mensajeGeneral, ...detalles].join(' ').trim(),
    ...(mapaErrores && Object.keys(mapaErrores).length > 0 && { detalles: mapaErrores })
  }));
}

export const errorParserInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        authService.clearSession();
        router.navigate(['/login']);
        const mensaje = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
        return throwError(() => ({ status: 401, mensajeGeneral: mensaje, mensajeCompleto: mensaje }));
      }
      
      if (err.status === 0) {
        const mensaje = 'No se pudo conectar al servidor. Revisa tu conexión.';
        return throwError(() => ({ status: 0, mensajeGeneral: mensaje, mensajeCompleto: mensaje }));
      }

      const body = err.error && typeof err.error === 'object' ? (err.error as any) : null;
      let mapaErrores: any = null;

      if (body?.detalles && typeof body.detalles === 'object') {
        mapaErrores = processErrorDetalles(body.detalles);
      } else if (body && typeof body === 'object') {
        // DRF devuelve errores de validación en la raíz: { campo: [mensajes] }
        const erroresRaiz = Object.fromEntries(
          Object.entries(body).filter(([key]) => !['error', 'detail', 'detalles'].includes(key))
        );
        if (Object.keys(erroresRaiz).length > 0) {
          mapaErrores = processErrorDetalles(erroresRaiz);
        }
      }

      return buildErrorResponse(err, body, mapaErrores);
    })
  );
};
