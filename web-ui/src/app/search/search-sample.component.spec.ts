import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HighlightService } from '../services/highlight.service';
import { HighlightPipe } from './highlight-pipe';
import { SearchSampleComponent } from './search-sample.component';

describe('SearchSampleComponent', () => {
    let component: SearchSampleComponent;
    let fixture: ComponentFixture<SearchSampleComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [HighlightPipe, SearchSampleComponent],
            providers: [HighlightService]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchSampleComponent);
        component = fixture.componentInstance;
        let hits: { [key: string]: string }[] = [];
        component.sample = {
            fields: ['a', 'b'],
            hits: [{ 'a': '1', 'b': '2' }, { 'a': '3', 'b': '4' }],
            total: 2
        };

        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});

