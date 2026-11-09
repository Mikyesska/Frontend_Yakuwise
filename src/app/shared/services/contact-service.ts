import { inject, Injectable } from '@angular/core';
import { ApiConfigService } from '../../core/services/api-config.service';
import { Observable } from 'rxjs';
import { ContactsListResponse, GetContactsParams } from '../interfaces/contacto-interface';
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
}
