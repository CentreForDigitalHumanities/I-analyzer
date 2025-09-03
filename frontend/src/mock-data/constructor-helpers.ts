// these functions are shorthands to create objects that would normally come out the API

import { Corpus, FieldValues, FoundDocument, HighlightResult, SearchHit } from '../app/models';
import { corpusFactory } from './corpus';
import { TagServiceMock } from './tag';
import { EntityServiceMock } from './entity';

const tagService = new TagServiceMock() as any;
const entityService = new EntityServiceMock() as any;

export const exampleValues = {
    genre: 'Science Fiction',
    content: 'Bleep boop',
    date: '1800-01-01'
};

export const makeDocument = (
    fieldValues: FieldValues = exampleValues,
    corpus: Corpus = corpusFactory(),
    id: string = '0',
    relevance: number = 1,
    highlight: HighlightResult = undefined
): FoundDocument => {
    const hit: SearchHit = {
        _id: id, _score: relevance, _source: fieldValues, highlight
    };
    return new FoundDocument(tagService, entityService, corpus, hit);
};

