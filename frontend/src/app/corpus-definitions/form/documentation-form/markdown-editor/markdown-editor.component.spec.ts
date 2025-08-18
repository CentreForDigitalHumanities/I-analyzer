import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownEditorComponent } from './markdown-editor.component';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';

@Component({
    standalone: false,
    template: `
    <label id="story-label">Write a story</label>
    <ia-markdown-editor [formControl]="control" ariaLabelledBy="story-label">
    `
})
class EditorTestComponent {
    control = new FormControl<string>('');
}

describe('MarkdownEditorComponent', () => {
    let component: EditorTestComponent;
    let fixture: ComponentFixture<EditorTestComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MarkdownEditorComponent, EditorTestComponent],
            imports: [SharedModule, ReactiveFormsModule],
        })
            .compileComponents();

        fixture = TestBed.createComponent(EditorTestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

});
