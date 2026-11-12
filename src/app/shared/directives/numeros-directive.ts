import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[soloNumeros]',
})

export class NumerosDirective {
  @HostListener('input', ['$event'])

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart;
    const val = input.value.replace(/\D/g, '').slice(0, 9);

    if (input.value !== val) {
      input.value = val;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.setSelectionRange(start, start);
    }
  }
}
