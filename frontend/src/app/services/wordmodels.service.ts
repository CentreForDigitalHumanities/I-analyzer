/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { IResourceAction, IResourceMethod, Resource, ResourceAction, ResourceHandler, ResourceParams,
    ResourceRequestMethod } from '@ngx-resource/core';

import { environment } from '../../environments/environment';
import { RelatedWordsResults, WordInModelResult, WordSimilarity } from '../models';

// workaround for https://github.com/angular/angular-cli/issues/2034
type ResourceMethod<IB, O> = IResourceMethod<IB, O>;

@Injectable()
@ResourceParams()
export class WordmodelsService extends Resource {
    private wordModelsUrl: string;

    constructor(restHandler: ResourceHandler) {
        super(restHandler);
    }

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/related_words'
    })
    public relatedWordsRequest: ResourceMethod<
        { query_term: string; corpus_name: string; neighbours: number },
        RelatedWordsResults>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/get_related_words_time_interval'
    })
    public relatedWordsTimeIntervalRequest: ResourceMethod<
        { query_term: string; corpus_name: string; time: string; neighbours: number },
        WordSimilarity[]>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/similarity_over_time'
    })
    public wordSimilarityRequest: ResourceMethod<
        { term_1: string; term_2: string; corpus_name: string},
        WordSimilarity[]
    >;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/word_in_model'
    })
    public wordInModelRequest: ResourceMethod<
        { query_term: string; corpus_name: string },
        WordInModelResult>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/documentation'
    })
    public wordModelsDocumentationRequest: ResourceMethod<
        { corpus_name: string },
        { documentation: string }
    >;

    $getUrl(actionOptions: IResourceAction): string | Promise<string> {
        const urlPromise = super.$getUrl(actionOptions);
        this.wordModelsUrl = environment.apiUrl + 'wordmodels/';
        return Promise.all([this.wordModelsUrl, urlPromise]).then(([wordModelsUrl, url]) => `${wordModelsUrl}${url}`);
    }

    public async getRelatedWords(queryTerm: string, corpusName: string, neighbours: number): Promise<RelatedWordsResults> {
        return this.relatedWordsRequest({
            query_term: queryTerm,
            corpus_name: corpusName,
            neighbours,
        });
    }

    public async getWordSimilarity(term1: string, term2: string, corpusName: string): Promise<WordSimilarity[]> {
        return this.wordSimilarityRequest({term_1: term1, term_2: term2, corpus_name: corpusName});
    }

    wordInModel(term: string, corpusName: string): Promise<WordInModelResult> {
        return this.wordInModelRequest({
            query_term: term,
            corpus_name: corpusName,
        });
    }


}
