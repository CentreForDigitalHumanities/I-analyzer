import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalGraphComponent } from './local-graph.component';
import { WordmodelsService } from '@services';
import { WordmodelsServiceMock } from 'mock-data/wordmodels';
import { mockCorpus } from 'mock-data/corpus';

describe('LocalGraphComponent', () => {
    let component: LocalGraphComponent;
    let fixture: ComponentFixture<LocalGraphComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [LocalGraphComponent],
            providers: [
                { provide: WordmodelsService, useClass: WordmodelsServiceMock },
            ],
        })
            .compileComponents();

        fixture = TestBed.createComponent(LocalGraphComponent);
        component = fixture.componentInstance;
        component.corpus = mockCorpus;
        component.queryText = 'test';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
