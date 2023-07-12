import { Injectable } from '@angular/core';
import { Corpus, FoundDocument } from '../models';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag } from '../models';


@Injectable({
    providedIn: 'root'
})
export class TagService {

    constructor(private http: HttpClient) { }

    getDocumentTags(corpus: Corpus, document: FoundDocument): Observable<Tag[]> {
        return this.http.get<Tag[]>(`/api/tag/document_tags/${corpus.name}/${document.id}`);
    }
}
