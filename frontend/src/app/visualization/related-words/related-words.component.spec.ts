import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';

import { DialogService, SearchService } from '../../services/index';
import { DialogServiceMock } from '../../../mock-data/dialog';
import { SearchServiceMock } from '../../../mock-data/search';
import { RelatedWordsComponent } from './related-words.component';

const EXAMPLE_DATA = {
    labels: ['1900-1910', '1910-1920', '1920-1930'],
    datasets: [
        {
            label: 'test',
            data: [0.2, 0.3, 0.1],
        },
        {
            label: 'test2',
            data: [0.2, 0.4, 0.1]
        },
        {
            label: 'test3',
            data: [0.1, 0.5, 0.6]
        }
    ]
};

describe('RelatedWordsComponent', () => {
  let component: RelatedWordsComponent;
  let fixture: ComponentFixture<RelatedWordsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ChartModule ],
      declarations: [ RelatedWordsComponent ],
      providers: [
        { provide: SearchService, useValue: new SearchServiceMock()},
        { provide: DialogService, useClass: DialogServiceMock },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedWordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

    it('should stack data', () => {
        const stacked = component.stackData(EXAMPLE_DATA);
        const expectedDatasets = [
            {
                label: 'test',
                data: [0.2, 0.3, 0.1],
            },
            {
                label: 'test2',
                data: [0.4, 0.7, 0.2]
            },
            {
                label: 'test3',
                data: [0.5, 1.2, 0.8]
            }
        ];

        stacked.datasets.forEach((dataset, datasetIndex) => {
            const expectedDataset = expectedDatasets[datasetIndex];
            component.dataIndices(EXAMPLE_DATA).forEach(index => {
                expect(dataset.data[index]).toBeCloseTo(expectedDataset.data[index], 8);
            });
        });
    });

    it('should transform to 0 mean', () => {
        const stacked = component.stackData(EXAMPLE_DATA);
        const withZeroSeries = component.addZeroSeries(stacked);
        const transformed = component.fixMean(withZeroSeries);
        const expectedDatasets = [
            {
                label: '',
                data: [-0.275, -0.55, -0.275],
            },
            {
                label: 'test',
                data: [-0.075, -0.25, -0.175],
            },
            {
                label: 'test2',
                data: [0.125, 0.15, -0.075]
            },
            {
                label: 'test3',
                data: [0.225, 0.65, 0.525],
            }
        ];

        transformed.datasets.forEach((dataset, datasetIndex) => {
            const expectedDataset = expectedDatasets[datasetIndex];
            component.dataIndices(EXAMPLE_DATA).forEach(index => {
                expect(dataset.data[index]).toBeCloseTo(expectedDataset.data[index], 8);
            });
        });
    });
});
