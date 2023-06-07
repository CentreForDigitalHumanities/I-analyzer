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
    public initialPage = 1;

    public downloadPath: string; // optional: downloadable content may differ from displayed content
    public zoomFactor = 1.0;
    private maxZoomFactor = 1.7;

    constructor(private apiService: ApiService, private confirmationService: ConfirmationService) {
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.corpus) {
            this.allowDownload = this.corpus.allow_image_download;
            this.mediaType = this.corpus.scan_image_type;
        }
        if (changes.document &&
            changes.document.previousValue !== changes.document.currentValue) {
                this.imagePaths = undefined;
                this.apiService.requestMedia({corpus: this.corpus.name, document: this.document}).then( response => {
                    this.noImages = false;
                    this.imagePaths = response.media;
                    if (response.info) {
                        this.imageInfo = response.info;
                        this.showPage = Number(this.imageInfo.homePageIndex) - 1;
                        this.pageIndices = this.imageInfo.pageNumbers.map( d => Number(d) );
                        this.initialPage = this.pageIndices[this.showPage]; //1-indexed
                    } else {
                        this.imageInfo = undefined;
                        const totalPages = this.imagePaths.length;
                        this.pageIndices = Array.from(Array(totalPages + 1).keys()).slice(1);
                        this.showPage = this.pageIndices.indexOf(this.initialPage);
                    }
                }).catch(err => this.noImages = true);
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
        const url = this.imagePaths[this.showPage];
        if (this.imageInfo) {
            this.confirmDownload(url);
        } else {
            window.location.href = url;
        }
    }

    confirmDownload(url: string) {
        this.confirmationService.confirm({
            message: `File: \t${this.imageInfo.fileName}<br/> Size:\t ${this.imageInfo.fileSize}`,
            header: 'Confirm download',
            accept: () => {
                window.location.href = url;
            },
            reject: () => {
            }
        });
    }

    pageIndexChange(event: number) {
        this.showPage = this.pageIndices.indexOf(event);
    }
}

export interface ImageInfo {
    pageNumbers: number[];
    homePageIndex: number;
    fileName: string;
    fileSize: string;
}
