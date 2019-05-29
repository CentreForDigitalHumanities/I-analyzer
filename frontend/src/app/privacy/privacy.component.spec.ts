import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyComponent } from './privacy.component';
import { DialogService } from '../services/dialog.service';
import { DialogServiceMock } from '../services/dialog.service.mock';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrivacyComponent ],
      providers: [ { provide: DialogService, useClass: DialogServiceMock } ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
