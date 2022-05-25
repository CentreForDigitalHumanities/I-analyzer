import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';

import { DialogService, SearchService } from '../../services/index';
import { DialogServiceMock } from '../../../mock-data/dialog';
import { SearchServiceMock } from '../../../mock-data/search';
import { RelatedWordsComponent } from './related-words.component';

describe('RelatedWordsComponent', () => {
  let component: RelatedWordsComponent;
  let fixture: ComponentFixture<RelatedWordsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule, ChartModule ],
      declarations: [ RelatedWordsComponent ],
      providers: [
        { provide: SearchService, useValue: new SearchServiceMock()},
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
