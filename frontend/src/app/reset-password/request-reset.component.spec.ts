import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiService } from '../services/api.service';
import { ApiServiceMock } from '../../mock-data/api';
import { RequestResetComponent } from './request-reset.component';

describe('RequestResetComponent', () => {
  let component: RequestResetComponent;
  let fixture: ComponentFixture<RequestResetComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
        imports: [ FormsModule, ReactiveFormsModule ],
        declarations: [ RequestResetComponent ],
        providers: [
            { provide: ApiService, useValue: new ApiServiceMock() },
            {
                provide: Router, useValue: {}
            },
        ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
