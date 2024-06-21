import { of, Observable } from 'rxjs';

import { Corpus, NamedEntitiesResult } from '../app/models';

export class EntityServiceMock {

    public getDocumentEntities(corpus: Corpus, id: string): Observable<NamedEntitiesResult> {
        return of({annotations: [], entities: []})
        
    }
}
