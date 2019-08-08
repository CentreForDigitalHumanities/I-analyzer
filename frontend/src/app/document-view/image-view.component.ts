import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../services';
import { FoundDocument } from '../models';

@Component({
  selector: 'ia-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.scss']
})
export class ImageViewComponent implements OnChanges, OnInit {
    @Input() public imgPath: string;
    @Input() public document: FoundDocument;
    @Input() public corpus: string;

    @ViewChild('sourceImage') public sourceImage: ElementRef;
    public images: SafeResourceUrl[];
    
    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.apiService.testImages({corpus_index: this.corpus, document: this.document}).then( response => {
            if (response.success) {
                this.images = response.images;
            }
        })
    }

    ngOnChanges() {
        this.apiService.testImages({corpus_index: this.corpus, document: this.document}).then( response => {
            if (response.success) {
                this.images = response.images;
            }
        })
    }

}
