import { of, Observable } from 'rxjs';

import { Corpus, NamedEntitiesResult } from '../app/models';

export class EntityServiceMock {

    public getDocumentEntities(corpus: Corpus, id: string): Observable<NamedEntitiesResult> {
        return of({speech: [{entity: 'person', text: 'Wally'},
            {entity: 'flat', text: ' was last seen in '},
            {entity: 'location', text: 'Paris'}]})
    }
}
