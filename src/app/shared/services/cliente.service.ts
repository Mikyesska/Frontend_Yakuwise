import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiConfigService } from '../../core/services/api-config.service';
import { CreateCustomerRequest, CustomerResponse, CustomersListResponse, GetCustomersParams } from '../interfaces/cliente-interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})

export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfigService);

  createCustomer(customerData: CreateCustomerRequest) {
    return this.http.post<CustomerResponse>(
      this.apiConfig.clientesEndpoint(),
      customerData
    );
  }

  updateCustomer(id: number, customerData: Partial<CreateCustomerRequest>): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.apiConfig.clientesEndpoint()}${id}/`, customerData);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiConfig.clientesEndpoint()}${id}/`);
  }
  
  getCustomerById(id: number): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiConfig.clientesEndpoint()}${id}/`);
  }
  getCustomers(params: GetCustomersParams = {}): Observable<CustomersListResponse> {
    let httpParams = new HttpParams();

    if (params.search !== undefined && params.search !== null) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.ordering !== undefined && params.ordering !== null) {
      httpParams = httpParams.set('ordering', params.ordering);
    }

    if (params.page !== undefined && params.page !== null) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.page_size !== undefined && params.page_size !== null) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }

    return this.http.get<CustomersListResponse>(
      this.apiConfig.clientesEndpoint(),
      { params: httpParams }
    );
  }
}
