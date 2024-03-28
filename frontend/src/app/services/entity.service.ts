import { HttpClient } from '@angular/common/http';
import { Corpus, NamedEntitiesResult } from '../models';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class EntityService {

    constructor(private http: HttpClient) {
    }

    public async getDocumentEntities(corpus: Corpus, id: string): Promise<NamedEntitiesResult> {
        const url = `/api/es/${corpus.name}/${id}/named_entities`;
        return this.http.get<NamedEntitiesResult>(url).toPromise();
    }
}
