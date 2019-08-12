import { Component, HostListener, OnChanges, OnInit, Input} from '@angular/core';
import { ConfirmationService } from 'primeng/api';

@Component({
    selector: 'ia-scan-pdf',
    templateUrl: './scan-pdf.component.html',
    styleUrls: ['./scan-pdf.component.scss'],
    providers: [ConfirmationService]
})
export class ScanPdfComponent implements OnChanges, OnInit {
    @Input()
    public pdfData: PdfResponse;

    @Input()
    public downloadPath: string;

    public pdfSrc: ArrayBuffer;

    public pdfFile: any;

    public page: number = null;

    public startPage: number = null;

    public lastPage: number;

    public isLoaded: boolean = false;

    public pdfInfo: PdfHeader;

    public pdfNotFound: boolean = false;

    public zoomFactor: number = 1.0;
    private maxZoomFactor: number = 1.7;

    constructor(private confirmationService: ConfirmationService) { }

    ngOnInit() {
        this.formatPdfResponse();
    }

    ngOnChanges() {
        this.formatPdfResponse();
    }

    formatPdfResponse() {
        this.pdfInfo = <PdfHeader>JSON.parse(this.pdfData.headers.pdfinfo);
        this.page = this.pdfInfo.homePageIndex; //1-indexed
        this.startPage = this.page;
        this.pdfSrc = this.pdfData.body;
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
                window.location.href = this.downloadPath;
            },
            reject: () => {
            }
        })
    }

    // @HostListener('mousewheel', ['$event']) onMousewheel(event) {
    //     if(event.wheelDelta>0){
    //        this.zoomIn(); 
    //     }
    //     if(event.wheelDelta<0){
    //         this.zoomOut();
    //     }
    // }

    zoomIn() {
        if (this.zoomFactor <= this.maxZoomFactor) {
            this.zoomFactor += .1;
        }
    }

    zoomOut() {
        this.zoomFactor -= .1;
    }

}

interface PdfHeader {
    pageNumbers: number[];
    homePageIndex: number;
    fileName: string;
    fileSize: string;
}

interface PdfResponse {
    status: number;
    body: ArrayBuffer;
    headers: any;
}