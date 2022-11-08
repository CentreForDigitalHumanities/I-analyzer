import { Corpus, QueryModel } from "../app/models";
import { EsQuery } from "../app/services";

export class ElasticSearchServiceMock {
    /**
    * Clear ES's scroll ID to free ES resources
    */
    public clearScroll() {
    }

    esQueryToQueryModel(query: EsQuery, corpus: Corpus): QueryModel {
        return {
            queryText: ''
        }
    }
}
