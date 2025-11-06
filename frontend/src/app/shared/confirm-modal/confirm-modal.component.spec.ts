import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmModalComponent } from './confirm-modal.component';
import { SharedModule } from '@shared/shared.module';

describe('ConfirmModalComponent', () => {
    let component: ConfirmModalComponent;
    let fixture: ComponentFixture<ConfirmModalComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SharedModule],
        })
            .compileComponents();

        fixture = TestBed.createComponent(ConfirmModalComponent);
        component = fixture.componentInstance;
        component.actionText = 'Do a thing';
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
