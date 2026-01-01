import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { PaginatedResponse } from '../../interfaces/api.interface';
import { Contact, ContactQueryParams, UpdateContactDto } from '../../interfaces/contact.interface';
import { ContactsApiService } from '../api/contacts-api.service';

@Injectable({ providedIn: 'root' })
export class BackofficeContactsService {
  private readonly api = inject(ContactsApiService);
  private readonly cache = new Map<string, { ts: number; obs$: Observable<PaginatedResponse<Contact>> }>();
  private readonly CACHE_MS = 15_000;

  list(query?: ContactQueryParams): Observable<PaginatedResponse<Contact>> {
    const key = JSON.stringify(query || {});
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && now - hit.ts < this.CACHE_MS) return hit.obs$;

    const obs$ = this.api.list(query).pipe(shareReplay(1));
    this.cache.set(key, { ts: now, obs$ });
    return obs$;
  }

  update(id: string, dto: UpdateContactDto): Observable<Contact> {
    this.cache.clear();
    return this.api.update(id, dto);
  }

  delete(id: string): Observable<void> {
    this.cache.clear();
    return this.api.delete(id);
  }
}


