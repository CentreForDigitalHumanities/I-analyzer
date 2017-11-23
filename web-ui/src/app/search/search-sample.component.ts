import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SearchSample } from '../models/index';

@Component({
    selector: 'search-sample',
    templateUrl: './search-sample.component.html',
    styleUrls: ['./search-sample.component.scss']
})
export class SearchSampleComponent implements OnInit {
    @Input()
    public sample: SearchSample;

    /**
     * The search query to use for highlighting the results
     */
    @Input()
    public query: string;

    @Output('download')
    public downloadEvent = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    public download() {
        this.downloadEvent.next();
    }
}
