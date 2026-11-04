export interface CustomerData {
    id?: number;
    nombre_cliente: string;
    ruc_cliente: string;
    email: string;
    telefono: string;
    direccion: string;
    estado: string;
}
export interface CreateCustomerRequest {
    nombre_cliente: string;
    ruc_cliente: string;
    email: string;
    telefono: string;
    direccion: string;
    estado: boolean;
}
export interface CustomerResponse {
    id?: number;
    id_cliente?: number;
    nombre_cliente: string;
    ruc_cliente: string;
    email: string;
    telefono: string;
    direccion: string;
    estado: boolean;
}

export interface GetCustomersParams {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  estado?: boolean;
}

export interface CustomersListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomerResponse[];
}
