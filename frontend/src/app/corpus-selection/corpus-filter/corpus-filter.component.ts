import { Component, Input, OnInit, Output } from '@angular/core';
import { Corpus } from '@models';
import { Observable, Subject } from 'rxjs';
import * as _ from 'lodash';
import { map, share, } from 'rxjs/operators';
import { formIcons } from '@shared/icons';
import { FormControl, FormGroup } from '@angular/forms';

interface FilterState {
    language: string | null;
    category: string | null;
    minYear: number;
    maxYear: number;
}


@Component({
    selector: 'ia-corpus-filter',
    templateUrl: './corpus-filter.component.html',
    styleUrls: ['./corpus-filter.component.scss']
})
export class CorpusFilterComponent implements OnInit {
    @Input({required: true}) corpora!: Corpus[];
    @Output() filtered = new Subject<Corpus[]>();

    form?: FormGroup<{
        language: FormControl<string>;
        category: FormControl<string>;
        minYear: FormControl<number>;
        maxYear: FormControl<number>;
    }>;

    formIcons = formIcons;

    canReset$: Observable<boolean>;

    constructor() { }

    get minYear(): number {
        if (this.corpora) {
            const years = this.corpora.map(corpus => corpus.minYear);
            return _.min(years);
        }
    }

    get maxYear(): number {
        if (this.corpora) {
            const years = this.corpora.map(corpus => corpus.maxYear);
            return _.max(years);
        }
    }


    get languages(): string[] {
        return this.collectOptions('languages');
    }

    get categories(): string[] {
        return this.collectOptions('category');
    }

    ngOnInit(): void {
        this.form = new FormGroup({
            language: new FormControl<string>(null),
            category: new FormControl<string>(null),
            minYear: new FormControl<number>(
                this.minYear, { nonNullable: true}
            ),
            maxYear: new FormControl<number>(
                this.maxYear, { nonNullable: true}
            ),
        });

        const value$ = this.form.valueChanges.pipe(
            map(() => this.form.getRawValue()),
            share(),
        );

        value$.subscribe(
            this.filterCorpora.bind(this)
        );

        this.canReset$ = value$.pipe(
            map(this.canReset.bind(this)),
        )
    }

    collectOptions(property): string[] {
        const values = _.flatMap(
            this.corpora || [],
            property
        ) as string[];
        return _.uniq(values).sort();
    }

    filterCorpora(state: FilterState): void {
        if (this.corpora) {
            const filter = this.corpusFilter(state);
            const filtered = this.corpora.filter(filter);
            this.filtered.next(filtered);
        }
    }

    corpusFilter(state: FilterState): ((a: Corpus) => boolean) {
        return (corpus) => {
            if (state.language && !corpus.languages.includes(state.language)) {
                return false;
            }
            if (state.category && corpus.category !== state.category) {
                return false;
            }
            if (state.minYear && corpus.maxYear < state.minYear) {
                return false;
            }
            if (state.maxYear && corpus.minYear > state.maxYear) {
                return false;
            }
            return true;
        };
    }

    canReset(state: FilterState): boolean {
        return !_.every([
            _.isNull(state.language),
            _.isNull(state.category),
            state.minYear == this.minYear,
            state.maxYear == this.maxYear,
        ]);
    }

    reset() {
        this.form.reset();
    }

}
