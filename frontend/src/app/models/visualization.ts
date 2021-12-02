import { SearchFilter, SearchFilterData } from './search-filter';

export type visualizationField = {
    name: string,
    visualizationType: string,
    displayName?: string,
    visualizationSort?: string,
    searchFilter?: SearchFilter<SearchFilterData> | null
};
