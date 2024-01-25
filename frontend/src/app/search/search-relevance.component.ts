import { Component, Input } from '@angular/core';

@Component({
    selector: 'ia-search-relevance',
    templateUrl: './search-relevance.component.html',
    styleUrls: ['./search-relevance.component.scss'],
})
export class SearchRelevanceComponent {
    @Input()
    public value: number;

    constructor() {}
}
