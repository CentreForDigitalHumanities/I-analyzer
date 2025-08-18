import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ContentChange } from 'ngx-quill';

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
