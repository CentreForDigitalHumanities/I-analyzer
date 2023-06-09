import * as _ from 'lodash';
import { CorpusField } from './corpus';
import { QueryModel } from './query';
import { SearchFilter } from './search-filter';
import { SearchFilterType } from './search-filter-options';
import { Observable } from 'rxjs-compat';

export class PotentialFilter {
    filter: SearchFilter;
    useAsFilter: Observable<boolean>;
    description: string;
    adHoc?: boolean;

    constructor(public corpusField: CorpusField, public queryModel: QueryModel) {
        if (queryModel.filterForField(corpusField)) {
            this.filter = queryModel.filterForField(corpusField);
        } else {
            this.filter = corpusField.makeSearchFilter();
            this.queryModel.addFilter(this.filter);
        }

        this.useAsFilter = this.filter.active.asObservable();

        if (!corpusField.filterOptions) {
            this.description = `View results from this ${corpusField.displayName}`;
            this.adHoc = true;
        } else {
            this.description = corpusField.filterOptions.description;
            this.adHoc = false;
        }
    }

    get filterType(): SearchFilterType {
        return this.corpusField.filterOptions?.name;
    }

    toggle() {
        this.filter.toggle();
    }

    deactivate() {
        this.filter.deactivate();
    }

    activate() {
        this.filter.activate();
    }

    set(data: any) {
        this.filter.set(data);
    }

    reset() {
        this.filter.reset();
    }
}
