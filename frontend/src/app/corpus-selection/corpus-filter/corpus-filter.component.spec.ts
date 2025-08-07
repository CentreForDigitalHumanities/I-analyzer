import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CorpusFilterComponent } from './corpus-filter.component';
import { commonTestBed } from '../../common-test-bed';
import { mockCorpus, mockCorpus2 } from '../../../mock-data/corpus';
import { Corpus } from '@models';

describe('CorpusFilterComponent', () => {
    let component: CorpusFilterComponent;
    let fixture: ComponentFixture<CorpusFilterComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CorpusFilterComponent);
        component = fixture.componentInstance;
        component.corpora = [mockCorpus, mockCorpus2];
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should filter corpora', async () => {
        let result: Corpus[];
        component.filtered.subscribe(data => result = data);

        const filterResult = async (language: string | null, category: string | null, minYear: number, maxYear: number) => {
            component.form.setValue({
                language, category, minYear, maxYear
            });
            await fixture.whenStable();
            return result;
        };

        expect(await filterResult('English', null, 1800, 2000))
            .toEqual([mockCorpus, mockCorpus2]);
        expect(await filterResult('French', null, 1800, 2000))
            .toEqual([mockCorpus2]);
        expect(await filterResult(null, null, 1800, 2000))
            .toEqual([mockCorpus, mockCorpus2]);
        expect(await filterResult(null, 'Tests', 1800, 2000))
            .toEqual([mockCorpus]);
        expect(await filterResult('French', 'Different tests', 1800, 2000))
            .toEqual([mockCorpus2]);
        expect(await filterResult('French', 'Tests', 1800, 2000))
            .toEqual([]);
        expect(await filterResult(null, null, 1920, 2000))
            .toEqual([mockCorpus2]);
        expect(await filterResult(null, null, 1820, 2000))
            .toEqual([mockCorpus, mockCorpus2]);
        expect(await filterResult(null, null, 1800, 1830))
            .toEqual([mockCorpus]);
    });
});
