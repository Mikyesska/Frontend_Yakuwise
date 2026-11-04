import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { SidebarService } from '../../../../shared/services/sidebar.service';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterLink } from "@angular/router";
import { AuthService } from '../../../../core/services/auth.service';
import { LoginResponse } from '../../../../shared/interfaces/login-interface';
import { Subscription } from 'rxjs';
import { SubtitlePipe } from '../../../../shared/pipes/subtitle-pipe';

@Component({
  selector: 'app-sidebar-component',
  imports: [CommonModule, RouterLink, TitleCasePipe, SubtitlePipe],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {

  // Inyectamos el servicio (usamos protected para que el HTML lo vea)
  protected sidebarService = inject(SidebarService);
  private readonly authService = inject(AuthService);

  userData: LoginResponse['data'] | null = null;
  selectedRoleId: number | null = null;
  private roleSubscription: Subscription | null = null;
  private userDataSubscription: Subscription | null = null;

  ngOnInit() {
    this.userData = this.authService.getUserData();
    
    if (this.userData) {
      this.selectedRoleId = this.authService.getSelectedRole();
      if (!this.selectedRoleId) {
        this.selectedRoleId = this.authService.getDefaultRole(this.userData);
        this.authService.saveSelectedRole(this.selectedRoleId);
      }
    }

    // Subscribe to userData changes
    this.userDataSubscription = this.authService.userData$.subscribe(userData => {
      this.userData = userData;
      if (userData) {
        this.selectedRoleId = this.authService.getSelectedRole();
        if (!this.selectedRoleId) {
          this.selectedRoleId = this.authService.getDefaultRole(userData);
          this.authService.saveSelectedRole(this.selectedRoleId);
        }
      }
    });

    // Subscribe to role changes
    this.roleSubscription = this.authService.selectedRole$.subscribe(roleId => {
      // Protect against null roleId - if null, get it from localStorage
      if (roleId === null) {
        const savedRoleId = this.authService.getSelectedRole();
        if (savedRoleId) {
          this.selectedRoleId = savedRoleId;
        }
      } else {
        this.selectedRoleId = roleId;
      }
    });
  }

  ngOnDestroy() {
    if (this.roleSubscription) {
      this.roleSubscription.unsubscribe();
    }
    if (this.userDataSubscription) {
      this.userDataSubscription.unsubscribe();
    }
  }

  // Verificar si el usuario tiene acceso a un menú basado en el rol seleccionado
  hasMenuAccess(menuRoles: { id_rol: number; nombre_rol: string }[] | undefined): boolean {
    if (!menuRoles || menuRoles.length === 0) return false;
    return menuRoles.some(role => role.id_rol === this.selectedRoleId);
  }

  // Filtrar menús que el usuario puede ver
  getFilteredMenus(menus: any[]) {
    return menus.filter(menu => 
      menu.estado && 
      this.hasMenuAccess(menu.roles)
    );
  }

  // Obtener menús de nivel 1 (sin dependencia)
  getLevel1Menus(menus: any[]) {
    return this.getFilteredMenus(menus).filter(menu => menu.nivel === 1 && !menu.id_depende);
  }

  // Obtener menús de nivel 2 (con dependencia)
  getLevel2Menus(menus: any[], parentId: number) {
    return this.getFilteredMenus(menus).filter(menu => menu.nivel === 2 && menu.id_depende === parentId);
  }

  // Mapa de iconos del menú - más fácil de mantener y agregar nuevos iconos
  private readonly menuIcons = [
    { keywords: ['rol', 'role'], icon: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z' },
    { keywords: ['cliente', 'client'], icon: 'M1,20V16q0-0.85 0.59-1.43T3,14H6.28q0.5,0 0.95,0.25t0.72,0.67q0.73,0.98 1.79,1.53T12,17q1.23,0 2.29-0.55t1.76-1.53q0.32-0.42 0.76-0.67T17.73,14H21q0.85,0 1.43,0.57T23,16v4H16V17.73q-0.88,0.63-1.89,0.95T12,19q-1.07,0-2.1-0.34T8,17.7V20H1Zm11-4q-0.95,0-1.8-0.44T8.78,14.35q-0.43-0.63-1.06-0.99T6.33,13q0.55-0.93 2.33-1.46T12,11t3.35,0.54T17.68,13q-0.73,0-1.38,0.36q-0.65,0.36-1.07,0.99q-0.55,0.8-1.4,1.22T12,16ZM4,13q-1.25,0-2.13-0.88T1,10Q1,8.73 1.88,7.86T4,7Q5.28,7 6.14,7.86T7,10q0,1.25-0.86,2.13T4,13Zm16,0q-1.25,0-2.13-0.88T17,10q0-1.28 0.88-2.14T20,7q1.28,0 2.14,0.86T23,10q0,1.25-0.86,2.13T20,13Zm-8-3q-1.25,0-2.13-0.88T9,7Q9,5.72 9.88,4.86T12,4q1.28,0 2.14,0.86Q15,5.72 15,7q0,1.25-0.86,2.13T12,10Z' },
    { keywords: ['usuario', 'user'], icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { keywords: ['modulo', 'module'], icon: 'M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z' },
    { keywords: ['menu'], icon: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z' },
    { keywords: ['proyecto','project'], icon: 'M5,21q-0.83,0-1.41-0.59T3,19V5Q3,4.17 3.59,3.59T5,3H9.2q0.32-0.9 1.09-1.45T12,1t1.71,0.55T14.8,3H19q0.83,0 1.41,0.59T21,5V19q0,0.82-0.59,1.41T19,21H5Zm0-2H19V5H5V19Zm2-2h7V15H7v2Zm0-4H17V11H7v2ZM7,9H17V7H7V9Zm5.54-4.96q0.21-0.21 0.21-0.54q0-0.33-0.21-0.54T12,2.75T11.46,2.96T11.25,3.5q0,0.32 0.21,0.54T12,4.25t0.54-0.21ZM5,19V5V19Z' },
    // { keywords: ['',''], icon: '' },
    
    { keywords: ['contacto','contact'], icon: 'M19 2H5c-.55 0-1 .45-1 1v4H2v2h2v2H2v2h2v2H2v2h2v4c0 .55.45 1 1 1h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-6.5 5C13.93 7 15 8.07 15 9.5S13.93 12 12.5 12S10 10.93 10 9.5S11.07 7 12.5 7M17 17H8v-1c0-1.66 1.34-3 3-3h3c1.66 0 3 1.34 3 3z' },
    
  ];

  // Icono genérico para menús sin icono específico
  private readonly defaultIcon = 'M19.14 12.94c.04-.3.06-.61.06-.94c0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59-.24-1.13.57-1.62-.94l-2.39-.96c-.22-.08-.47 0-.59.22L5.09 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23-.41-.12.61l1.92 3.32c.12-.22.37-.29+.59.22l2.39-.96c.5.38 1.03+.7 1.62.94l.36 2.54c.05-.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24-1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6s3.6 1.62 3.6 3.6s-1.62 3.6-3.6 3.6z';

  // Obtener icono según el nombre del menú
  getMenuIcon(menuName: string): string {
    const lowerName = menuName.toLowerCase();

    for (const item of this.menuIcons) {
      if (item.keywords.some(keyword => lowerName.includes(keyword))) {
        return item.icon;
      }
    }

    return this.defaultIcon;
  }

  // Cerrar sidebar en móvil al seleccionar un menú
  closeSidebarOnMobile(): void {
    if (this.sidebarService.isMobile()) {
      this.sidebarService.close();
    }
  }

}
