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
  imports: [RouterLink, MatButtonModule, ButtonComponent, MatInputModule, MatFormFieldModule, MatIconModule, FormsModule, MatTableModule, MatSortModule, MatPaginatorModule, MatTooltipModule, UpperCasePipe],
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
  readonly activeSort = signal<Sort>({ active: '', direction: '' });
  readonly pageSize = signal<number>(this.DEFAULT_PAGE_SIZE);
  readonly searchTerm = signal<string>('');
  readonly pageIndex = signal<number>(1);
  readonly totalContacts = signal<number>(0);
  readonly clientesMap = signal<Map<number, string>>(new Map());
  private readonly allContacts = signal<ContactData[]>([]);
  private readonly estadoFilter = signal<boolean | null>(null);
  
  readonly displayedColumns: string[] = ['id', 'nombre_contacto', 'area', 'nombre_cliente', 'email_contacto', 'telefono_contacto', 'estado', 'accion'];

  @ViewChild('sort') sort!: MatSort;

  constructor() {
    this.loadClientes();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }
  
  onSearchChange(value: string): void {
    const term = (value ?? '').trim().toLowerCase();
    this.searchTerm.set(value ?? '');
    this.estadoFilter.set(this.resolveEstadoFilter(term));
    this.pageIndex.set(1);
    this.loadContacts();
  }

  openContactModal(contact?: ContactData ): void {
    const dialogRef = this.dialog.open(ContactModal, {
      data: contact,
      disableClose: true,
      panelClass: 'custom-responsive-modal-contact'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadContacts();
      }
    });
  }

  createContact(contact: ContactData): void {
    this.openContactModal(contact);
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
    this.clienteService.getCustomers({ page_size: 1000 }).subscribe({
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
    if (this.searchTerm()) {
      this.loadAllContactsForSearch();
      return;
    }

    const ordering = this.buildOrdering();

    this.contactService.getContacts({
      ordering: ordering,
      page: this.pageIndex(),
      page_size: this.pageSize()
    }).subscribe({
      next: (response: ContactsListResponse) => this.handleContactsResponse(response),
      error: () => this.handleLoadError()
    });
  }

  private loadAllContactsForSearch(): void {
    this.contactService.getContacts({
      ordering: this.buildOrdering(),
      page: 1,
      page_size: 100
    }).subscribe({
      next: (response: ContactsListResponse) => {
        const contacts = response.results.map(contact => this.mapFromApiResponse(contact));
        this.allContacts.set(contacts);
        this.applyLocalPagination();
      },
      error: () => this.handleLoadError()
    });
  }

  private applyLocalPagination(): void {
    const estadoFilter = this.estadoFilter();
    const search = this.searchTerm().toLowerCase().trim();

    let filtered = this.allContacts();
    if (estadoFilter !== null) {
      filtered = filtered.filter(contact => contact.estado === estadoFilter);
    } else if (search) {
      filtered = filtered.filter(contact =>
        (contact.nombre_contacto ?? '').toLowerCase().includes(search) ||
        (contact.area ?? '').toLowerCase().includes(search) ||
        (contact.email_contacto ?? '').toLowerCase().includes(search) ||
        (contact.telefono_contacto ?? '').toLowerCase().includes(search) ||
        (contact.nombre_cliente ?? '').toLowerCase().includes(search) ||
        contact.id_contacto?.toString().includes(search)
      );
    }

    this.totalContacts.set(filtered.length);
    const startIndex = (this.pageIndex() - 1) * this.pageSize();
    this.dataSource.data = filtered.slice(startIndex, startIndex + this.pageSize());
  }

  private handleContactsResponse(response: ContactsListResponse): void {
    this.dataSource.data = response.results.map(contact => this.mapFromApiResponse(contact));
    this.totalContacts.set(response.count);
  }

  private mapFromApiResponse(apiResponse: ContactResponse): ContactData {
    const id_cliente = apiResponse.id_cliente;
    const clientes = this.clientesMap();
    const nombre_cliente = clientes.get(id_cliente) || 'Cliente ID: ' + id_cliente;

    return {
      id_contacto: apiResponse.id_contacto,
      area: apiResponse.area,
      nombres: apiResponse.nombres,
      apellido_paterno: apiResponse.apellido_paterno,
      apellido_materno: apiResponse.apellido_materno,
      nombre_contacto: `${apiResponse.nombres} ${apiResponse.apellido_paterno} ${apiResponse.apellido_materno}`,
      email_contacto: apiResponse.email_contacto,
      telefono_contacto: apiResponse.telefono_contacto,
      estado: apiResponse.estado,
      id_cliente: id_cliente,
      nombre_cliente: nombre_cliente
    };
  }

  private resolveEstadoFilter(term: string): boolean | null {
    if (term.startsWith('inac')) return false;
    if (term.startsWith('act')) return true;
    return null;
  }

  private handleLoadError(): void {
    this.alertService.error("Error al cargar contactos. Por favor, inténtelo de nuevo.");
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
