export interface ContactData {
    id_contacto?: number;
    area: string;
    nombre_contacto?: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    email_contacto: string;
    telefono_contacto: string;
    estado: boolean;
    id_cliente: number;
    nombre_cliente?: string;
}

export interface CreateContactRequest extends Omit<ContactData, 'nombre_contacto' | 'nombre_cliente'> {}

export interface ContactResponse {
  id_contacto: number;
  area: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  email_contacto: string;
  telefono_contacto: string;
  estado: boolean;
  id_cliente: number;
  nombre_cliente: string;
}

export interface ContactsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ContactResponse[];
}

export interface GetContactsParams {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}
