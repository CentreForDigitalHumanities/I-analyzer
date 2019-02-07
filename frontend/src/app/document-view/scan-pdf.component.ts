import { Component, OnChanges, OnInit, Input, ViewChild, SimpleChanges } from '@angular/core';
import { Corpus, FoundDocument } from '../models/index';
import { ApiService } from '../services';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import { ConfirmationService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'ia-scan-pdf',
    templateUrl: './scan-pdf.component.html',
    styleUrls: ['./scan-pdf.component.scss'],
    providers: [ConfirmationService]
})
export class ScanPdfComponent implements OnChanges, OnInit {
    @ViewChild(PdfViewerComponent)

    private pdfComponent: PdfViewerComponent;

    @Input()
    public corpus: Corpus;

    @Input()
    public document: FoundDocument;

    @Input()
    public query: string;

    public pdfSrc: ArrayBuffer;

    public pdfFile: any;

    public page: number = null;

    public startPage: number = null;

    public lastPage: number;

    public isLoaded: boolean = false;

    public pdfInfo: pdfHeader;

    public pdfNotFound: boolean = false;

    async get_pdf() {
        this.pdfNotFound = false;
        try {
            const pdfResponse = <pdfResponse>await this.apiService.sourcePdf({
                corpus_index: this.corpus.index,
                image_path: this.document.fieldValues.image_path,
                page: this.document.fieldValues.page - 1
            })
            this.pdfInfo = <pdfHeader>JSON.parse(pdfResponse.headers.pdfinfo);
            this.page = this.pdfInfo.homePageIndex; //1-indexed
            this.startPage = this.page;
            this.pdfSrc = pdfResponse.body;
        }
        catch (e) {
            this.pdfNotFound = true;
        }
    }

    /**
         * callback for ng2-pdf-viewer loadcomplete event,
         * fires after all pdf data is received and loaded by the viewer.
         */
    afterLoadComplete(pdfData: any) {

        this.lastPage = this.pdfInfo.pageNumbers.slice(-1).pop();
        this.isLoaded = true;
    }

    onError(error: any) {
        console.log(error)
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

    confirmDownload() {
        this.confirmationService.confirm({
            message: `File: \t${this.pdfInfo.fileName}<br/> Size:\t ${this.pdfInfo.fileSize}`,
            header: "Confirm download",
            accept: () => {
                // this.apiService.downloadPdf({corpus_index: this.corpus.index, filepath: this.document.fieldValues.image_path})
                window.location.href = `api/download_pdf/${this.corpus.index}/${this.document.fieldValues.image_path}`;
            },
            reject: () => {
            }
        });
    }

    constructor(private apiService: ApiService, private confirmationService: ConfirmationService, private http: HttpClient) { }

    ngOnInit() {
        this.get_pdf();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.document) {
            if (changes.document.previousValue && changes.document.previousValue != changes.document.currentValue) {
                this.isLoaded = false;
                this.page = null;
                this.startPage = null;
                this.get_pdf();
            }
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