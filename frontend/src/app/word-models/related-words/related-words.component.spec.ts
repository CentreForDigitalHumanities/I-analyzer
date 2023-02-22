import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RelatedWordsComponent } from './related-words.component';
import { commonTestBed } from '../../common-test-bed';
import { mockCorpus } from '../../../mock-data/corpus';

describe('RelatedWordsComponent', () => {
  let component: RelatedWordsComponent;
  let fixture: ComponentFixture<RelatedWordsComponent>;

  beforeEach(waitForAsync(() => {
    commonTestBed().testingModule.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelatedWordsComponent);
    component = fixture.componentInstance;
    component.corpus = mockCorpus;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
