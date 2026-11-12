import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DigitosDirective } from './digitos.directive';

@Component({
  imports: [ReactiveFormsModule, DigitosDirective],
  template: `<input appDigitos [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl('');
}

describe('DigitosDirective', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const escribir = (texto: string) => {
      input.value = texto;
      input.dispatchEvent(new Event('input'));
    };
    return { control: fixture.componentInstance.control, input, escribir };
  }

  it('elimina caracteres no numéricos', () => {
    const { control, input, escribir } = setup();
    escribir('12a3-45 67');
    expect(input.value).toBe('1234567');
    expect(control.value).toBe('1234567');
  });

  it('limita a 9 dígitos', () => {
    const { control, escribir } = setup();
    escribir('12345678901');
    expect(control.value).toBe('123456789');
  });

  it('es válido con 7, 8 y 9 dígitos', () => {
    const { control, escribir } = setup();
    for (const valor of ['1234567', '12345678', '123456789']) {
      escribir(valor);
      expect(control.valid).toBe(true);
    }
  });

  it('es inválido con menos de 7 dígitos', () => {
    const { control, escribir } = setup();
    escribir('123456');
    expect(control.errors).toEqual({ digitos: { min: 7, max: 9, actual: 6 } });
  });

  it('valida valores asignados por código', () => {
    const { control } = setup();
    control.setValue('12a4567');
    expect(control.hasError('digitos')).toBe(true);
  });

  it('no marca error cuando está vacío', () => {
    const { control } = setup();
    expect(control.valid).toBe(true);
  });

  it('agrega inputmode numérico y maxlength', () => {
    const { input } = setup();
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('maxlength')).toBe('9');
  });
});
