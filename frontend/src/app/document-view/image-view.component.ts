import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services';

@Component({
  selector: 'ia-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.scss']
})
export class ImageViewComponent implements OnInit {
    @Input() public imgPath: string;

    @ViewChild('sourceImage') public sourceImage: ElementRef;
    public images: string[];
    
    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.apiService.testImages().then( response => {
            this.images = [response.replace('data:image/jpg;base64,', '')];
        })
    }

}
