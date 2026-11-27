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

  searchTerm = signal<string>('');
  activeSort = signal<Sort>({ active: '', direction: '' });
  displayedColumns: string[] = ['id', 'nombre', 'ruc', 'email', 'telefono', 'estado', 'acciones'];
  clientes = signal<CustomerData[]>([]);
  totalCustomers = signal<number>(0);
  pageIndex = signal<number>(1);
  paginatorPageIndex = computed(() => this.pageIndex() - 1);
  pageSize = signal<number>(5);

  displayedCustomers = computed(() => {
    const currentCustomers = this.clientes();
    const search = this.searchTerm().toLowerCase().trim();
    let result = currentCustomers;

    if (search) {
      result = currentCustomers.filter(cliente => {
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

  private getSortValue(customer: CustomerData, field: string): string | number {
    switch (field) {
      case 'id': return customer.id ?? 0;
      case 'nombre': return customer.nombre_cliente ?? '';
      case 'ruc': return customer.ruc_cliente ?? '';
      case 'telefono': return customer.telefono ?? '';
      case 'estado': return customer.estado ?? '';
      default: return '';
    }
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value ?? '');
    this.pageIndex.set(1);
    this.loadCustomers();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadCustomers();
  }

  onSortChange(sort: Sort): void {
    this.activeSort.set(sort);
  }

  loadCustomers(): void {
    this.getCustomer();
  }

  private getCustomer(): void {
    this.customersService.getCustomers({
      search: this.searchTerm() || undefined,
      ordering: 'id_cliente',
      page: this.pageIndex(),
      page_size: this.pageSize()
    }).subscribe({
      next: (response: CustomersListResponse) => {
        const mappedCustomers = response.results.map(cliente => this.mapFromApiResponse(cliente));
        this.clientes.set(mappedCustomers);
        this.totalCustomers.set(response.count);
      },
      error: (error) => {
        console.log('Error al obtener los clientes', error)
      }
    });
  }

  private mapFromApiResponse(apiResponse: CustomerResponse): CustomerData {
    return {
      id: apiResponse.id_cliente || apiResponse.id || 0,
      nombre_cliente: apiResponse.nombre_cliente,
      ruc_cliente: apiResponse.ruc_cliente,
      email: apiResponse.email,
      telefono: apiResponse.telefono,
      direccion: apiResponse.direccion,
      estado: apiResponse.estado ? 'Activo' : 'Inactivo'
    };
  }

  openCustomerModal(customer: CustomerData | undefined, isReadOnly: boolean): void {
    const dialogRef = this.dialog.open(CustomerModal, {
      height: 'auto',
      data: customer ? { ...customer, isReadOnly } : undefined,
      disableClose: true,
      panelClass: 'custom-responsive-modal-customer'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.action !== 'cancel') {
        this.loadCustomers();
      }
    });
  }
  createCustomer(customer?: CustomerData): void {
    this.openCustomerModal(customer, false);
  }

  viewCustomer(customer: CustomerData): void {
    this.openCustomerModal(customer, true);
  }
}
