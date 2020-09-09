import { Component, EventEmitter, Input, OnInit, Output, OnChanges } from '@angular/core';

@Component({
  selector: 'ia-image-navigation',
  templateUrl: './image-navigation.component.html',
  styleUrls: ['./image-navigation.component.scss']
})
export class ImageNavigationComponent implements OnChanges {
    @Input() public pageIndices: number[];
    @Input() public initialPage: number;

    @Output('pageIndexChange')
    public pageIndexChangeEmitter = new EventEmitter<number>()
    
    public page: number;
    public firstPage: number;
    public lastPage: number;

    // the maximum number of buttons to display for navigation
    private maxButtons: number = 8;
    // array used for generating navigation buttons
    public buttonArray: number[];

    constructor() { }

    ngOnChanges() {
        this.page = this.initialPage;
        this.firstPage = this.pageIndices[0];
        this.lastPage = this.pageIndices[this.pageIndices.length-1];
        this.calculateButtonArray();
    }

    prevPage() {
        this.page = this.page - 1 > this.firstPage - 1 ? this.page - 1 : this.lastPage;
        this.calculateButtonArray();
        this.pageIndexChangeEmitter.emit(this.page);   
    }

    nextPage() {
        this.page = this.page + 1 < this.lastPage + 1 ? this.page + 1 : this.firstPage;
        this.calculateButtonArray();
        this.pageIndexChangeEmitter.emit(this.page);
    }

    goToPage(event: number) {
        this.page = event;
        this.calculateButtonArray();
        this.pageIndexChangeEmitter.emit(this.page);
    }

    /**
    * calculate the array of page numbers used for the navigation buttons
    */
    calculateButtonArray() {
        if (this.pageIndices.length < this.maxButtons) {
            this.buttonArray = this.pageIndices;
        }
        else {
            let curPageIndex = this.pageIndices.indexOf(this.page);
            switch (curPageIndex) {
                case 0:
                    this.buttonArray = this.pageIndices.slice(curPageIndex, curPageIndex+this.maxButtons);
                    break
                case this.pageIndices.length:
                    this.buttonArray = this.pageIndices.slice(curPageIndex-this.maxButtons, curPageIndex);
                    break
                default:
                    this.buttonArray = this.pageIndices.slice(curPageIndex-this.maxButtons/2, curPageIndex+this.maxButtons/2);
                    break
            }    
        }
    }

}
