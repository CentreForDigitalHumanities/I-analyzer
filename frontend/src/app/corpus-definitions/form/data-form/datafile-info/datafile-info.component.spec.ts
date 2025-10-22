import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatafileInfoComponent } from './datafile-info.component';
import { SharedModule } from '@shared/shared.module';
import { dataFileInfoFactory } from 'mock-data/corpus-definition';

describe('DatafileInfoComponent', () => {
    let component: DatafileInfoComponent;
    let fixture: ComponentFixture<DatafileInfoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DatafileInfoComponent],
            imports: [SharedModule],
        })
            .compileComponents();

        fixture = TestBed.createComponent(DatafileInfoComponent);
        component = fixture.componentInstance;
        component.currentFileInfo = dataFileInfoFactory();
        component.currentDataFile = {
            id: 0,
            corpusID: 0,
            file: '',
            is_sample: true,
            confirmed: false,
        }
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
