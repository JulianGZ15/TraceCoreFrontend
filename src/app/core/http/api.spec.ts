import { HttpErrorResponse } from '@angular/common/http';
import { errorMessage, readErrorMessage } from './api';

describe('API error messages', () => {
  it('does not describe a failed request as an invalid form submission', () => {
    const error = new HttpErrorResponse({ status: 400 });

    expect(errorMessage(error)).not.toContain('antes de enviar');
    expect(readErrorMessage(error)).toContain('No pudimos cargar la información');
    expect(readErrorMessage(error)).toContain('filtros');
  });

  it('keeps read not-found messages about unavailable information', () => {
    const error = new HttpErrorResponse({ status: 404 });

    expect(readErrorMessage(error)).toContain('información solicitada no está disponible');
  });
});
