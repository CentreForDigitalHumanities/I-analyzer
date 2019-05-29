import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ApiService } from '../services/api.service';
import { ApiServiceMock } from '../services/api.service.mock';
import { RequestResetComponent } from './request-reset.component';

describe('RequestResetComponent', () => {
  let component: RequestResetComponent;
  let fixture: ComponentFixture<RequestResetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
        imports: [ FormsModule, ReactiveFormsModule ],
        declarations: [ RequestResetComponent ],
        providers: [
            { provide: ApiService, useValue: new ApiServiceMock() },
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
