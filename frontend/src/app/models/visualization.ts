import { SearchFilter, SearchFilterData } from './search-filter';

// the corpusFields has an array of visualizations
// the visualizationField represents one pairing of corpus field + visualization
export type visualizationField = {
    name: string,
    visualization: string,
    displayName?: string,
    visualizationSort?: string,
    searchFilter?: SearchFilter<SearchFilterData> | null,
    multiFields?: string[];
};
