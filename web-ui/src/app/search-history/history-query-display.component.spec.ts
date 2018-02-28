import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { HistoryQueryDisplayComponent } from './history-query-display.component';

describe('HistoryQueryDisplayComponent', () => {
  let component: HistoryQueryDisplayComponent;
  let fixture: ComponentFixture<HistoryQueryDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule ],
      declarations: [ HistoryQueryDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoryQueryDisplayComponent);
    component = fixture.componentInstance;
    component.queryModel = {
            queryText: "Wally",
            filters: []
        }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
