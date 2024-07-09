import * as _ from 'lodash';
import * as moment from 'moment';
import { CorpusField } from './corpus';
import { EsBooleanFilter, EsDateFilter, EsFilter, EsTermsFilter, EsRangeFilter, EsTermFilter } from './elasticsearch';
import {
    BooleanFilterOptions, DateFilterOptions, FieldFilterOptions, MultipleChoiceFilterOptions,
    RangeFilterOptions
} from './field-filter-options';
import { BaseFilter, FilterInterface } from './base-filter';
import { Store } from '../store/types';


abstract class AbstractFieldFilter<FilterData, EsFilterType extends EsFilter>
    extends BaseFilter<FieldFilterOptions, FilterData> {

    constructor(store: Store, public corpusField: CorpusField) {
        super(store, corpusField.name, corpusField.filterOptions);
    }

    get filterType() {
        return this.corpusField.filterOptions?.name;
    }

    /** a filter is "ad hoc" if the field does not have a predefined filter */
    get adHoc() {
        return !(this.corpusField.filterOptions);
    }

    get displayName() {
        return this.corpusField.displayName;
    }

    get description() {
        if (this.corpusField?.filterOptions?.description) {
            return this.corpusField.filterOptions.description;
        } else {
            return `Filter results based on ${this.corpusField.displayName}`;
        }
    }

    /**
     * filter for one specific value (used to find documents from
     * the same day, page, publication, etc. as a specific document)
     */
    setToValue(value: any) {
        this.set(this.dataFromValue(value));
    }

    /**
     * convert the filter state to a query clause in elasticsearch query DSL
     *
     * returns undefined if the filter is inactive
     */
    toEsFilter(): EsFilterType {
        if (this.state$.value.active) {
            return this.dataToEsFilter();
        }
    }

    /** convert a single field value to filter data that selects that value */
    abstract dataFromValue(value: any): FilterData;

    /** export data as query clause in elasticsearch query language */
    abstract dataToEsFilter(): EsFilterType;

    /** convert a query clause in elasticsearch query langauge to filter data */
    abstract dataFromEsFilter(esFilter: EsFilterType): FilterData;

}

export interface DateFilterData {
    min?: Date;
    max?: Date;
}

/**
 * Filter for date fields
 *
 * Filter data is a range, e.g. [1st Jan 2000, 31st Dec 2000]. The min and max values can
 * also be undefined, which means no bound in that direction.
 *
 * The default data is always the widest possible range. This can be specified on the
 * field; if not specified, the default range will be (∞,∞). However, note that if the
 * DateFilter is controlled by a DateFilterComponent, the component will fill in finite
 * bounds based on an aggregation.
 */
export class DateFilter extends AbstractFieldFilter<DateFilterData, EsDateFilter> {
    makeDefaultData(filterOptions: DateFilterOptions) {
        const parse = value => _.isNull(value) ? undefined : this.parseDate(value);
        return {
            min: parse(filterOptions.lower),
            max: parse(filterOptions.upper)
        };
    }

    dataFromValue(value: Date) {
        return {
            min: value,
            max: value,
        };
    }

    dataFromString(value: string): DateFilterData {
        const [minString, maxString] = parseMinMax(value.split(','));
        return {
            min: this.parseDate(minString),
            max: this.parseDate(maxString),
        };
    }

    dataToString(data: DateFilterData): string {
        const min = this.formatDate(data.min);
        const max = this.formatDate(data.max);
        return `${min}:${max}`;
    }

    dataToEsFilter(): EsDateFilter {
        const data = this.currentData;
        return {
            range: {
                [this.corpusField.name]: {
                    gte: data.min ? this.formatDate(this.currentData.min) : null,
                    lte: data.max ? this.formatDate(this.currentData.max) : null,
                    format: 'yyyy-MM-dd',
                    relation: 'within'
                }
            }
        };
    }

    dataFromEsFilter(esFilter: EsDateFilter): DateFilterData {
        const data = _.first(_.values(esFilter.range));
        const min = data.gte ? this.parseDate(data.gte) : undefined;
        const max = data.lte ? this.parseDate(data.lte) : undefined;
        return { min, max };
    }

    private formatDate(date?: Date): string {
        if (date) {
            return moment(date).format('YYYY-MM-DD');
        }
        return '';
    }

    private parseDate(dateString?: string): Date|undefined {
        if (dateString.length) {
            return moment(dateString, 'YYYY-MM-DD').toDate();
        }
    }
}

/**
 * Filter for boolean fields
 */
export class BooleanFilter extends AbstractFieldFilter<boolean, EsBooleanFilter> {

    makeDefaultData(filterOptions: BooleanFilterOptions) {
        return undefined;
    }

    dataFromValue(value: any): boolean {
        return value as boolean;
    }

