import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';

import { ChangePasswordComponent } from './change-password.component';
import { SharedModule } from 'primeng/api';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@services';
import { AuthServiceMock } from 'mock-data/auth';
import { By } from '@angular/platform-browser';

describe('ChangePasswordComponent', () => {
    let component: ChangePasswordComponent;
    let fixture: ComponentFixture<ChangePasswordComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChangePasswordComponent],
            imports: [SharedModule, ReactiveFormsModule],
            providers: [
                { provide: AuthService, useClass: AuthServiceMock },
            ],
        })
            .compileComponents();

        fixture = TestBed.createComponent(ChangePasswordComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    fit('should show success message', () => {
        // message should be hidden
        const successMessage = fixture.debugElement.query(By.css('.message.is-success'));
        expect(successMessage.classes['is-hidden']).toBeTruthy();

        // fill in form and submit
        component.form.setValue({
            oldPassword: 'secret', newPassword1: 'moresecret', newPassword2: 'moresecret'
        });
        const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
        button.click();
        fixture.detectChanges();

        expect(successMessage.classes['is-hidden']).toBeFalsy();
    });
});
