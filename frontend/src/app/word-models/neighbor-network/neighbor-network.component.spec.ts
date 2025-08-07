import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeighborNetworkComponent } from './neighbor-network.component';
import { WordmodelsService } from '@services';
import { WordmodelsServiceMock } from 'mock-data/wordmodels';
import { mockCorpus } from 'mock-data/corpus';
import { FreqtableComponent } from 'app/visualization/freqtable.component';
import { SharedModule } from '@shared/shared.module';

describe('NeighborNetworkComponent', () => {
    let component: NeighborNetworkComponent;
    let fixture: ComponentFixture<NeighborNetworkComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NeighborNetworkComponent, FreqtableComponent],
            imports: [SharedModule],
            providers: [
                { provide: WordmodelsService, useClass: WordmodelsServiceMock },
            ],
        })
            .compileComponents();

        fixture = TestBed.createComponent(NeighborNetworkComponent);
        component = fixture.componentInstance;
        component.corpus = mockCorpus;
        component.queryText = 'test';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
