import { Component, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button-component/button-component';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, Sort, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ContactData, ContactResponse, ContactsListResponse } from '../../../shared/interfaces/contacto-interface';
import { MatDialog } from '@angular/material/dialog';
import { ContactModal } from '../modals/contact-modal/contact-modal';
import { ContactService } from '../../../shared/services/contact-service';
import { AlertService } from '../../../shared/services/alert.service';
import { ClienteService } from '../../../shared/services/cliente.service';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-contacto-component',
  imports: [RouterLink, MatButtonModule, ButtonComponent, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule, FormsModule, MatTableModule, MatSortModule, MatPaginatorModule, MatTooltipModule, UpperCasePipe],
  templateUrl: './contacto-component.html',
  styleUrl: './contacto-component.scss',
})

export class ContactoComponent implements AfterViewInit {
  private readonly dialog = inject(MatDialog);
  private readonly contactService = inject(ContactService);
  private readonly clienteService = inject(ClienteService);
  private readonly alertService = inject(AlertService);
  private readonly DEFAULT_PAGE_SIZE = 5;
  private readonly DEFAULT_ORDERING = 'id_contacto';

  readonly dataSource = new MatTableDataSource<ContactData>([]);
  readonly isLoading = signal<boolean>(false);
  readonly activeSort = signal<Sort>({ active: '', direction: '' });
  readonly pageSize = signal<number>(this.DEFAULT_PAGE_SIZE);
  readonly searchTerm = signal<string>('');
  readonly pageIndex = signal<number>(1);
  readonly totalContacts = signal<number>(0);
  readonly clientesMap = signal<Map<number, string>>(new Map());
  
  readonly displayedColumns: string[] = ['id', 'nombre_contacto', 'area', 'nombre_cliente', 'email_contacto', 'telefono_contacto', 'estado', 'accion'];

  @ViewChild('sort') sort!: MatSort;

  constructor() {
    this.loadClientes();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }
  
  onSearchChange(value: string): void {
    this.searchTerm.set(value ?? '');
    this.pageIndex.set(1);
    this.loadContacts();
  }

  openContactModal(contact: ContactData | undefined, isReadOnly: boolean): void {
    this.dialog.open(ContactModal, {
      height: 'auto',
      data: contact ? { ...contact, isReadOnly}: undefined,
      disableClose: true,
      panelClass: 'custom-responsive-modal-contact'
    });
  }

  createContact(contact?: ContactData): void {
    this.openContactModal(contact, false);
  }
  
  viewContact(contact: ContactData):void {
    this.openContactModal(contact, true);
  }

  onSortChange(sort: Sort): void {
    this.activeSort.set(sort);
    this.pageIndex.set(1);
    this.loadContacts();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadContacts();
  }

  loadClientes(): void {
    this.clienteService.getCustomers({ page_size: 10 }).subscribe({
      next: (response) => {
        const map = new Map<number, string>();
        response.results.forEach(cliente => {
          if (cliente.id_cliente !== undefined) {
            map.set(cliente.id_cliente, cliente.nombre_cliente);
          }
        });
        this.clientesMap.set(map);
        this.loadContacts();
      },
      error: (error) => {
        console.error('Error loading clientes:', error);
        this.loadContacts();
      }
    });
  }

  loadContacts(): void {
    this.isLoading.set(true);
    const ordering = this.buildOrdering();
    const searchParam = this.buildSearchParam();

    this.contactService.getContacts({
      search: searchParam,
      ordering: ordering,
      page: this.pageIndex(),
      page_size: this.pageSize()
    }).subscribe({
      next: (response: ContactsListResponse) => this.handleContactsResponse(response),
      error: () => this.handleLoadError()
    });
  }

  private handleContactsResponse(response: ContactsListResponse): void {
    const mappedContacts = response.results
      .map(contact => this.mapFromApiResponse(contact))
      .filter((contact): contact is ContactData => contact !== null);

    this.dataSource.data = mappedContacts;
    this.isLoading.set(false);
    this.totalContacts.set(response.count);
    console.log('Mapped contacts:', mappedContacts);
  }

  private mapFromApiResponse(apiResponse: ContactResponse): ContactData | null {
    const id_cliente = (apiResponse as any).id_cliente || 0;
    const clientes = this.clientesMap();
    const nombre_cliente = clientes.get(id_cliente) || 'Cliente ID: ' + id_cliente;

    return {
      id_contacto: apiResponse.id_contacto,
      area: apiResponse.area,
      nombre_contacto: `${apiResponse.nombres} ${apiResponse.apellido_paterno} ${apiResponse.apellido_materno}`,
      email_contacto: apiResponse.email_contacto,
      telefono_contacto: apiResponse.telefono_contacto,
      estado: this.formatEstado(apiResponse.estado),
      id_cliente: id_cliente,
      nombre_cliente: nombre_cliente
    };
  }

  private formatEstado(estado: boolean): string {
    return estado ? 'Activo' : 'Inactivo';
  }

  private handleLoadError(): void {
    this.alertService.error("Error al cargar contactos. Por favor, inténtelo de nuevo.");
    this.isLoading.set(false);
  }

  private buildSearchParam(): string | undefined {
    return this.searchTerm() || undefined;
  }

  private buildOrdering(): string {
    const sort = this.activeSort();
    if (!sort.active || !sort.direction) {
      return this.DEFAULT_ORDERING;
    }

    const field = this.mapSortField(sort.active);
    const direction = sort.direction === 'asc' ? '' : '-';
    return `${direction}${field}`;
  }

  private mapSortField(field: string): string {
    return {
      'id': 'id_contacto',
      'area': 'area',
      'nombre_contacto': 'nombres',
      'email_contacto': 'email_contacto',
      'telefono_contacto': 'telefono_contacto',
      'estado': 'estado',
      'nombre_cliente': 'clientes__nombre_cliente'
    }[field] || field;
  }
}
