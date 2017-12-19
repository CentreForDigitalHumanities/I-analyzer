import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ApiService } from './api.service';
import { Corpus, CorpusField, SearchFilter } from '../models/corpus';

@Injectable()
export class CorpusService {

    constructor(private apiService: ApiService) {
    }

    public get(): Promise<Corpus[]> {
        return this.apiService.corpus().then(data => this.parseCorpusList(data));
    }

    private parseCorpusList(data: any): Corpus[] {
        return Object.keys(data).map(name => this.parseCorpusItem(name, data[name]));
    }

    private parseCorpusItem(name: string, data: any): Corpus {
        return new Corpus(
            name,
            data.title,
            data.description,
            data.visualize,
            data.es_doctype,
            data.es_index,
            data.fields.map(item => this.parseField(item)),
            this.parseDate(data.min_date),
            this.parseDate(data.max_date));
    }

    private parseField(data: any): CorpusField {
        return {
            description: data.description,
            displayName: data.display_name || data.name,
            displayType: data.display_type || data['es_mapping'].type,
            hidden: data.hidden,
            name: data.name,
            searchFilter: data['search_filter'] ? this.parseSearchFilter(data['search_filter']) : null
        }
    }

    private parseSearchFilter(filter: any): SearchFilter {
        switch (filter.name) {
            case 'BooleanFilter':
                return {
                    description: filter.description,
                    name: filter.name,
                    falseText: filter['false'],
                    trueText: filter['true']
                }
            case 'MultipleChoiceFilter':
                return {
                    description: filter.description,
                    name: filter.name,
                    options: filter.options
                }
            case 'RangeFilter':
                return {
                    description: filter.description,
                    name: filter.name,
                    lower: filter.lower,
                    upper: filter.upper
                }
            case 'DateFilter':
                return {
                    description: filter.description,
                    name: filter.name,
                    lower: new Date(filter.lower),
                    upper: new Date(filter.upper)
                }
        }
    }

    private parseDate(date: any): Date {
        // months are zero-based!
        return new Date(date.year, date.month - 1, date.day, date.hour, date.minute);
    }
}
