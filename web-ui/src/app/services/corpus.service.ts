import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { ApiRetryService } from './api-retry.service';
import { UserService } from './user.service';
import { Corpus, CorpusField, SearchFilter } from '../models/corpus';

@Injectable()
export class CorpusService {
    private currentCorpusSubject = new BehaviorSubject<Corpus | undefined>(undefined);

    public currentCorpus = this.currentCorpusSubject.asObservable();

    constructor(private apiRetryService: ApiRetryService, private userService: UserService) {
    }

    /**
     * Sets a corpus and returns a boolean indicating whether the corpus exists and is accessible.
     * @param corpusName Name of the corpus
     */
    public set(corpusName: string): Promise<boolean> {
        if (this.currentCorpusSubject.value && this.currentCorpusSubject.value.name == corpusName) {
            // no need to retrieve the corpus again if nothing changed
            return Promise.resolve(true);
        }
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
        return this.apiRetryService.requireLogin(api => api.corpus()).then(data => this.parseCorpusList(data));
    }

    private async parseCorpusList(data: any): Promise<Corpus[]> {
        let currentUser = await this.userService.getCurrentUser();
        let availableCorpora = Object.keys(data).filter(name => currentUser.canAccessCorpus(name));
        return availableCorpora.map(corpus => this.parseCorpusItem(corpus, data[corpus]));
    }

    private parseCorpusItem(name: string, data: any): Corpus {
        let allFields: CorpusField[] = data.fields.map(item => this.parseField(item));

        return new Corpus(
            data.server_name,
            name,
            data.title,
            data.description,
            data.es_doctype,
            data.es_index,
            allFields,
            this.parseDate(data.min_date),
            this.parseDate(data.max_date),
            data.image,
            data.scan_image_type);
    }

    private parseField(data: any): CorpusField {
        return {
            description: data.description,
            displayName: data.display_name || data.name,
            displayType: data.display_type || data['es_mapping'].type,
            resultsOverview: data.results_overview,
            preselected: data.preselected,
            visualizationType: data.visualization_type,
            visualizationSort: data.visualization_sort,
            hidden: data.hidden,
            sortable: data.sortable,
            searchable: data.searchable,
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
