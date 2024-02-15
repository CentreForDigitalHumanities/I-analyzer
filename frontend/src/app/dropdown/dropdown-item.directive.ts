import { Directive, ElementRef, HostBinding, HostListener, Input, Output } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Directive({
    selector: '[iaDropdownItem]'
})
export class DropdownItemDirective {
    @HostBinding('class') class = 'dropdown-item';
    @HostBinding('attr.tabIndex') tabIndex = 0;

    @Input() value;

    @Output() selected = new Subject<any>();

    navigate = new Subject<-1|1>();
    focused = new BehaviorSubject<boolean>(false);

    constructor(private elementRef: ElementRef) { }

    @HostBinding('class.is-active')
    get isActive() {
        return false;
    }

    @HostListener('focus')
    onFocus() {
        this.focused.next(true);
    }

    @HostListener('blur')
    onBlur() {
        this.focused.next(false);
    }

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
        return false;
    }

    @HostListener('keydown.ArrowUp')
    navigatePrev() {
        this.navigate.next(-1);
        return false;
    }

    blur() {
        this.elementRef.nativeElement.blur();
    }

    focus() {
        this.elementRef.nativeElement.focus();
    }
}
