import { Component, Input, OnInit, Output } from '@angular/core';
import { Corpus } from '../../models';
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import * as _ from 'lodash';

@Component({
    selector: 'ia-corpus-filter',
    templateUrl: './corpus-filter.component.html',
    styleUrls: ['./corpus-filter.component.scss']
})
export class CorpusFilterComponent implements OnInit {
    @Input() corpora: Corpus[];
    @Output() filtered = new Subject<Corpus[]>();

    selectedLanguage = new BehaviorSubject<string>(undefined);
    selectedCategory = new BehaviorSubject<string>(undefined);
    selectedMinDate = new BehaviorSubject<Date>(undefined);
    selectedMaxDate = new BehaviorSubject<Date>(undefined);

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
        combineLatest([
            this.selectedLanguage,
            this.selectedCategory,
            this.selectedMinDate,
            this.selectedMaxDate
        ]).subscribe(values => this.filterCorpora(...values));
    }

    collectOptions(property): string[] {
        const values = _.flatMap(
            this.corpora || [],
            property
        ) as string[];
        return _.uniq(values).sort();
    }

    filterCorpora(language?: string, category?: string, minDate?: Date, maxDate?: Date): void {
        if (this.corpora) {
            const filter = this.corpusFilter(language, category, minDate, maxDate);
            const filtered = this.corpora.filter(filter);
            this.filtered.next(filtered);
        }
    }

    corpusFilter(language?: string, category?: string, minDate?: Date, maxDate?: Date): ((a: Corpus) => boolean) {
        return (corpus) => {
            if (language && !corpus.languages.includes(language)) {
                return false;
            }
            if (category && corpus.category !== category) {
                return false;
            }
            if (minDate && corpus.maxDate < minDate) {
                return false;
            }
            if (maxDate && corpus.minDate > maxDate) {
                return false;
            }
            return true;
        };
    }

}
