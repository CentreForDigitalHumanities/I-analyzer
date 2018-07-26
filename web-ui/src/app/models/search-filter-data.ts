import { CorpusField } from './corpus';
import { SearchFilterName } from './index';

export type SearchFilterData =
    { fieldName: string } & (
        {
            filterName: "BooleanFilter",
            data: boolean
        } | {
            filterName: "MultipleChoiceFilter",
            data: string[]
        } | {
            filterName: "RangeFilter",
            data: { gte: number, lte: number }
        } | {
            filterName: "DateFilter",
            data: {
                /** greater than or equal, format: yyyy-MM-dd */
                gte: string,
                /** less than or equal, format: yyyy-MM-dd */
                lte: string
            }
        });

export type SearchFilterName = SearchFilterData["filterName"];

export function searchFilterDataToParam(data: SearchFilterData): string | string[] {
    switch (data.filterName) {
        case "BooleanFilter":
            return `${data.data}`;
        case "MultipleChoiceFilter":
            return data.data as string[];
        case "RangeFilter": {
            return `${data.data.gte}:${data.data.lte}`;
        }
        case "DateFilter": {
            return `${data.data.gte}:${data.data.lte}`;
        }
    }
}

export function searchFilterDataFromParam(fieldName: string, filterName: SearchFilterName, value: string[]): SearchFilterData {
    switch (filterName) {
        case "BooleanFilter":
            return { fieldName, filterName, data: value[0] === 'true' };
        case "MultipleChoiceFilter":
            return { fieldName, filterName, data: value };
        case "RangeFilter": {
            let [gte, lte] = value[0].split(':');
            return { fieldName, filterName, data: { lte: parseFloat(lte), gte: parseFloat(gte) } };
        }
        case "DateFilter": {
            let [gte, lte] = value[0].split(':');
            return { fieldName, filterName, data: { lte, gte } };
        }
    }
}
