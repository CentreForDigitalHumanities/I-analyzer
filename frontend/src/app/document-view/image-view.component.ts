import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { ConfirmationService } from 'primeng/api';

import { FoundDocument, Corpus } from '../models';
import { ApiService } from '../services';

@Component({
  selector: 'ia-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.scss'],
  providers: [ConfirmationService]
})
export class ImageViewComponent implements OnChanges {
    @Input() public corpus: Corpus;
    @Input() public document: FoundDocument;

    public imagePaths: string[];
    public mediaType: string;
    public allowDownload: boolean;

    private imageInfo: ImageInfo;
    public noImages: boolean;

    public pageIndices: number[];
    public showPage: number;
    public initialPage: number = 1;

    public downloadPath: string; // optional: downloadable content may differ from displayed content
    public zoomFactor: number = 1.0;
    private maxZoomFactor: number = 1.7;

    constructor(private apiService: ApiService, private confirmationService: ConfirmationService) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.corpus) {
            this.allowDownload = this.corpus.allow_image_download;
            this.mediaType = this.corpus.scan_image_type;
        }
        if (changes.document &&  
            changes.document.previousValue != changes.document.currentValue) {
                this.downloadPath = this.document.fieldValues['image_path'];
                this.imagePaths = undefined;
                this.apiService.requestMedia({corpus_index: this.corpus.name, document: this.document}).then( response => {
                    if (response.success) {
                        this.noImages = false;
                        this.imagePaths = response.media;
                        if (response.info) {
                            this.imageInfo = response.info;
                            this.showPage = Number(this.imageInfo.homePageIndex) - 1;
                            this.pageIndices = this.imageInfo.pageNumbers.map( d => Number(d) );
                            this.initialPage = this.pageIndices[this.showPage]; //1-indexed
                        }
                        else {
                            let totalPages = this.imagePaths.length;
                            this.pageIndices = Array.from(Array(totalPages + 1).keys()).slice(1);
                            this.showPage = this.pageIndices.indexOf(this.initialPage);
                        }
                    }
                    else { 
                        this.noImages = true;
                    }
                })
        }
    }

    zoomIn() {
        if (this.zoomFactor <= this.maxZoomFactor) {
            this.zoomFactor += .1;
        }
    }

    zoomOut() {
        this.zoomFactor -= .1;
    }

    resetZoom() {
        this.zoomFactor = 1;
    }
    
    download() {
        if (this.imageInfo) {
            this.confirmDownload();
        }
        else {
            let url = this.downloadPath;
            window.location.href = url;
        }
    }

    confirmDownload() {
        this.confirmationService.confirm({
            message: `File: \t${this.imageInfo.fileName}<br/> Size:\t ${this.imageInfo.fileSize}`,
            header: "Confirm download",
            accept: () => {
                let url = this.downloadPath;
                window.location.href = url;
            },
            reject: () => {
            }
        })
    }

    pageIndexChange(event: number) {
        this.showPage = this.pageIndices.indexOf(event);
    }
}

export interface ImageInfo {
    pageNumbers: number[],
    homePageIndex: number,
    fileName: string,
    fileSize: string
}