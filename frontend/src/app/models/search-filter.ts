import { SearchFilterData } from './search-filter-data';

export type SearchFilter = {
    fieldName: string,
    description: string,
    useAsFilter: boolean,
    defaultData?: SearchFilterData,
    currentData: SearchFilterData
}
