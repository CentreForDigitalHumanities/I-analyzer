import { Injectable } from '@angular/core';
import { Corpus, FoundDocument } from '../models';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag } from '../models';

type TaggingActions = {
    op: 'add'|'remove';
    value: number;
}[];

@Injectable({
    providedIn: 'root'
})
export class TagService {

    constructor(private http: HttpClient) { }

    getDocumentTags(document: FoundDocument): Observable<Tag[]> {
        return this.http.get<Tag[]>(this.documentTagUrl(document));
    }

    addDocumentTag(document: FoundDocument, tag: Tag): Observable<any> {
        const data: TaggingActions = [{op: 'add', value: tag.id}];
        return this.http.patch(this.documentTagUrl(document), data);
    }

    removeDocumentTag(document: FoundDocument, tag: Tag): Observable<any> {
        const data: TaggingActions = [{op: 'remove', value: tag.id}];
        return this.http.patch(this.documentTagUrl(document), data);
    }

    private documentTagUrl(document: FoundDocument): string {
        return `/api/tag/document_tags/${document.corpus.name}/${document.id}`;
    }
}
