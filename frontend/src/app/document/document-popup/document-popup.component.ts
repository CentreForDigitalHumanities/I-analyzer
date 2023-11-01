import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DocumentPage } from '../../models/results';
import { filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { faArrowLeft, faArrowRight, faBookOpen, faLink } from '@fortawesome/free-solid-svg-icons';
import { FoundDocument, QueryModel } from '../../models';

@Component({
    selector: 'ia-document-popup',
    templateUrl: './document-popup.component.html',
    styleUrls: ['./document-popup.component.scss']
})
export class DocumentPopupComponent implements OnChanges {
    @Input() page: DocumentPage;
    @Input() queryModel: QueryModel;

    visible = true;

    faArrowLeft = faArrowLeft;
    faArrowRight = faArrowRight;
    linkIcon = faLink;
    contextIcon = faBookOpen;

    get documentPageLink(): string[] {
        if (this.focusedDocument) {
            return ['/document', this.focusedDocument.corpus.name, this.focusedDocument.id];
        }
    }

    get contextDisplayName(): string {
        if (this.focusedDocument.corpus.documentContext) {
            return this.focusedDocument.corpus.documentContext.displayName;
        }
    }

    private get focusedDocument(): FoundDocument {
        return this.page?.focus$.value;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.page) {
            this.page.focus$.pipe(
                filter(focus => !!focus),
            ).subscribe(() =>
                this.visible = true
            );
        }
    }
}
