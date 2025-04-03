import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaFormComponent } from './meta-form.component';
import { CorpusDefinitionService } from 'app/corpus-definitions/corpus-definition.service';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';
import { SharedModule } from '@shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';


describe('MetaFormComponent', () => {
    let component: MetaFormComponent;
    let fixture: ComponentFixture<MetaFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MetaFormComponent],
            imports: [
                SharedModule,
                ReactiveFormsModule,
                MultiSelectModule,
            ],
            providers: [CorpusDefinitionService, SlugifyPipe],
        }).compileComponents();

        fixture = TestBed.createComponent(MetaFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
