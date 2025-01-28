/**
 * Mock corpus data as would be returned by the backend
 */
export const MockCorpusResponse = [
    {
        name: 'test1',
        server_name: 'default',
        es_index: 'test1',
        overview_fields: [],
        fields: [{
            displayName: 'Test Field', name: 'test_field'
        }],
        max_year: 2010,
        min_year: 1785,
    },
    {
        name: 'test2',
        server_name: 'default',
        es_index: 'test2',
        overview_fields: [],
        fields: [],
        max_year: 2010,
        min_year: 1785,
    },
];

export type MockCorpusName = keyof (typeof MockCorpusResponse);
export const MockCorpusRoles =
    Object.keys(MockCorpusResponse).map(name => ({
            name,
            description: '',
            corpora: []
        }));
