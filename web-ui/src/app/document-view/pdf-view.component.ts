import { Component, OnChanges, OnInit, Input, ViewChild, SimpleChanges } from '@angular/core';
import { Corpus, FoundDocument } from '../models/index';
import { HttpClient } from '@angular/common/http';
import { ScanImageService } from '../services';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { JsonPipe } from '@angular/common';

@Component({
    selector: 'ia-pdf-view',
    templateUrl: './pdf-view.component.html',
    styleUrls: ['./pdf-view.component.scss']
})
export class PdfViewComponent implements OnChanges, OnInit {
    @ViewChild(PdfViewerComponent)

    private pdfComponent: PdfViewerComponent;

    @Input()
    public corpus: Corpus;

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    public pdfSrc: ArrayBuffer;

    public page: number = null;

    public lastPage: number;

    public isLoaded: boolean = false;

    public pageArray: number[];

    public pdfInfo: pdfHeader;

    async get_pdf() {
        const pdfResponse = <pdfResponse>await this.scanImageService.get_source_pdf(
            this.corpus.index,
            this.document.fieldValues.image_path,
            this.document.fieldValues.page - 1)
        this.pdfInfo = <pdfHeader>JSON.parse(pdfResponse.headers.pdfinfo);
        this.page = this.pdfInfo.homePageIndex + 1; //1-indexed
        this.pdfSrc = pdfResponse.body;
    }

    afterLoadComplete(pdfData: any) {
        this.lastPage = this.pdfInfo.pageNumbers.slice(-1).pop();
        this.isLoaded = true;
    }

    nextPage() {
        this.page++;
    }

    prevPage() {
        this.page--;
    }

    setPage(pageNr: number) {
        this.page = pageNr;
    }

    public textLayerRendered(e: CustomEvent, querytext: string) {
        this.pdfComponent.pdfFindController.executeCommand('find', {
            caseSensitive: false, findPrevious: true, highlightAll: true, phraseSearch: true,
            query: querytext
        });
    }

    constructor(private scanImageService: ScanImageService, private http: HttpClient) { }

    ngOnInit() {
        this.get_pdf();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.document.previousValue && changes.document.previousValue != changes.document.currentValue) {
            this.isLoaded = false;
            this.page = null;
            this.get_pdf();
        }
    }

}

interface pdfHeader {
    pageNumbers: number[];
    homePageIndex: number;
}

interface pdfResponse {
    status: number;
    body: ArrayBuffer;
    headers: any;
}