import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
    @Input({ required: true }) ariaLabelledBy: string;

    value: string = '';

    onChangeFn?: Function;
    onTouchedFn?: Function;

    writeValue(value: string): void {
        this.value = value;
    }

    registerOnChange(fn: Function): void {
        this.onChangeFn = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedFn = fn;
    }

    onChange(event) {
        if (this.onChangeFn) {
            this.onChangeFn(this.value);
        }
    }

    onBlur() {
        if (this.onTouchedFn) {
            this.onTouchedFn();
        }
    }
}
