import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CorpusFilterComponent } from './corpus-filter.component';
import { commonTestBed } from '../../common-test-bed';
import { mockCorpus, mockCorpus2 } from '../../../mock-data/corpus';
import { Corpus } from '../../models';

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

        const filterResult = async (language: string, category: string, minDate: Date, maxDate: Date) => {
            component.selectedLanguage.next(language);
            component.selectedCategory.next(category);
            component.selectedMinDate.next(minDate);
            component.selectedMaxDate.next(maxDate);
            await fixture.whenStable();
            return result;
        };

        expect(await filterResult('English', undefined, undefined, undefined))
            .toEqual([mockCorpus, mockCorpus2]);
        expect(await filterResult('French', undefined, undefined, undefined))
            .toEqual([mockCorpus2]);
        expect(await filterResult(undefined, undefined, undefined, undefined))
            .toEqual([mockCorpus, mockCorpus2]);
        expect(await filterResult(undefined, 'Tests', undefined, undefined))
            .toEqual([mockCorpus]);
        expect(await filterResult('French', 'Different tests', undefined, undefined))
            .toEqual([mockCorpus2]);
        expect(await filterResult('French', 'Tests', undefined, undefined))
            .toEqual([]);
        expect(await filterResult(undefined, undefined, new Date('1920-01-01'), undefined))
            .toEqual([mockCorpus2]);
        expect(await filterResult(undefined, undefined, new Date('1820-01-01'), undefined))
            .toEqual([mockCorpus, mockCorpus2]);
        expect(await filterResult(undefined, undefined, undefined, new Date('1830-01-01')))
            .toEqual([mockCorpus]);
    });
});
