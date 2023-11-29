import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { DocumentFocus, DocumentPage, DocumentView } from '../../models/document-page';
import { filter, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { faArrowLeft, faArrowRight, faBookOpen, faLink } from '@fortawesome/free-solid-svg-icons';
import { FoundDocument, QueryModel } from '../../models';
import { Subject } from 'rxjs';

@Component({
    selector: 'ia-document-popup',
    templateUrl: './document-popup.component.html',
    styleUrls: ['./document-popup.component.scss']
})
export class DocumentPopupComponent implements OnChanges, OnDestroy {
    @Input() page: DocumentPage;
    @Input() queryModel: QueryModel;

    document: FoundDocument;
    view: DocumentView;

    visible = true;

    faArrowLeft = faArrowLeft;
    faArrowRight = faArrowRight;
    linkIcon = faLink;
    contextIcon = faBookOpen;

    private refresh$ = new Subject<void>();

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
            this.refresh$.next();

            this.page.focus$.pipe(
                takeUntil(this.refresh$),
            ).subscribe(this.focusUpdate.bind(this));
        }
    }

    ngOnDestroy(): void {
        this.refresh$.next();
        this.refresh$.complete();
    }

    focusUpdate(focus?: DocumentFocus): void {
        if (focus) {
            this.document = focus.document;
            this.view = focus.view;
            this.visible = true;
        } else {
            this.document = undefined;
            this.visible = false;
        }
    }
}
