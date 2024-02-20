import { Directive, ElementRef, HostBinding, HostListener, Input, Output } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { DropdownService } from './dropdown.service';
import * as _ from 'lodash';

@Directive({
    selector: '[iaDropdownItem]'
})
export class DropdownItemDirective {
    @HostBinding('class') class = 'dropdown-item';
    @HostBinding('role') role = 'menuitem';
    @HostBinding('attr.tabIndex') tabIndex = 0;

    @Input() value;

    @Output() selected = new Subject<any>();

    navigate = new Subject<-1|1>();
    focused = new BehaviorSubject<boolean>(false);

    constructor(private elementRef: ElementRef, private dropdownService: DropdownService) { }

    @HostBinding('class.is-active')
    get isActive(): boolean {
        return _.isEqual(this.dropdownService.selection$.value, this.value);
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
        this.dropdownService.selection$.next(this.value);
        return false;
    }

    @HostListener('keydown.arrowdown')
    navigateNext() {
        this.dropdownService.focusShift$.next(-1);
        return false;
    }

    @HostListener('keydown.arrowup')
    navigatePrev() {
        this.dropdownService.focusShift$.next(-1);
        return false;
    }

    @HostListener('keydown.escape')
    close() {
        this.dropdownService.menuEscaped$.next();
        this.dropdownService.open$.next(false);
    }

    focus() {
        this.elementRef.nativeElement.focus();
    }
}
