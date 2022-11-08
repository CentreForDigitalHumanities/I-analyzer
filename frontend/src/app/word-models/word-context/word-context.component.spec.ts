import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services';
import { SearchServiceMock } from '../../../mock-data/search';

import { WordContextComponent } from './word-context.component';
import { commonTestBed } from '../../common-test-bed';

describe('WordContextComponent', () => {
    let component: WordContextComponent;
    let fixture: ComponentFixture<WordContextComponent>;

    beforeEach(async () => {
        commonTestBed().testingModule.compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WordContextComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update datasets', () => {
        const dataset = {
            data: [
                {
                    'label': 'schenkt',
                    'x': 1,
                    'y': -0.53
                }, {
                    'label': 'vooruitgaat',
                    'x': 1,
                    'y': -0.47
                },
                {
                    'label': 'aloude',
                    'x': -0.93,
                    'y': 0.26
                },
                {
                    'label': 'band',
                    'x': -0.80,
                    'y': 1.00
                },
            ],
            'time': '1814-1849'
        };

        const newData = {
            data: [
                {
                    'label': 'twee',
                    'x': -0.5,
                    'y': 0.33
                }, {
                    'label': 'vooruitgaat',
                    'x': 0.75,
                    'y': -0.2
                },
                {
                    'label': 'schenkt',
                    'x': 0.93,
                    'y': -0.26
                },
                {
                    'label': 'band',
                    'x': -0.50,
                    'y': 1.00
                },
            ],
            'time': '1814-1849'
        };

        component.updateDataset(dataset, newData);

        expect(dataset.data.length).toEqual(4);

        let point = dataset.data.find(p => p.label === 'vooruitgaat');
        expect(point).toBeDefined();
        expect(point.x).toEqual(0.75);
        expect(point.y).toEqual(-0.2);

        point = dataset.data.find(p => p.label === 'aloude');
        expect(point).toBeUndefined();

        point = dataset.data.find(p => p.label === 'twee');
        expect(point).toBeDefined();
    });
});
