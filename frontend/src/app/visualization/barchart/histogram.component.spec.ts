import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Corpus } from '../../models';

import { commonTestBed } from '../../common-test-bed';

import { HistogramComponent } from './histogram.component';

const MOCK_CORPUS: Corpus = {
    name: 'mock-corpus',
    serverName: 'bogus',
    title: 'Mock Corpus',
    description: 'corpus for testing',
    index: 'mock-corpus',
    image: 'nothing',
    minDate: new Date('1-1-1800'),
    maxDate: new Date('1-1-2000'),
    scan_image_type: 'nothing',
    allow_image_download: false,
    word_models_present: false,
    fields: [
        {
            name: 'content',
            description: 'main content field',
            displayName: 'Content',
            displayType: 'text_content',
            mappingType: 'text',
            searchable: true,
            downloadable: true,
            searchFilter: undefined,
            primarySort: false,
            sortable: false,
            hidden: false,
        }, {
            name: 'keyword-1',
            description: 'a keyword field',
            displayName: 'Keyword 1',
            displayType: 'keyword',
            mappingType: 'keyword',
            searchable: true,
            downloadable: true,
            searchFilter: undefined,
            primarySort: false,
            sortable: false,
            hidden: false,
        }, {
            name: 'text',
            description: 'a text field',
            displayName: 'Text',
            displayType: 'text',
            mappingType: 'text',
            searchable: true,
            downloadable: true,
            searchFilter: undefined,
            primarySort: false,
            sortable: false,
            hidden: false,
        }
    ]
};


describe('HistogramCompoment', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });


    it('should filter text fields', () => {
        component.corpus = MOCK_CORPUS;
        component.frequencyMeasure = 'documents';

        const cases = [
            {
                query: {
                    queryText: 'test'
                }
            }, {
                query: {
                    queryText: 'test',
                    fields: ['content', 'text'],
                }
            }
        ];

        cases.forEach(testCase => {
            const newQuery = component.selectSearchFields(testCase.query);
            expect(newQuery.fields).toEqual(testCase.query.fields);
        });

        component.frequencyMeasure = 'tokens';

        cases.forEach(testCase => {
            const newQuery = component.selectSearchFields(testCase.query);
            expect(newQuery.fields).toEqual(['content']);
        });
    });

});
