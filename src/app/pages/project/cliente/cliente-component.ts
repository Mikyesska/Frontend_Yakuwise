import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { CustomerData, CustomerResponse, CustomersListResponse } from '../../../shared/interfaces/cliente-interface';
import { CustomerModal } from '../modals/customer-modal/customer-modal-component';
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent } from '../../../shared/components/button/button-component/button-component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClienteService } from '../../../shared/services/cliente.service';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-cliente-component',
  imports: [RouterLink, MatButtonModule, ButtonComponent, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule, FormsModule, MatTableModule, MatSortModule, MatPaginatorModule, MatTooltipModule, UpperCasePipe],
  templateUrl: './cliente-component.html',
  styleUrl: './cliente-component.scss',
})

export class ClienteComponent {

  constructor() {
    this.loadCustomers();
  }

  private readonly dialog = inject(MatDialog);
  private readonly customersService = inject(ClienteService);

  searchHide = signal(true);
  searchTerm = signal<string>('');
  activeSort = signal<Sort>({ active: '', direction: '' });
  displayedColumns: string[] = ['id', 'nombre', 'ruc', 'email', 'telefono', 'estado', 'acciones'];
  clientes = signal<CustomerData[]>([]);
  allCustomers = signal<CustomerData[]>([]); // Todos los clientes del backend
  totalCustomers = signal<number>(0);
  pageIndex = signal<number>(1);
  paginatorPageIndex = computed(() => this.pageIndex() - 1);
  pageSize = signal<number>(2);
  ordering = '';
  
  onSearchChange(value: string): void {
    console.log('onSearchChange llamado con valor:', value);
    this.searchHide.set(!this.searchHide());
    this.searchTerm.set(value ?? '');
    this.pageIndex.set(1); // Resetear a página 1 al buscar
    this.applyLocalPagination();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.applyLocalPagination();
  }

  onSortChange(sort: Sort): void { 
    this.activeSort.set(sort);
    this.pageIndex.set(1);
    this.loadCustomers();
  }
  
  loadCustomers(): void {
    console.log('Cargando clientes con búsqueda:', this.searchTerm());

    if (this.activeSort()?.active && this.activeSort()?.direction) {
      const field = this.mapSortField(this.activeSort().active);
      const direction = this.activeSort().direction === 'asc' ? '' : '-';
      this.ordering = `${direction}${field}`;
    }

    // Solo cargar del backend si no tenemos datos o es la primera carga
    if (this.allCustomers().length === 0) {
      this.getCustomer();
    } else {
      this.applyLocalPagination();
    }
  }

  private mapSortField(field: string): string { 
    const fieldMap: { [key: string]: string } = { 'id': 'id_cliente', 'nombre': 'nombre_cliente', 'estado': 'estado' }; 
    return fieldMap[field] || field; 
  }
  
  private getCustomer(): void {
    console.log('Parámetros de paginación enviados:', {
      search: this.searchTerm() || undefined,
      ordering: this.ordering || 'id_cliente',
      page: this.pageIndex(),
      page_size: this.pageSize()
    });

    this.customersService.getCustomers({
      search: this.searchTerm() || undefined,
      ordering: this.ordering || 'id_cliente',
      page: 1,
      page_size: 1000 // Obtener todos los registros para paginación local
    }).subscribe({
      next: (response: CustomersListResponse) => {
        console.log('Respuesta del backend:', {
          count: response.count,
          resultsLength: response.results.length,
          results: response.results
        });
        const mappedCustomers = response.results.map(cliente => this.mapFromApiResponse(cliente));
        this.allCustomers.set(mappedCustomers);
        this.totalCustomers.set(response.count);
        this.applyLocalPagination();
      },
      error: (error) => {
        console.log('Error al obtener los clientes',error)
      }
    });

  }

  private applyLocalPagination(): void {
    let filtered = this.allCustomers();

    // Aplicar búsqueda local
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(cliente => {
        return (
          cliente.nombre_cliente.toLowerCase().includes(search) ||
          cliente.ruc_cliente.toLowerCase().includes(search) ||
          cliente.email.toLowerCase().includes(search) ||
          cliente.telefono.toLowerCase().includes(search) ||
          cliente.direccion.toLowerCase().includes(search) ||
          cliente.estado.toLowerCase().includes(search) ||
          cliente.id?.toString().includes(search)
        );
      });
    }

    this.totalCustomers.set(filtered.length);

    // Aplicar paginación local
    const startIndex = (this.pageIndex() - 1) * this.pageSize();
    const endIndex = startIndex + this.pageSize();
    const paginatedCustomers = filtered.slice(startIndex, endIndex);
    this.clientes.set(paginatedCustomers);
  }

  private mapFromApiResponse(apiResponse: CustomerResponse): CustomerData { 
    return { 
      id: apiResponse.id_cliente || apiResponse.id || 0, 
      nombre_cliente: apiResponse.nombre_cliente,
      ruc_cliente: apiResponse.ruc_cliente,
      email: apiResponse.email,
      telefono:apiResponse.telefono,
      direccion: apiResponse.direccion,
      estado: apiResponse.estado ? 'Activo' : 'Inactivo'
    }; 
  }

  openCustomerModal(customer: CustomerData | undefined, isReadOnly: boolean): void {
    const dialogRef = this.dialog.open(CustomerModal, {
      height: 'auto',
      data: customer ? { ...customer, isReadOnly}: undefined,
      disableClose: true,
      panelClass: 'custom-responsive-modal-customer'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action !== 'cancel') {
        // Recargar del backend después de crear/actualizar
        this.allCustomers.set([]);
        this.getCustomer();
      }
    });
  }
  createCustomer(customer?: CustomerData): void {
    this.openCustomerModal(customer, false);
  }
  
  viewCustomer(customer: CustomerData):void {
    this.openCustomerModal(customer, true);
  }
}
