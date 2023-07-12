// these functions are shorthands to create objects that would normally come out the API

import { FieldValues, FoundDocument, HighlightResult, SearchHit } from '../app/models';

export const makeDocument = (
    fieldValues: FieldValues,
    id: string = '0',
    relevance: number = 1,
    highlight: HighlightResult = undefined
): FoundDocument => {
    const hit: SearchHit = {
        _id: id, _score: relevance, _source: fieldValues, highlight
    };
    return new FoundDocument(hit);
};

