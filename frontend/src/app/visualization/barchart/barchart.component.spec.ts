import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { ApiService, ApiRetryService, ElasticSearchService, LogService, QueryService, SearchService, UserService, DialogService } from '../../services/index';
import { ApiServiceMock } from '../../../mock-data/api';
import { ElasticSearchServiceMock } from '../../../mock-data/elastic-search';
import { UserServiceMock } from '../../../mock-data/user';
import { DialogServiceMock } from '../../../mock-data/dialog';
import { BarChartComponent } from './barchart.component';
import { Corpus, QueryModel } from '../../models';

const MOCK_CORPUS: Corpus = {
    name: 'mock-corpus',
    serverName: 'bogus',
    title: 'Mock Corpus',
    description: 'corpus for testing',
    doctype: 'article',
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
            searchable: true,
            downloadable: true,
            searchFilter: undefined,
            primarySort: false,
            sortable: false,
            hidden: false,
        }
    ]
};

describe('BarchartComponent', () => {
    let component: BarChartComponent<any>;
    let fixture: ComponentFixture<BarChartComponent<any>>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule],
            providers: [
                {
                    provide: ApiService, useValue: new ApiServiceMock()
                },
                ApiRetryService,
                {
                    provide: ElasticSearchService, useValue: new ElasticSearchServiceMock()
                },
                LogService,
                QueryService,
                SearchService,
                {
                    provide: UserService, useValue: new UserServiceMock()
                },
                { provide: DialogService, useClass: DialogServiceMock },
            ],
            declarations: [BarChartComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BarChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });

    it('should filter text fields', () => {
        component.corpus = MOCK_CORPUS;

        const cases: {query: QueryModel, textFields: string[]}[] = [
            {
                query: {
                    queryText: 'test'
                },
                textFields: [ 'content', 'text' ]
            }, {
                query: {
                    queryText: 'text',
                    fields: ['content'],
                },
                textFields: ['content']
            }
        ];

        cases.map(testCase => {
            const newQuery = component.restrictToTextFields(testCase.query);
            expect(newQuery.fields).toEqual(testCase.textFields);
        });
    });
});
