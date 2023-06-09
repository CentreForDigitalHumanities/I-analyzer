import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { CorpusField } from './corpus';
import { QueryModel } from './query';
import { SearchFilter } from './search-filter';
import { SearchFilterType } from './search-filter-options';

export class PotentialFilter {
    filter: SearchFilter;
    useAsFilter = new BehaviorSubject<boolean>(false);
    description: string;
    adHoc?: boolean;

    constructor(public corpusField: CorpusField, public queryModel: QueryModel) {
        if (queryModel.filterForField(corpusField)) {
            this.filter = queryModel.filterForField(corpusField);
            this.useAsFilter.next(true);
        } else {
            this.filter = corpusField.makeSearchFilter();
        }

        if (!corpusField.filterOptions) {
            this.description = `View results from this ${corpusField.displayName}`;
            this.adHoc = true;
        } else {
            this.description = corpusField.filterOptions.description;
            this.adHoc = false;
        }

        this.filter.isDefault$.subscribe(this.deactivateWhenDefault.bind(this));
    }

    get filterType(): SearchFilterType {
        return this.corpusField.filterOptions?.name;
    }

    toggle() {
        this.useAsFilter.next(!this.useAsFilter.value);
        if (this.useAsFilter.value) {
            this.queryModel.addFilter(this.filter);
        } else {
            this.queryModel.removeFilter(this.filter);
        }
    }

    deactivate() {
        if (this.useAsFilter.value) {
            this.toggle();
        }
    }

    activate() {
        if (!this.useAsFilter.value) {
            this.toggle();
        }
    }

    set(data: any) {
        if (!_.isEqual(data, this.filter.currentData)) {
            this.filter.set(data);

            if (!_.isEqual(data, this.filter.defaultData)) {
                this.activate();
            }
        }
    }

    reset() {
        this.filter.reset();
    }

    /** called after filter updates: deactivate the filter if the filter uses default data */
    private deactivateWhenDefault(isDefault: boolean) {
        if (isDefault) {
            this.deactivate();
        }
    }
}
