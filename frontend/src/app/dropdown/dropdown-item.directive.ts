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
    @Output() navigate = new Subject<-1|1>();

    constructor() { }

    @HostListener('click')
    @HostListener('keydown.enter')
    @HostListener('keydown.space')
    select() {
        this.selected.next(this.value);
        return false;
    }

    @HostListener('keydown.ArrowDown')
    navigateNext() {
        this.navigate.next(1);
    }

    @HostListener('keydown.ArrowUp')
    navigatePrev() {
        this.navigate.next(-1);
    }
}
