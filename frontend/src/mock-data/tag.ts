import { Observable, of } from 'rxjs';
import { FoundDocument, Tag } from '../app/models';
import { tap } from 'rxjs/operators';

export const mockTags: Tag[] = [
    {
        id: 1,
        name: 'fascinating',
        description: 'interesting documents',
        count: 2
    }, {
        id: 2,
        name: 'boring',
        description: 'useless documents',
        count: 1
    }
];

export class TagServiceMock {
    tags$ = of(mockTags);

    getDocumentTags(document: FoundDocument): Observable<Tag[]> {
        return of(mockTags);
    }

    makeTag(name: string, description?: string): Observable<Tag> {
        return of({
            id: 3, name, description, count: 0
        }).pipe(tap(this.fetch.bind(this)));
    }

    addDocumentTag(document, tag): Observable<any> {
        return of(true);
    }

    removeDocumentTag(document, tag): Observable<any> {
        return of(true);
    }

    private fetch() {
        this.tags$ = of(mockTags);
    }
}
