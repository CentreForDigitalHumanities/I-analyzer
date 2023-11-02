import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DocumentPage, DocumentView } from '../../models/document-page';
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

    document: FoundDocument;
    view: DocumentView;

    visible = true;

    faArrowLeft = faArrowLeft;
    faArrowRight = faArrowRight;
    linkIcon = faLink;
    contextIcon = faBookOpen;

    get documentPageLink(): string[] {
        if (this.document) {
            return ['/document', this.document.corpus.name, this.document.id];
        }
    }

    get contextDisplayName(): string {
        if (this.document.corpus.documentContext) {
            return this.document.corpus.documentContext.displayName;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.page) {
            this.page.focus$.pipe(
                filter(focus => !!focus),
            ).subscribe(focus => {
                this.document = focus.document;
                this.view = focus.view;
                this.visible = true;
            });
        }
    }
}
