import { TestBed, fakeAsync, waitForAsync } from '@angular/core/testing';
import * as _ from 'lodash';
import { reduce, take } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { makeDocument } from '../../mock-data/constructor-helpers';
import { mockCorpus, mockCorpus3 } from '../../mock-data/corpus';
import { FoundDocument } from './found-document';
import { TagService } from '../services/tag.service';
import { TagServiceMock, mockTags } from '../../mock-data/tag';
import { Tag } from './tag';
import { ElasticSearchService } from '../services';
import { ElasticSearchServiceMock } from '../../mock-data/elastic-search';

const maxScore = 2.9113607;
const mockResponse = {
    _index: 'troonredes',
    _id: '1994_troonrede',
    _score: 2.9113607,
    _source: {
        date: '1994-09-20',
        id: '1994_troonrede',
        title: 'Troonrede 20 september 1994',
        monarch: 'Beatrix',
        speech_type: 'troonrede',
        content: 'Om op langere termijn de zekerheid te kunnen blijven bieden ' +
            'van een gegarandeerd basispensioen, en om solidaire regelingen bij ' +
            'arbeidsongeschiktheid en werkloosheid in stand te houden, is een ' +
            'kritische toets van het bestaande stelsel nu geboden.'
    },
    highlight: {
        content: [
            '<em>toets</em>'
        ]
    }
};

fdescribe('FoundDocument', () => {
    const mockTagService = new TagServiceMock() as any;
    const mockElasticService = new ElasticSearchServiceMock() as any;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: TagService, useClass: TagServiceMock },
                { provide: ElasticSearchService, useClass: ElasticSearchServiceMock }
            ]
        });
    });

    fit('should construct from an elasticsearch response', () => {
        const document = new FoundDocument(mockTagService, mockElasticService, mockCorpus, mockResponse, maxScore);

        expect(document.id).toBe('1994_troonrede');
        expect(document.fieldValues['monarch']).toBe('Beatrix');
    });

    it('should reflect context', () => {
        const notDefinedInCorpus = makeDocument({great_field: 'test'}, mockCorpus);
        expect(notDefinedInCorpus.hasContext).toBeFalse();

        const missingValues = makeDocument({great_field: 'test'}, mockCorpus3);
        expect(missingValues.hasContext).toBeFalse();

        const shouldHaveContext = makeDocument({
            great_field: 'test',
            date: new Date('1800-01-01')
        }, mockCorpus3);
        expect(shouldHaveContext.hasContext).toBeTrue();
    });

    it('should set tags', waitForAsync(() => {
        const doc = makeDocument({ great_field: 'test' });

        const tags$: Observable<Tag[][]> = doc.tags$.pipe(
            take(3),
            reduce(
                (accumulated, current) => [...accumulated, current],
                [],
            ),
        );

        const tag1 = _.first(mockTags);
        const tag2 = _.last(mockTags);

        doc.removeTag(tag1);
        doc.addTag(tag1);

        tags$.subscribe(allTags => {
            expect(allTags).toEqual([
                [tag1, tag2],
                [tag2],
                [tag1, tag2]
            ]);
        });
    }));

    it('should fetch and display named entities', fakeAsync(() => {
        const searchResponse = {
            _index: 'test_index',
            _id: 'my_identifier',
            _score: 2.9113607,
            _source: {
                date: '1994-09-20',
                id: 'my_identifier',
                content: 'Wally was last seen in Paris.'
            },
            highlight: {
                content: [
                    '<em>seen</em>'
                ]
            }
        };
        const document = new FoundDocument(mockTagService, mockElasticService, mockCorpus, searchResponse, maxScore);
        expect(document.fieldValues['content']).toEqual(
            '<mark class="entity-per">Wally</mark> was last seen in <mark class="entity-loc">Paris</mark>');
    }));
});
