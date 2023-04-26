import { Component, Input, OnInit, Output } from '@angular/core';
import { Corpus } from '../../models';
import { Subject } from 'rxjs';
import * as _ from 'lodash';

@Component({
    selector: 'ia-corpus-filter',
    templateUrl: './corpus-filter.component.html',
    styleUrls: ['./corpus-filter.component.scss']
})
export class CorpusFilterComponent implements OnInit {
    @Input() corpora: Corpus[];
    @Output() filtered = new Subject<Corpus[]>();

    maxDate = new Date(Date.now());

    constructor() { }

    get minDate(): Date {
        if (this.corpora) {
            const dates = this.corpora.map(corpus => corpus.minDate);
            return _.min(dates);
        }
    }

    get languages(): string[] {
        return this.collectOptions('languages');
    }

    get categories(): string[] {
        return this.collectOptions('category');
    }

    ngOnInit(): void {
    }

    collectOptions(property): string[] {
        return _.uniq(_.flatMap(
            this.corpora || [],
            property
        ) as string[]).sort();
    }

}
