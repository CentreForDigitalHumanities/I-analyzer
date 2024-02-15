import * as _ from 'lodash';
import { BaseFilter, FilterInterface } from './base-filter';
import { APITagFilter } from './search-requests';
import { Store } from '../store/types';

export const TAG_FILTER = 'TagFilter';

const SEPARATOR = ',';

export class TagFilter extends BaseFilter<void, number[]> {
    displayName = 'Your tags';
    description = 'select tagged documents';
    filterType = TAG_FILTER;
    routeParamName = 'tags';

    constructor(store: Store) {
        super(store, 'tags');
    }

    makeDefaultData(): number[] {
        return [];
    }

    dataToString(data: number[]): string {
        return data.join(SEPARATOR);
    }

    dataFromString(value: string): number[] {
        const ids = value.split(SEPARATOR);
        const parsed = ids.map(item => parseInt(item, 10));
        return parsed.filter(_.negate(_.isNaN));
    }

    dataToAPI(): APITagFilter {
        if (this.state$.value.active) {
            return { tags: this.currentData };
        } else {
            return {};
        }
    }
}

export const isTagFilter = (filter: FilterInterface): filter is TagFilter =>
    filter.filterType === TAG_FILTER;
