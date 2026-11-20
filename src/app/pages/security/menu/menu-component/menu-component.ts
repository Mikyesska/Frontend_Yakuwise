import { Component, computed, inject, signal } from '@angular/core'; 
import { ButtonComponent } from "../../../../shared"; 
import { RouterLink } from "@angular/router"; 
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator'; 
import { MatSortModule, Sort } from '@angular/material/sort'; 
import { MatTableModule } from '@angular/material/table'; 
import { MatInputModule } from '@angular/material/input'; 
import { MatFormFieldModule } from '@angular/material/form-field'; 
import { MatTooltipModule } from '@angular/material/tooltip'; 
import { MatDialog } from '@angular/material/dialog'; 
import { FormsModule } from '@angular/forms'; 
import { MenuModalComponent } from '../../modals/menu-modal-component/menu-modal-component';
import { MenusService } from '../../../../shared/services/menus.service';
import { MatIconModule } from '@angular/material/icon'; 
import { MatButtonModule } from '@angular/material/button'; 
import { MatChipsModule } from '@angular/material/chips';
import { MenuResponse, MenusListResponse, MenuData } from '../../../../shared/interfaces/menus-interface';
import { AssignRolesModalComponent, AssignRolesData } from '../../modals/assign-roles-modal/assign-roles-modal.component';
import { SubtitlePipe } from '../../../../shared/pipes/subtitle-pipe';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-menu-component',
  imports: [ButtonComponent, RouterLink, MatFormFieldModule, MatInputModule, MatTableModule, MatSortModule, MatPaginatorModule, MatTooltipModule, FormsModule, MatIconModule, MatButtonModule, MatChipsModule, SubtitlePipe, UpperCasePipe],
  templateUrl: './menu-component.html',
  styleUrl: './menu-component.scss',
})

export class MenuComponent { 
  private readonly dialog = inject(MatDialog); 
  private readonly menusService = inject(MenusService);
  
  displayedColumns: string[] = ['id_menu', 'nombre_modulo','nombre_menu', 'roles', 'estado', 'actions']; 
  menus = signal<MenuData[]>([]); 
  allMenus = signal<MenuData[]>([]);
  totalMenus = signal<number>(0); 
  pageIndex = signal<number>(1); 
  pageSize = signal<number>(5); 
  activeSort = signal<Sort>({ active: '', direction: '' }); 
  paginatorPageIndex = computed(() => this.pageIndex() - 1); 
  searchTerm = signal<string>('');

  constructor() { 
    this.loadMenus(); 
    this.loadAllMenus();
  } 

  loadAllMenus(): void {
    this.menusService.getMenus({ page: 1, page_size: 1000 }).subscribe({
      next: (response: MenusListResponse) => {
        const mappedMenus = response.results.map(menu => this.mapFromApiResponse(menu));
        this.allMenus.set(mappedMenus);
      },
      error: (error) => {
        console.log('error al obtener todos los menús', error);
      }
    });
  }

  loadMenus(): void { 
    const rawSearch = this.searchTerm().toLowerCase().trim(); 
    const palabrasEstado = ['activo', 'inactivo', 'act', 'inac', 'ina', 'activ', 'inactiv']; 
    const esBusquedaDeEstado = palabrasEstado.includes(rawSearch); 
    const apiSearchParam = esBusquedaDeEstado ? undefined : (this.searchTerm() || undefined); 

    this.menusService.getMenus({ 
      search: apiSearchParam, 
      ordering: 'id_menu', 
      page: this.pageIndex(), 
      page_size: this.pageSize() 
    }).subscribe({ 
      next: (response: MenusListResponse) => { 
        const mappedMenus = response.results.map(menu => this.mapFromApiResponse(menu)); 
        this.menus.set(mappedMenus); 
        this.totalMenus.set(response.count); 
      },
      error: (error) => {
        console.log('error al obtener menús', error)
      }
    });
  } 

