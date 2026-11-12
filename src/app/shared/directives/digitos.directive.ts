import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';

export const MIN_DIGITOS = 7;
export const MAX_DIGITOS = 9;

const PATRON_DIGITOS = new RegExp(`^\\d{${MIN_DIGITOS},${MAX_DIGITOS}}$`);

/**
 * Restringe un input a solo dígitos numéricos (máximo 9) y lo valida
 * para que tenga entre 7 y 9 dígitos. Error: `{ digitos: { min, max, actual } }`.
 */
@Directive({
  selector: 'input[appDigitos]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => DigitosDirective), multi: true },
  ],
  host: {
    inputmode: 'numeric',
    autocomplete: 'off',
    '[attr.maxlength]': 'max',
    '(input)': 'onInput()',
  },
})
export class DigitosDirective implements Validator {
  protected readonly max = MAX_DIGITOS;
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  protected onInput(): void {
    const input = this.el.nativeElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, MAX_DIGITOS);
    if (input.value !== limpio) {
      input.value = limpio;
      input.dispatchEvent(new Event('input'));
    }
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const valor = control.value == null ? '' : String(control.value);
    if (valor === '' || PATRON_DIGITOS.test(valor)) {
      return null;
    }
    return { digitos: { min: MIN_DIGITOS, max: MAX_DIGITOS, actual: valor.length } };
  }
}
