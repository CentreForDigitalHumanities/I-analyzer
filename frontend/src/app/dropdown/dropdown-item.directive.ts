import { Directive, HostBinding, HostListener, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Directive({
    selector: '[iaDropdownItem]'
})
export class DropdownItemDirective {
    @HostBinding('class') class = 'dropdown-item';
    @HostBinding('attr.tabIndex') tabIndex = -1;

    @Input() value;

    @Output() selected = new Subject<any>();

    constructor() { }

    @HostListener('click')
    onClick() {
        this.selected.next(this.value);
    }

    @HostListener('focus')
    onFocus() {
        this.selected.next(this.value);
    }
}
