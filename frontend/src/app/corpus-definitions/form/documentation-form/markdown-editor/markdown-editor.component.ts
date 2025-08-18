import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ContentChange, QuillModules } from 'ngx-quill';


@Component({
    selector: 'ia-markdown-editor',
    templateUrl: './markdown-editor.component.html',
    styleUrl: './markdown-editor.component.scss',
    standalone: false,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MarkdownEditorComponent),
            multi: true,
        }
    ],
})
export class MarkdownEditorComponent implements ControlValueAccessor {
    content: string = '';

    onChangeFn?: Function;
    onTouchedFn?: Function;


    modules: QuillModules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],

            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],

            [{ 'header': [1, 2, 3, 4, 5, false] }],
            ['link', 'image'],

            ['clean'],

        ]
    };


    writeValue(value: string): void {
        this.content = value;
    }

    registerOnChange(fn: Function): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedFn = fn;
    }

    onChange(event: ContentChange) {
        if (this.onChangeFn) {
            this.onChangeFn(event.html)
        }
    }

    onBlur() {
        if (this.onTouchedFn) {
            this.onTouchedFn();
        }
    }
}
