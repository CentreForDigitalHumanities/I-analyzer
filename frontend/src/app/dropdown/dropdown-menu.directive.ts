import { AfterContentInit, ContentChildren, Directive, ElementRef, HostListener, OnDestroy, QueryList } from '@angular/core';
import { DropdownItemDirective } from './dropdown-item.directive';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { Subject, merge } from 'rxjs';
import * as _ from 'lodash';
import { DropdownService } from './dropdown.service';

@Directive({
    selector: '[iaDropdownMenu]'
})
export class DropdownMenuDirective implements AfterContentInit, OnDestroy {
    @ContentChildren(DropdownItemDirective) items: QueryList<DropdownItemDirective>;

    private destroy$ = new Subject<void>();

    constructor(private elementRef: ElementRef, private dropdownService: DropdownService) { }

    @HostListener('focusout', ['$event'])
    onFocusOut(event: FocusEvent) {
        if (_.isNull(event.relatedTarget) ||
            !this.elementRef.nativeElement.contains(event.relatedTarget)
        ) {
            this.dropdownService.open$.next(false);
        }
    }

    ngAfterContentInit(): void {
        // handle arrow navigation between items
        const items$ = this.items.changes.pipe(
            takeUntil(this.destroy$),
            map(data => data._results as DropdownItemDirective[])
        );

        items$.pipe(
            map(items => items.map(item => item.navigate)),
            switchMap(events => merge(...events)),
        ).subscribe(shift => this.shiftFocus(shift));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
    }

    /** shift the focus in the dropdownItem children */
    shiftFocus(shift: number) {
        const items = this.items.toArray();
        const index = _.findIndex(items, item => item.focused.value);
        const newIndex = (index + shift) % items.length;
        items[newIndex].focus();
    }

}
