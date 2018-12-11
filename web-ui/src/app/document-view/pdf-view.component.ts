import { Component, OnChanges, Input, ViewChild } from '@angular/core';
import { Corpus, FoundDocument } from '../models/index';
import { HttpClient } from '@angular/common/http';
import { ScanImageService } from '../services';
import { PdfViewerComponent } from 'ng2-pdf-viewer';

@Component({
    selector: 'ia-pdf-view',
    templateUrl: './pdf-view.component.html',
    styleUrls: ['./pdf-view.component.scss']
})
export class PdfViewComponent implements OnChanges {
    @ViewChild(PdfViewerComponent)

    private pdfComponent: PdfViewerComponent;

    @Input()
    public corpus: Corpus;

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    public pdfSrc: ArrayBuffer;

    public page: number = 4;

    public totalPages: number;

    public isLoaded: boolean = false;

    get_pdf() {
        this.scanImageService.get_scan_image(
            this.corpus.index,
            this.document.fieldValues.page_number - 1, //0-indexed pdf
            this.document.fieldValues.image_path).then(
                results => {
                    this.pdfSrc = results;
                })
    }

    afterLoadComplete(pdfData: any) {
        this.totalPages = pdfData.numPages;
        this.isLoaded = true;
    }

    nextPage() {
        this.page++;
    }

    prevPage() {
        this.page--;
    }

    // After the pdf text is rendered, query text is highlighted in the pdf
    public textLayerRendered(e: CustomEvent, querytext: string) {
        this.pdfComponent.pdfFindController.executeCommand('find', {
            caseSensitive: false, findPrevious: true, highlightAll: true, phraseSearch: true,
            query: querytext
        });
    }

    constructor(private scanImageService: ScanImageService, private http: HttpClient) { }

    ngOnChanges() {
        this.get_pdf()
    }

}