  displayedMenus = computed(() => { 
    const currentMenus = this.menus(); 
    const search = this.searchTerm().toLowerCase().trim(); 
    let result = currentMenus;
    if (search) {
      result = currentMenus.filter(menu => { 
        const menuNameLower = menu.nombre_menu.toLowerCase(); 
        const menuModuloLower = menu.nombre_modulo.toLowerCase();
        const menuRolesNames = menu.roles?.map(r => r.nombre_rol.toLowerCase()).join(' ') || '';
        const menuStateStr = menu.estado ? 'activo' : 'inactivo'; 
        const menuIdStr = menu.id_menu?.toString() || ''; 
        if (['activo', 'inactivo'].includes(search)) return menuStateStr === search; 
        if (['act', 'activ', 'activo'].includes(search)) return menuStateStr === 'activo'; 
        if (['inac', 'ina', 'inactiv', 'inactivo'].includes(search)) return menuStateStr === 'inactivo'; 
        return menuNameLower.includes(search) || menuModuloLower.includes(search) || menuRolesNames.includes(search) || menuIdStr.includes(search); 
      });
    }
    const sort = this.activeSort();
    if (sort.active && sort.direction) {
      const direction = sort.direction === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        const valueA = this.getSortValue(a, sort.active);
        const valueB = this.getSortValue(b, sort.active);
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return (valueA - valueB) * direction;
        }
        return String(valueA ?? '').localeCompare(String(valueB ?? ''), 'es') * direction;
      });
    }
    return result;
  });

  private getSortValue(menu: MenuData, field: string): string | number {
    switch (field) {
      case 'id_menu': return menu.id_menu;
      case 'nombre_menu': return menu.nombre_menu ?? '';
      case 'nombre_modulo': return menu.nombre_modulo ?? '';
      default: return '';
    }
  }
  
  onSearchChange(value: string): void { 
    this.searchTerm.set(value ?? ''); 
    this.loadMenus(); 
  } 

  onPageChange(event: PageEvent): void { 
    this.pageIndex.set(event.pageIndex + 1); 
    this.pageSize.set(event.pageSize); 
    this.loadMenus(); 
  } 

  onSortChange(sort: Sort): void { 
    this.activeSort.set(sort); 
  } 

  private mapFromApiResponse(apiResponse: MenuResponse): MenuData { 
    return { 
      id_menu: apiResponse.id_menu || apiResponse.id || 0, 
      nombre_menu: apiResponse.nombre_menu,
      nombre_modulo: apiResponse.nombre_modulo,
      ruta: apiResponse.ruta,
      nivel: apiResponse.nivel,
      orden: apiResponse.orden,
      estado: apiResponse.estado,
      id_modulo: apiResponse.id_modulo,
      roles: apiResponse.roles || [],
      id_depende: apiResponse.id_depende || 0
    }; 
  }

  
  createMenu(menu?: MenuData): void {
    this.openModalCreateMenu(menu, false);
  }
  
  viewMenu(menu: MenuData): void {
    this.openModalCreateMenu(menu, true);
  }

  private openModalCreateMenu(menu?: MenuData, isReadOnly?: boolean): void { 
    const menuPadreNombre = menu?.id_depende
      ? this.allMenus().find(m => m.id_menu === menu.id_depende)?.nombre_menu ?? ''
      : '';
    const dialogRef = this.dialog.open(MenuModalComponent, { 
      height: 'max-content', 
      data: menu ? { ...menu, isReadOnly, menuPadreNombre } : null, 
      disableClose: true,
      panelClass: 'custom-responsive-modal-menus'
    }); 

    dialogRef.afterClosed().subscribe((result) => { 
      if (result && result.action !== 'cancel') { 
        this.loadMenus(); 
        this.loadAllMenus();
      } 
    }); 
  }

  openAssignRolesModal(menu: MenuData): void {
    const dialogRef = this.dialog.open(AssignRolesModalComponent, {
      width: '30rem',
      height: 'auto',
      minHeight: '20rem',
      data: {
        menuId: menu.id_menu,
        menuName: menu.nombre_menu
      } as AssignRolesData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMenus();
        this.loadAllMenus();
      }
    });
  }

  
}