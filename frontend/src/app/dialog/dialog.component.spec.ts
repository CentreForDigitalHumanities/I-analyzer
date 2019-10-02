import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/primeng';

import { DialogService } from '../services/index';
import { DialogServiceMock } from '../../mock-data/dialog';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
  let component: DialogComponent;
  let fixture: ComponentFixture<DialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ DialogModule ],
      declarations: [ DialogComponent ],
      providers: [
        {
            provide: DialogService, useClass: DialogServiceMock
        },
        {
            provide: Router, useValue: new RouterMock()
        } 
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

class RouterMock {

}