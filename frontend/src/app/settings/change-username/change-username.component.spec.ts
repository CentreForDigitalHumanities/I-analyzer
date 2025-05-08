import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeUsernameComponent } from './change-username.component';
import { SharedModule } from 'primeng/api';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@services';
import { AuthServiceMock } from 'mock-data/auth';

describe('ChangeUsernameComponent', () => {
    let component: ChangeUsernameComponent;
    let fixture: ComponentFixture<ChangeUsernameComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ChangeUsernameComponent],
            imports: [
                SharedModule,
                ReactiveFormsModule,
            ],
            providers: [
                { provide: AuthService, useClass: AuthServiceMock },
            ],
        })
            .compileComponents();

        fixture = TestBed.createComponent(ChangeUsernameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
