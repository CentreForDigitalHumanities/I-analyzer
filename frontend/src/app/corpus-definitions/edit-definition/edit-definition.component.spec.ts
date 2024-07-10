import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditDefinitionComponent } from './edit-definition.component';
import { commonTestBed } from '../../common-test-bed';

describe('EditDefinitionComponent', () => {
    let component: EditDefinitionComponent;
    let fixture: ComponentFixture<EditDefinitionComponent>;

    beforeEach(waitForAsync(() => {
        commonTestBed().testingModule.compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EditDefinitionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
