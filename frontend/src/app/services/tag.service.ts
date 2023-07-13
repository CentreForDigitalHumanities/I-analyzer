import { Injectable } from '@angular/core';
import { Corpus, FoundDocument } from '../models';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag } from '../models';
import { tap } from 'rxjs/operators';

type TaggingActions = {
    op: 'add'|'remove';
    value: number;
}[];

@Injectable({
    providedIn: 'root'
})
export class TagService {
    /** all tags from the user */
    tags$: Observable<Tag[]>;

    constructor(private http: HttpClient) {
        this.fetch();
    }

    makeTag(name: string, description?: string): Observable<Tag> {
        return this.http.put<Tag>(this.tagUrl(), {name, description}).pipe(
            tap(this.fetch.bind(this))
        );
    }

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

    private fetch() {
        this.tags$ = this.http.get<Tag[]>(this.tagUrl());
    }

    private tagUrl(tag?: Tag) {
        return `/api/tag/tags${tag ? tag.id : ''}/`;
    }

    private documentTagUrl(document: FoundDocument): string {
        return `/api/tag/document_tags/${document.corpus.name}/${document.id}`;
    }
}
