import { Component, DestroyRef, Input, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    styleUrls: ['./corpus-filter.component.scss'],
    standalone: false
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

    constructor(private destroyRef: DestroyRef) { }

    get minYear(): number {
        return _.min(this.corpora.map(corpus => corpus.minYear));
    }

    get maxYear(): number {
        return _.max(this.corpora.map(corpus => corpus.maxYear));
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
                this.minYear, { nonNullable: true }
            ),
            maxYear: new FormControl<number>(
                this.maxYear, { nonNullable: true }
            ),
        });

        const value$ = this.form.valueChanges.pipe(
            map(() => this.form.getRawValue()),
            takeUntilDestroyed(this.destroyRef),
            share(),
        );
        value$.subscribe(this.filterCorpora.bind(this));
        this.canReset$ = value$.pipe(
            map(this.canReset.bind(this))
        );
    }

    collectOptions(property): string[] {
        const values = _.flatMap(this.corpora, property) as string[];
        return _.uniq(values).sort();
    }

    filterCorpora(filter: FilterState): void {
        const filtered = this.corpora.filter(this.corpusFilter(filter));
        this.filtered.next(filtered);
    }

    corpusFilter(filter: FilterState): ((a: Corpus) => boolean) {
        return (corpus) =>
            !_.some([
                (filter.language && !corpus.languages.includes(filter.language)),
                (filter.category && corpus.category !== filter.category),
                (filter.minYear !== null && corpus.maxYear < filter.minYear),
                (filter.maxYear !== null && corpus.minYear > filter.maxYear),
            ]);
    }

    canReset(state: FilterState): boolean {
        const defaultState = {
            language: null, category: null, minYear: this.minYear, maxYear: this.maxYear
        };
        return !_.isEqual(state, defaultState);
    }
}
