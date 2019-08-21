import { Component, HostListener, OnChanges, Input} from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';

import { ApiService } from '../services';
import { filter } from 'rxjs-compat/operator/filter';


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
    public allowDownload: boolean;

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
    private path: URL;

    constructor(private apiService: ApiService, private confirmationService: ConfirmationService, private router: Router) { }

    ngOnChanges() {
        this.path = new URL(this.imagePaths[0]);
        this.apiService.getMedia({args: this.path.search}).then( response => {
            this.pdfNotFound = false;
            this.formatPdfResponse(response);
        }).catch( () => this.pdfNotFound = true );
    }

    formatPdfResponse(pdfData) {
        this.pdfInfo = <PdfHeader>JSON.parse(pdfData.headers.pdfinfo);
        this.page = this.pdfInfo.homePageIndex; //1-indexed
        this.startPage = this.page;
        this.pdfSrc = pdfData.body;
    }

    formatSearchParams() {
        let outParams = new URLSearchParams();
        this.path.searchParams.forEach( ( value, key ) => {
            if (['corpus','image_path'].includes(key)){
                outParams.append(key, value);
            }
        })
        return outParams.toString();
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
                let params = this.formatSearchParams();
                let url = this.path.pathname + "?" + params;
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