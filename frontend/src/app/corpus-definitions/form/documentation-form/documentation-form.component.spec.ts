import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentationFormComponent } from './documentation-form.component';

describe('DocumentationFormComponent', () => {
    let component: DocumentationFormComponent;
    let fixture: ComponentFixture<DocumentationFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DocumentationFormComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(DocumentationFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
