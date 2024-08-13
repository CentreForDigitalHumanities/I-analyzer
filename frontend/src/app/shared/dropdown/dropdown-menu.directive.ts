import { ContentChildren, Directive, OnDestroy, OnInit, QueryList } from '@angular/core';
import { DropdownItemDirective } from './dropdown-item.directive';
import {  takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as _ from 'lodash';
import { DropdownService } from './dropdown.service';
import { modulo } from '@utils/utils';

@Directive({
    selector: '[iaDropdownMenu]'
})
export class DropdownMenuDirective implements OnInit, OnDestroy {
    @ContentChildren(DropdownItemDirective) items: QueryList<DropdownItemDirective>;

    private destroy$ = new Subject<void>();

    constructor(private dropdownService: DropdownService) { }

    ngOnInit(): void {
        this.dropdownService.focusShift$.pipe(
            takeUntil(this.destroy$),
        ).subscribe(shift => this.shiftFocus(shift));
    }

    ngOnDestroy(): void {
        this.destroy$.next(undefined);
    }

    /** shift the focus in the dropdownItem children */
    shiftFocus(shift: number) {
        const items = this.items.toArray();
        const index = _.findIndex(items, item => item.focused.value);
        const newIndex = modulo(index + shift, items.length);
        items[newIndex].focus();
    }

}
