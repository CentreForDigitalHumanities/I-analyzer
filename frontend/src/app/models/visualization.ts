import { SearchFilter, SearchFilterData } from './search-filter';

export type visualizationField = {
    name: string,
    visualizations: string,
    displayName?: string,
    visualizationSort?: string,
    searchFilter?: SearchFilter<SearchFilterData> | null,
    multiFields?: string[];
};
