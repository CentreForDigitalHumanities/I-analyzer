import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UserService } from '../services/user.service';
import { DialogService } from '../services/dialog.service';
import { DialogServiceMock } from '../services/dialog.service.mock';

import { RegistrationComponent } from './registration.component';
import { PrivacyComponent } from '../privacy/privacy.component';

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ReactiveFormsModule ],
      declarations: [ RegistrationComponent, PrivacyComponent ],
      providers: [
        { provide: UserService, useValue: {} },
        { provide: DialogService, useClass: DialogServiceMock }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
