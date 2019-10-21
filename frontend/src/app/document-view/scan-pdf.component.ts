import { Component, EventEmitter, Input, HostListener, OnChanges, Output } from '@angular/core';

import { ConfirmationService } from 'primeng/api';

import { ApiService } from '../services';


@Component({
    selector: 'ia-scan-pdf',
    templateUrl: './scan-pdf.component.html',
    styleUrls: ['./scan-pdf.component.scss'],
    providers: [ConfirmationService]
})
export class ScanPdfComponent implements OnChanges {
    @Input()
    public imagePaths: string[];

    @Input()
    public zoomFactor: number;

    @Input()
    public allowDownload: boolean;

    @Input()
    public downloadPath: string;

    @Input()
    public pageIndex: number;

    @Output('scanReady')
    public scanReadyEmitter = new EventEmitter<{page: number, lastPage: number}>()

    public pdfSrc: ArrayBuffer;

    public pdfFile: any;

    public page: number = null;
    public pageNumbers: number[] = null;
    public lastPage: number;

    public pdfInfo: PdfHeader;

    public pdfNotFound: boolean = false;

    private path: URL;

    public isLoaded: boolean = false; // to do: make this an output
    // even better: transfer page and pageNumbers via output

    constructor(private apiService: ApiService, private confirmationService: ConfirmationService) {
    }

    ngOnInit() {
        this.apiService.getMedia({args: this.path.search}).then( response => {
            this.pdfNotFound = false;
            this.formatPdfResponse(response);
            this.afterLoadComplete();
        }).catch( () => this.pdfNotFound = true );
    }

    ngOnChanges() {
        this.path = new URL(this.imagePaths[0]);
    }

    formatPdfResponse(pdfData) {
        this.pdfInfo = <PdfHeader>JSON.parse(pdfData.headers.pdfinfo);
        this.page = Number(this.pdfInfo.homePageIndex); //1-indexed
        this.pageNumbers = this.pdfInfo.pageNumbers.map( d => Number(d) );
        this.pdfSrc = pdfData.body;
    }

    /**
         * callback for ng2-pdf-viewer loadcomplete event,
         * fires after all pdf data is received and loaded by the viewer.
         */
    afterLoadComplete() {
        this.lastPage = this.pageNumbers.slice(-1).pop();
        this.scanReadyEmitter.emit({page: this.page, lastPage: this.lastPage});
    }

    onError(error: any) {
        console.log(error)
    }

    confirmDownload() {
        this.confirmationService.confirm({
            message: `File: \t${this.pdfInfo.fileName}<br/> Size:\t ${this.pdfInfo.fileSize}`,
            header: "Confirm download",
            accept: () => {
                let url = this.downloadPath || this.path.pathname + this.path.search;
                window.location.href = url;
            },
            reject: () => {
            }
        })
    }

    // code to implement scrolling with the mouse wheel
    // this is not currently feasible (container blocks scrolling interaction)
    // leaving in in case we want to implement this later
    // @HostListener('mousewheel', ['$event']) onMousewheel(event) {
    //     if(event.wheelDelta>0){
    //        this.zoomIn(); 
    //     }
    //     if(event.wheelDelta<0){
    //         this.zoomOut();
    //     }
    // }

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