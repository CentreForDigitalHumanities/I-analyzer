import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import {
    RelatedWordsResults,
    WordInModelResult,
    WordSimilarity,
} from '../models';

@Injectable()
export class WordmodelsService {
    constructor(private http: HttpClient) {}

    public relatedWordsRequest(data: {
        query_term: string;
        corpus_name: string;
        neighbours: number;
    }): Promise<RelatedWordsResults> {
        return this.http
            .post<RelatedWordsResults>(this.wmApiRoute('related_words'), data)
            .toPromise();
    }

    public wordSimilarityRequest(data: {
        term_1: string;
        term_2: string;
        corpus_name: string;
    }): Promise<WordSimilarity[]> {
        return this.http
            .get<WordSimilarity[]>(this.wmApiRoute('similarity_over_time'))
            .toPromise();
    }

    public wordInModelRequest(data: {
        query_term: string;
        corpus_name: string;
    }): Promise<WordInModelResult> {
        return this.http
            .get<WordInModelResult>(this.wmApiRoute('word_in_models'))
            .toPromise();
    }

    public wordModelsDocumentationRequest(data: {
        corpus_name: string;
    }): Promise<{ documentation: string }> {
        return this.http
            .get<{ documentation: string }>(this.wmApiRoute('documentation'))
            .toPromise();
    }

    public async getRelatedWords(
        queryTerm: string,
        corpusName: string,
        neighbours: number
    ): Promise<RelatedWordsResults> {
        return this.relatedWordsRequest({
            query_term: queryTerm,
            corpus_name: corpusName,
            neighbours,
        });
    }

    public async getWordSimilarity(
        term1: string,
        term2: string,
        corpusName: string
    ): Promise<WordSimilarity[]> {
        return this.wordSimilarityRequest({
            term_1: term1,
            term_2: term2,
            corpus_name: corpusName,
        });
    }

    public wordInModel(
        term: string,
        corpusName: string
    ): Promise<WordInModelResult> {
        return this.wordInModelRequest({
            query_term: term,
            corpus_name: corpusName,
        });
    }

    private wmApiRoute = (route: string): string => `/api/worldmodels/${route}`;
}
