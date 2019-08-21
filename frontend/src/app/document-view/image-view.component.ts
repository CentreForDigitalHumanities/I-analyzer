import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../services';
import { FoundDocument } from '../models';

@Component({
  selector: 'ia-image-view',
  templateUrl: './image-view.component.html',
  styleUrls: ['./image-view.component.scss']
})
export class ImageViewComponent implements OnChanges {
    @Input() public imagePaths: string[];
    @Input() public mediaType: string;
    @Input() public allowDownload: boolean;
    
    constructor() { }

    ngOnChanges() {
        
    }
}
