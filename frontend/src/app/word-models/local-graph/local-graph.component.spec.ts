import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalGraphComponent } from './local-graph.component';

describe('LocalGraphComponent', () => {
    let component: LocalGraphComponent;
    let fixture: ComponentFixture<LocalGraphComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LocalGraphComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(LocalGraphComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
