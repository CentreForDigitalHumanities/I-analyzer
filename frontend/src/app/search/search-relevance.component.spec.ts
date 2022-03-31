import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SearchRelevanceComponent } from './search-relevance.component';

describe('SearchRelevanceComponent', () => {
    let component: SearchRelevanceComponent;
    let fixture: ComponentFixture<SearchRelevanceComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SearchRelevanceComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SearchRelevanceComponent);
        component = fixture.componentInstance;
        component.value = 0.5;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
