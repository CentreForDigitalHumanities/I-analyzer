import { Injectable } from '@angular/core';
import { FoundDocument } from '../models';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag } from '../models';
import { map, tap } from 'rxjs/operators';


interface DocumentTagsResponse {
    corpus: string;
    doc_id: string;
    tags: Tag[];
};


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
        return this.http.get<DocumentTagsResponse>(this.documentTagUrl(document)).pipe(
            map(response => response.tags)
        );
    }

    setDocumentTags(document: FoundDocument, tagIds: number[]): Observable<Tag[]> {
        return this.http.patch<DocumentTagsResponse>(
            this.documentTagUrl(document),
            { tags: tagIds }
        ).pipe(map(response => response.tags));
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
