import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'search-sample',
    templateUrl: './search-sample.component.html',
    styleUrls: ['./search-sample.component.scss']
})
export class SearchSampleComponent implements OnInit {
    @Input()
    public sample;

    constructor() { }

    ngOnInit() {
    }

}
