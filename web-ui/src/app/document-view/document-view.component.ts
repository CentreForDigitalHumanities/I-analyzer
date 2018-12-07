import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CorpusField, FoundDocument, Corpus } from '../models/index';
import { HttpClient } from '@angular/common/http';

import { ScanImageService } from '../services/scan-image.service';

import { PdfViewerComponent } from 'ng2-pdf-viewer';

@Component({
    selector: 'document-view',
    templateUrl: './document-view.component.html',
    styleUrls: ['./document-view.component.scss']
})
export class DocumentViewComponent implements OnInit {

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

    @Input()
    public fields: CorpusField[] = [];

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    @Input()
    public corpus: Corpus;

    public showPdf: boolean = false;

    public imgSrc: Uint8Array;

    constructor(private scanImageService: ScanImageService, private http: HttpClient) { }

    ngOnInit() {
        this.showPdf = this.corpus.scan_image_type == 'pdf'
        if (this.showPdf) {
            let url = "Financials/AA_2007_00978/AA_2007_00978_00001.pdf"
            this.scanImageService.get_scan_image(this.corpus.index, 38, url).then(
                results => this.imgSrc = results)
        }
    }

    ngOnChange() { }
}
