import { inject, Injectable } from '@angular/core';
import { ApiConfigService } from '../../core/services/api-config.service';
import { Observable } from 'rxjs';
import { ContactResponse, ContactsListResponse, CreateContactRequest, GetContactsParams } from '../interfaces/contacto-interface';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})

export class ContactService {
  private readonly apiConfig = inject(ApiConfigService);
  private readonly http = inject(HttpClient);

  getContacts(params: GetContactsParams = {}): Observable<ContactsListResponse> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.ordering) {
      httpParams = httpParams.set('ordering', params.ordering);
    }

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    if (params.page_size) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }

    return this.http.get<ContactsListResponse>(
      this.apiConfig.contactosEndpoint(),
      { params: httpParams }
    );
  }

  getRoleById(id: number): Observable<ContactResponse> {
    return this.http.get<ContactResponse>(`${this.apiConfig.contactosEndpoint()}${id}/`);
  }

  createContact(contactData: CreateContactRequest): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(
      this.apiConfig.contactosEndpoint(),contactData
    );
  }

  updateContact(id: number, contactData: Partial<CreateContactRequest>): Observable<ContactResponse> {
    return this.http.put<ContactResponse>(`${this.apiConfig.contactosEndpoint()}${id}/`, contactData);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiConfig.contactosEndpoint()}${id}/`);
  }

}
