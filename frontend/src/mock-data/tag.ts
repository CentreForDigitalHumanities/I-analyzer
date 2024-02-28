import { BehaviorSubject, Observable, of } from 'rxjs';
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
    tags$ = new BehaviorSubject<Tag[]>(mockTags);

    private docTags: Tag[] = mockTags;

    getDocumentTags(document: FoundDocument): Observable<Tag[]> {
        return of(this.docTags);
    }

    makeTag(name: string, description?: string): Observable<Tag> {
        return of({
            id: 3, name, description, count: 0
        }).pipe(tap(this.fetch.bind(this)));
    }

    setDocumentTags(document: FoundDocument, tagIds: Tag[]): Observable<Tag[]> {
        this.docTags = mockTags.filter(tag => tagIds.includes(tag));
        return of(this.docTags);
    };

    private fetch() {
        this.tags$.next(mockTags);
    }
}
