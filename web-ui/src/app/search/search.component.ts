import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { Corpus, SearchFilterData, SearchSample } from '../models/index';
import { CorpusService, SearchService } from '../services/index';
@Component({
    selector: 'app-search',
    templateUrl: './search.component.html',
    styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
    public visibleTab: Tab = "search";
    public corpus: Corpus;
    public availableCorpora: Promise<Corpus[]>;

    public isSearching: boolean;
    public query: string;
    public queryField: { [name: string]: { useAsFilter: boolean, visible: boolean, data?: SearchFilterData } };
    public sample: SearchSample;

    constructor(private corpusService: CorpusService, private searchService: SearchService, private activatedRoute: ActivatedRoute, private title: Title) { }

    ngOnInit() {
        this.availableCorpora = this.corpusService.get();

        this.activatedRoute.params.subscribe(params => {
            let corpusName = params['corpus'];
            this.availableCorpora.then(items => {
                let found = items.find(corpus => corpus.name == corpusName);
                if (!found) {
                    throw 'Invalid corpus specified!';
                }
                this.corpus = found;
                this.title.setTitle(this.corpus.name);
                this.queryField = {};
                for (let field of this.corpus.fields) {
                    this.queryField[field.name] = { useAsFilter: false, visible: true };
                }
            });
        })
    }

    public enableFilter(name: string) {
        if (!this.queryField[name].useAsFilter) {
            this.queryField[name].useAsFilter = true;
        }
    }

    public showTab(tab: Tab) {
        this.visibleTab = tab;
    }

    public search() {
        this.isSearching = true;
        this.searchService.search(
            this.corpus.name,
            this.query,
            this.getQueryFields(),
            this.getFilterData())
            .then(sample => {
                this.sample = sample;
                this.isSearching = false;
            });
    }

    public download() {
        this.searchService.searchAsCsv(
            this.corpus.name,
            this.query,
            this.getQueryFields(),
            this.getFilterData());
    }

    public updateFilterData(name: string, data: any) {
        this.queryField[name].data = data;
    }

    private getQueryFields(): string[] {
        return Object.keys(this.queryField).filter(field => this.queryField[field].visible);
    }
    private getFilterData(): SearchFilterData[] {
        let data = [];
        for (let fieldName of Object.keys(this.queryField)) {
            let field = this.queryField[fieldName];
            if (field.useAsFilter) {
                data.push(field.data);
            }
        }
        return data;
    }
}

type Tab = "search" | "columns";
