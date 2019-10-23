import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'ia-image-navigation',
  templateUrl: './image-navigation.component.html',
  styleUrls: ['./image-navigation.component.scss']
})
export class ImageNavigationComponent implements OnInit {
    @Input() public firstPage: number;
    @Input() public lastPage: number;
    @Input() public currentPage: number;

    @Output('pageIndexChange')
    public pageIndexChangeEmitter = new EventEmitter<number>()
    
    public page: number;

    constructor() { }

    ngOnInit() {
        this.page = this.currentPage;
    }

    prevPage() {
        this.page = this.page - 1 > 0? this.page - 1 : this.lastPage;
        this.pageIndexChangeEmitter.emit(this.page);
    }

    nextPage() {
        this.page = this.page + 1 < this.lastPage? this.page + 1 : 1;
        this.pageIndexChangeEmitter.emit(this.page);
    }
}
