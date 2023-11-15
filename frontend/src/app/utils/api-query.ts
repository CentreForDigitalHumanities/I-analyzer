import { FilterInterface } from '../models';
import { APITagFilter } from '../models/search-requests';

import { TAG_FILTER, TagFilter } from '../models/tag-filter';

export const makeTagSpecification = (filters: FilterInterface[]): APITagFilter => {
    const tagFilter = filters.find(isTagFilter);
    if (tagFilter?.active) {
        const tags = tagFilter.dataToAPI(tagFilter.data.value);
        return { tags };
    } else {
        return {};
    }
};

const isTagFilter = (filter: FilterInterface): filter is TagFilter =>
    filter.filterType === TAG_FILTER;
