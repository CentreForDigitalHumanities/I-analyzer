import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataFieldComponent } from './metadata-field.component';
import { commonTestBed } from 'app/common-test-bed';

describe('MetadataFieldComponent', () => {
    let component: MetadataFieldComponent;
    let fixture: ComponentFixture<MetadataFieldComponent>;

    beforeEach(async () => {
        await commonTestBed().testingModule.compileComponents();

        fixture = TestBed.createComponent(MetadataFieldComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
