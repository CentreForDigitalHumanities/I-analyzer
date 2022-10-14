import { Injectable } from '@angular/core';
import { IResourceAction, IResourceMethod, Resource, ResourceAction, ResourceHandler, ResourceParams, ResourceRequestMethod } from '@ngx-resource/core';

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
        path: '/get_related_words'
    })
    public getRelatedWords: ResourceMethod<
        { query_term: string, corpus_name: string },
        { success: false, message: string } | { success: true, data: RelatedWordsResults }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/get_related_words_time_interval'
    })
    public getRelatedWordsTimeInterval: ResourceMethod<
        { query_term: string, corpus_name: string, time: string },
        { success: false, message: string } | { success: true, data: WordSimilarity[] }>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/get_similarity_over_time'
    })
    public getWordSimilarity: ResourceMethod<
        { term_1: string, term_2: string, corpus_name: string},
        { success: false, message: string } | { success: true, data: WordSimilarity[] }
    >

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/get_word_in_model'
    })
    public getWordInModel: ResourceMethod<
        { query_term: string, corpus_name: string, },
        { success: boolean, message: string, result: WordInModelResult }>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/get_wm_documentation'
    })
    public getWordModelsDocumentation: ResourceMethod<
        { corpus_name: string },
        { documentation: string }
    >;

    $getUrl(actionOptions: IResourceAction): string | Promise<string> {
        const urlPromise = super.$getUrl(actionOptions);
        this.wordModelsUrl = environment.wordModelsUrl;
        return Promise.all([this.wordModelsUrl, urlPromise]).then(([wordModelsUrl, url]) => `${wordModelsUrl}${url}`);
    }

}
