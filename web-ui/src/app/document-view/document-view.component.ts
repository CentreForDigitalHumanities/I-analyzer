import { Component, Input, OnChanges, ViewChild } from '@angular/core';
import { CorpusField, FoundDocument, Corpus } from '../models/index';
import { HttpClient } from '@angular/common/http';

import { ScanImageService } from '../services/scan-image.service';

import { PdfViewerComponent } from 'ng2-pdf-viewer';

@Component({
    selector: 'document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent implements OnChanges {

    @ViewChild(PdfViewerComponent) private pdfComponent: PdfViewerComponent;

    public get contentFields() {
        return this.fields.filter(field => !field.hidden && field.displayType == 'text_content');
    }

    public get propertyFields() {
        return this.fields.filter(field => !field.hidden && field.displayType != 'text_content');
    }

    // After the pdf text is rendered, query text is highlighted in the pdf
    public textLayerRendered(e: CustomEvent, querytext: string) {
        this.pdfComponent.pdfFindController.executeCommand('find', {
            caseSensitive: false, findPrevious: true, highlightAll: true, phraseSearch: true,
            query: querytext
        });
    }

    public get_pdf() {
        this.scanImageService.get_scan_image(
            this.corpus.index,
            this.document.fieldValues.page - 1, //0-indexed pdf vs 1-indexed realworld numbering
            this.document.fieldValues.image_path).then(
                results => {
                    this.imgSrc = results;
                })
    }

    @Input()
    public fields: CorpusField[] = [];

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    @Input()
    public corpus: Corpus;

    public imgSrc: any;

    constructor(private scanImageService: ScanImageService, private http: HttpClient) { }

    ngOnChanges() {
        if (this.corpus.scan_image_type == 'pdf') {
            this.get_pdf()
        }
    }
}
