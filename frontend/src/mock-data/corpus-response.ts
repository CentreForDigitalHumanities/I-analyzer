/**
 * Mock corpus data as would be returned by the Flask service.
 */
export const MockCorpusResponse = {
    "test1": {
        "name": "test1",
        "server_name": "default",
        "es_index": "test1",
        "es_settings": null,
        "overview_fields": [],
        "fields": [],
        "max_date": { "day": 31, "hour": 0, "minute": 0, "month": 12, "year": 2010 },
        "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 }
    },
    "test2": {
        "name": "test2",
        "server_name": "default",
        "es_index": "test2",
        "es_settings": null,
        "overview_fields": [],
        "fields": [],
        "max_date": { "day": 31, "hour": 0, "minute": 0, "month": 12, "year": 2010 },
        "min_date": { "day": 1, "hour": 0, "minute": 0, "month": 1, "year": 1785 }
    },
}

export type MockCorpusName = keyof (typeof MockCorpusResponse);
export const MockCorpusRoles =
    Object.keys(MockCorpusResponse).map(name => {
        return {
            name,
            description: '',
            corpora: []
        };
    });
