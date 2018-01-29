import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { ApiService } from './api.service';
import { UserService } from './user.service';
import { Corpus, CorpusField, SearchFilter } from '../models/corpus';

@Injectable()
export class CorpusService {
    private currentCorpusSubject = new BehaviorSubject<Corpus | undefined>(undefined);

    public currentCorpus = this.currentCorpusSubject.asObservable();

    constructor(private apiService: ApiService, private userService: UserService) {
    }

    /**
     * Sets a corpus and returns a boolean indicating whether the corpus exists and is accessible.
     * @param corpusName Name of the corpus
     */
    public set(corpusName: string): Promise<boolean> {
        return this.get().then(all => {
            let corpus = all.find(c => c.name == corpusName);
            if (!corpus) {
                return false;
            } else {
                this.currentCorpusSubject.next(corpus);
                return true;
            }
        })
    }

    public get(): Promise<Corpus[]> {
        return this.apiService.corpus().then(data => this.parseCorpusList(data));
    }

    private parseCorpusList(data: any): Corpus[] {
        let currentUser = this.userService.getCurrentUserOrFail();
        let availableCorpora = Object.keys(data).filter(name => currentUser.hasRole(name));
        return availableCorpora.map(corpus => this.parseCorpusItem(corpus, data[corpus]));
    }

    private parseCorpusItem(name: string, data: any): Corpus {
        let allFields: CorpusField[] = data.fields.map(item => this.parseField(item));

        return new Corpus(
            name,
            data.title,
            data.description,
            data.es_doctype,
            data.es_index,
            allFields,
            this.parseDate(data.min_date),
            this.parseDate(data.max_date));
    }

    private parseField(data: any): CorpusField {
        return {
            description: data.description,
            displayName: data.display_name || data.name,
            displayType: data.display_type || data['es_mapping'].type,
            prominentField: data.prominent_field,
            termFrequency: data.term_frequency,
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
