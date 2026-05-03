import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  
  private mediaQuery = window.matchMedia('(max-width: 767px)');

  // Signal que indica si estamos en móvil
  isMobile = signal(this.mediaQuery.matches);

  // Signal para controlar la apertura (en desktop empieza true, en móvil false)
  isOpen = signal(!this.mediaQuery.matches);

    constructor() {
    // Escuchamos el cambio de pantalla de forma óptima
    this.mediaQuery.addEventListener('change', (e) => {
      this.isMobile.set(e.matches);
      
      // Lógica automática: si pasa a escritorio, lo abrimos. 
      // Si pasa a móvil, lo cerramos.
      this.isOpen.set(!e.matches);
    });
  }

  toggle() {
    this.isOpen.update(value => !value);
  }

  close() {
    this.isOpen.set(false);
  }

}