    dataFromString(value: string): boolean {
        if (value === 'true') {
            return true;
        } else if (value === 'false') {
            return false;
        }
    }

    dataToString(data: boolean): string {
        return data.toString();
    }

    dataToEsFilter(): EsBooleanFilter {
        return {
            term: {
                [this.corpusField.name]: this.currentData
            }
        };
    }

    dataFromEsFilter(esFilter: EsBooleanFilter): boolean {
        const data = _.first(_.values(esFilter.term));
        return data;
    }
}

type MultipleChoiceFilterData = string[];

/**
 * Filter for keyword fields
 */
export class MultipleChoiceFilter extends AbstractFieldFilter<MultipleChoiceFilterData, EsTermsFilter> {
    makeDefaultData(filterOptions: MultipleChoiceFilterOptions): MultipleChoiceFilterData {
        return [];
    }

    dataFromValue(value: any): MultipleChoiceFilterData {
        return [value.toString()];
    }

    dataFromString(value: string): MultipleChoiceFilterData {
        if (value.length) {
            return value.split(',').map(decodeURIComponent);
        }
        return [];
    }

    dataToString(data: MultipleChoiceFilterData): string {
        return data.map(encodeURIComponent).join(',');
    }

    dataToEsFilter(): EsTermsFilter {
        return {
            terms: {
                [this.corpusField.name]: this.currentData
            }
        };
    }

    dataFromEsFilter(esFilter: EsTermsFilter): MultipleChoiceFilterData {
        return _.first(_.values(esFilter.terms));
    }
}

export interface RangeFilterData {
    min?: number;
    max?: number;
}

/**
 * Filter for int and float fields
 *
 * Filter data is a range, e.g. [0, 100]. The min and max values can also be undefined, which
 * means no bound in that direction.
 *
 * The default data is always the widest possible range. This can be specified on the field;
 * if not specified, the default range will be (∞,∞). However, note that if the RangeFilter
 * is controlled by a RangeFilterComponent, the component will fill in finite bounds based
 * on an aggregation.
 */
export class RangeFilter extends AbstractFieldFilter<RangeFilterData, EsRangeFilter> {
    makeDefaultData(filterOptions: RangeFilterOptions): RangeFilterData {
        const parse = (value) => _.isNull(value) ? undefined : value;
        return {
            min: parse(filterOptions.lower),
            max: parse(filterOptions.upper)
        };
    }

    dataFromValue(value: number): RangeFilterData {
        return { min: value, max: value };
    }

    dataFromString(value: string): RangeFilterData {
        const [minString, maxString] = parseMinMax(value.split(','));
        return {
            min: this.parseValue(minString),
            max: this.parseValue(maxString),
        };
    }

    dataToString(data: RangeFilterData): string {
        return `${this.formatValue(data.min)},${this.formatValue(data.max)}`;
    }

    dataToEsFilter(): EsRangeFilter {
        return {
            range: {
                [this.corpusField.name]: {
                    gte: this.currentData.min,
                    lte: this.currentData.max,
                }
            }
        };
    }

    dataFromEsFilter(esFilter: EsRangeFilter): RangeFilterData {
        const data = _.first(_.values(esFilter.range));
        const min = data.gte;
        const max = data.lte;
        return { min, max };
    }

    private parseValue(value: string): number {
        if (value.length) {
            return parseFloat(value);
        }
    }

    private formatValue(value?: number): string {
        if (_.isUndefined(value)) {
            return '';
        }
        return `${value}`;
    }
}

/**
 * Filter for fields with no filter specification
 *
 * This filter can be activated when the user requests to filter on a specific
 * value.
 */
export class AdHocFilter extends AbstractFieldFilter<any, EsTermFilter> {
    makeDefaultData(filterOptions: FieldFilterOptions) { }

    dataFromValue(value: any) {
        return value;
    }

    dataFromString(value: string) {
        return value;
    }

    dataToString(data: any): string {
        return data.toString();
    }

    dataToEsFilter(): EsTermFilter {
        return {
            term: {
                [this.corpusField.name]: this.currentData
            }
        };
    }

    dataFromEsFilter(esFilter: EsTermFilter): string {
        const data = _.first(_.values(esFilter.term));
        return data;
    }
}

const parseMinMax = (value: string[]): [string, string] => {
    const term = value[0];
    if (term.split(':').length === 2) {
        return term.split(':') as [string, string];
    } else if (value.length === 1) {
        return [term, term];
    } else {
        return [value[0], value[1]];
    }
};

export type SearchFilter = DateFilter | MultipleChoiceFilter | RangeFilter | BooleanFilter | AdHocFilter;

export const isFieldFilter = (filter: FilterInterface): filter is SearchFilter =>
    'corpusField' in filter;
