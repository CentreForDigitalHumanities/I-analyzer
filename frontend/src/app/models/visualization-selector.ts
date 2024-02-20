import { Params } from '@angular/router';
import { StoreSync } from '../store/store-sync';
import { CorpusField } from './corpus';
import { Store } from '../store/types';
import { QueryModel } from './query';
import { findByName } from '../utils/utils';
import * as _ from 'lodash';
import { Observable, merge, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';

export interface VisualizationSelection {
    name: string;
    field: CorpusField;
}

export interface VisualizationOption {
    name: string;
    label: string;
    fields: CorpusField[];
    disabled$: Observable<boolean>;
}

const REQUIRE_SEARCH_TERM = ['termfrequency', 'ngram'];

const DISPLAY_NAMES = {
    resultscount: 'Number of results',
    termfrequency: 'Frequency of the search term',
    ngram: 'Neighbouring words',
    wordcloud: 'Most frequent words',
};

export class VisualizationSelector extends StoreSync<VisualizationSelection> {
    options: VisualizationOption[];
    activeOption$: Observable<VisualizationOption>;

    defaultState: VisualizationSelection;

    protected keysInStore = ['visualize', 'visualizedField'];

    constructor(
        store: Store,
        public query: QueryModel,
    ) {
        super(store);
        this.options = this.getVisualizationOptions(this.query);
        this.defaultState = this.getDefaultOption(this.options);
        this.connectToStore();
        this.activeOption$ = this.state$.pipe(
            map(state => findByName(this.options, state.name))
        );
    }

    setVisualizationType(name: string) {
        const selection = findByName(this.options, name);
        const currentField = this.state$.value.field;
        if (selection.fields.includes(currentField)) {
            this.setParams({name});
        } else {
            this.setParams({name, field: selection.fields[0]});
        }
    }

    setVisualizedField(field: CorpusField) {
        const currentVisualisation = this.state$.value.name;

        if (field.visualizations.includes(currentVisualisation)) {
            this.setParams({field});
        } else {
            this.setParams({field, name: field.visualizations[0]});
        }
    }

    protected stateToStore(state: VisualizationSelection): Params {
        return {
            visualize: state.name || null,
            visualizedField: state.field?.name || null,
        };
    }

    protected storeToState(params: Params): VisualizationSelection {
        const name = params['visualize'];

        if (name) {
            const fieldName = params['visualizedField'];
            const field = findByName(this.query.corpus.fields, fieldName);

            return { name, field };
        } else {
            return this.defaultState;
        }
    }

    private getVisualizationOptions(query: QueryModel): VisualizationOption[] {
        const hasVisualizations = (field: CorpusField) => field.visualizations?.length;

        const fields = query.corpus.fields.filter(hasVisualizations);
        const names = _.uniq(
            _.flatMap(fields, field => field.visualizations)
        );

        return names.map(name => {
            const label = DISPLAY_NAMES[name];
            const filteredFields = fields.filter(field => field.visualizations.includes(name));
            const disabled$ = this.disabled$(name, query);
            return {
                name,
                label,
                fields: filteredFields,
                disabled$,
            };
        });
    }

    private disabled$(name: string, query: QueryModel): Observable<boolean> {
        if (REQUIRE_SEARCH_TERM.includes(name)) {
            const now = timer();
            const updates = merge(now, query.update);
            return updates.pipe(
                map(() => _.isEmpty(query.queryText)),
            );
        } else {
            return of(false);
        }
    }

    private getDefaultOption(options: VisualizationOption[]): VisualizationSelection {
        const selected = _.first(options);
        return { name: selected.name, field: _.first(selected.fields) };
    }
}
