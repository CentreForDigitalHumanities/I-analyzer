import { Injectable } from '@angular/core';
import { IResourceAction, IResourceMethod, Resource, ResourceAction, ResourceHandler, ResourceParams, ResourceRequestMethod } from '@ngx-resource/core';
import { RelatedWordsResults, WordSimilarityResults } from '../models';
import { ConfigService } from './config.service';

// workaround for https://github.com/angular/angular-cli/issues/2034
type ResourceMethod<IB, O> = IResourceMethod<IB, O>;

@Injectable()
@ResourceParams()
export class WordmodelsService extends Resource {
    private wordModelsUrl: Promise<string> | null = null;

    constructor(private config: ConfigService, restHandler: ResourceHandler) {
        super(restHandler);
    }

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/get_related_words'
    })
    public getRelatedWords: ResourceMethod<
        { query_term: string, corpus_name: string },
        { success: boolean, message?: string, related_word_data?: RelatedWordsResults }>;

    @ResourceAction({
        method: ResourceRequestMethod.Post,
        path: '/get_related_words_time_interval'
    })
    public getRelatedWordsTimeInterval: ResourceMethod<
        { query_term: string, corpus_name: string, time: string },
        { success: boolean, message?: string, related_word_data?: RelatedWordsResults }>;

    @ResourceAction({
        method: ResourceRequestMethod.Get,
        path: '/get_similarity_over_time'
    })
    public getWordSimilarity: ResourceMethod<
        { term_1: string, term_2: string, corpus_name: string},
        { success: false, message: string } | { success: true, data: WordSimilarityResults }
    >

    $getUrl(actionOptions: IResourceAction): string | Promise<string> {
        const urlPromise = super.$getUrl(actionOptions);
        if (!this.wordModelsUrl) {
            this.wordModelsUrl = this.config.get().then(config => config.wordModelsUrl);
        }

        return Promise.all([this.wordModelsUrl, urlPromise]).then(([wordModelsUrl, url]) => `${wordModelsUrl}${url}`);
    }

}
