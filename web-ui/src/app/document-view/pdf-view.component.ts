import { Component, OnChanges, OnInit, Input, ViewChild, SimpleChanges } from '@angular/core';
import { Corpus, FoundDocument } from '../models/index';
import { PdfService } from '../services';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { ConfirmationService } from 'primeng/api';

@Component({
    selector: 'ia-pdf-view',
    templateUrl: './pdf-view.component.html',
    styleUrls: ['./pdf-view.component.scss'],
    providers: [ConfirmationService]
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

    public startPage: number = null;

    public lastPage: number;

    public isLoaded: boolean = false;

    public pdfInfo: pdfHeader;

    async get_pdf() {
        const pdfResponse = <pdfResponse>await this.pdfService.get_source_pdf(
            this.corpus.index,
            this.document.fieldValues.image_path,
            this.document.fieldValues.page - 1)
        this.pdfInfo = <pdfHeader>JSON.parse(pdfResponse.headers.pdfinfo);
        this.page = this.pdfInfo.homePageIndex + 1; //1-indexed
        this.startPage = this.page;
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

    confirmDownload() {
        this.confirmationService.confirm({
            message: `File: \t${this.pdfInfo.fileName}<br/> Size:\t ${this.pdfInfo.fileSize}`,
            header: "Confirm download",
            accept: () => {
                this.pdfService.download_pdf(this.corpus.index, this.document.fieldValues.image_path)
            },
            reject: () => {
            }
        });
    }

    constructor(private pdfService: PdfService, private confirmationService: ConfirmationService) { }

    ngOnInit() {
        this.get_pdf();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.document.previousValue && changes.document.previousValue != changes.document.currentValue) {
            this.isLoaded = false;
            this.page = null;
            this.startPage = null;
            this.get_pdf();
        }
    }

}

interface pdfHeader {
    pageNumbers: number[];
    homePageIndex: number;
    fileName: string;
    fileSize: string;
}

interface pdfResponse {
    status: number;
    body: ArrayBuffer;
    headers: any;
}