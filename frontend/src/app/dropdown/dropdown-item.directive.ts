import { Directive, HostBinding, HostListener, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Directive({
    selector: '[iaDropdownItem]'
})
export class DropdownItemDirective {
    @HostBinding('class') class = 'dropdown-item';
    @HostBinding('attr.tabIndex') tabIndex = 0;

    @Input() value;

    @Output() selected = new Subject<any>();

    constructor() { }

    @HostListener('click')
    @HostListener('keydown.enter')
    @HostListener('keydown.space')
    onSelect() {
        this.selected.next(this.value);
        return false;
    }

    // @HostListener('focus')
    // onFocus() {
    //     this.selected.next(this.value);
    // }
}
