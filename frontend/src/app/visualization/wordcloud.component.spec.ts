import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { DialogService, SearchService } from '../services/index';
import { DialogServiceMock } from '../services/dialog.service.mock';
import { SearchServiceMock } from '../services/search.service.mock';
import { WordcloudComponent } from './wordcloud.component';

describe('WordcloudComponent', () => {
  let component: WordcloudComponent;
  let fixture: ComponentFixture<WordcloudComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ WordcloudComponent ],
      providers: [
        { provide: SearchService, useValue: new SearchServiceMock()},
        { provide: DialogService, useClass: DialogServiceMock },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WordcloudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
