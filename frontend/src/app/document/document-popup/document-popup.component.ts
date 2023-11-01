import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DocumentPage } from '../../models/results';
import { filter } from 'rxjs/operators';
import * as _ from 'lodash';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ia-document-popup',
    templateUrl: './document-popup.component.html',
    styleUrls: ['./document-popup.component.scss']
})
export class DocumentPopupComponent implements OnChanges {
    @Input() page: DocumentPage;

    visible = true;

    faArrowLeft = faArrowLeft;
    faArrowRight = faArrowRight;

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
