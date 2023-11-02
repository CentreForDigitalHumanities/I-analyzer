import { BehaviorSubject } from 'rxjs';
import { FoundDocument } from './found-document';
import { CorpusField } from './corpus';
import * as _ from 'lodash';


export class DocumentPage {
    focus$ = new BehaviorSubject<FoundDocument>(undefined);

    constructor(
        public documents: FoundDocument[],
        public total: number,
        public fields?: CorpusField[]
    ) {
        this.documents.forEach((d, i) => d.position = i + 1);
    }

    focus(document: FoundDocument) {
        this.focus$.next(document);
    }

    focusNext() {
        this.focusShift(1);
    }

    focusPrevious() {
        this.focusShift(-1);
    }

    blur() {
        this.focus$.next(undefined);
    }

    private focusShift(shift: number) {
        const document = this.focus$.value;
        if (document) {
            this.focusPosition(document.position + shift);
        }
    }

    private focusPosition(position: number) {
        const index = _.clamp(position - 1, 0, this.documents.length - 1);
        this.focus(this.documents[index]);
    }
}
