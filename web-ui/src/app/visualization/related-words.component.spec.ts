import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/primeng'

import { DialogService, SearchService } from '../services/index';
import { DialogServiceMock } from '../services/dialog.service.mock';
import { RelatedWordsComponent } from './related-words.component';

describe('RelatedWordsComponent', () => {
  let component: RelatedWordsComponent;
  let fixture: ComponentFixture<RelatedWordsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ChartModule ],
      declarations: [ RelatedWordsComponent ],
      providers: [ 
        SearchService,
        { provide: DialogService, useClass: DialogServiceMock },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedWordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
