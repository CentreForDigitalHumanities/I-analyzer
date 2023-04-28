import { Component, Input, OnInit } from '@angular/core';
import { Corpus } from '../models/corpus';
import * as _ from 'lodash';


@Component({
    selector: 'ia-corpus-selection',
    templateUrl: './corpus-selection.component.html',
    styleUrls: ['./corpus-selection.component.scss']
})
export class CorpusSelectionComponent implements OnInit {
    @Input()
    public items: Corpus[];

    filteredItems: Corpus[];

    constructor() { }

    get displayItems(): Corpus[] {
        if (_.isUndefined(this.filteredItems)) {
            return this.items;
        } else {
            return this.filteredItems;
        }
    }

    ngOnInit() {
    }
}
