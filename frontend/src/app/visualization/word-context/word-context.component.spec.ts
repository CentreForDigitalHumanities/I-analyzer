import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services';
import { SearchServiceMock } from '../../../mock-data/search';

import { WordContextComponent } from './word-context.component';

describe('WordContextComponent', () => {
  let component: WordContextComponent;
  let fixture: ComponentFixture<WordContextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
        imports: [FormsModule],
      declarations: [ WordContextComponent ],
      providers: [
        { provide: SearchService, useValue: new SearchServiceMock()},
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WordContextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
