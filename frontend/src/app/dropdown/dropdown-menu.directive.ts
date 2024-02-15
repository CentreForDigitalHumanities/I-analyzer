import { AfterContentInit, ContentChildren, Directive, ElementRef, HostListener, OnInit, Output, QueryList } from '@angular/core';
import { DropdownItemDirective } from './dropdown-item.directive';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Observable, Subject, fromEvent, merge, timer } from 'rxjs';
import * as _ from 'lodash';

@Directive({
    selector: '[iaDropdownMenu]'
})
export class DropdownMenuDirective implements AfterContentInit {
    @ContentChildren(DropdownItemDirective) items: QueryList<DropdownItemDirective>;

    selection$: Observable<any>;

    constructor(private elementRef: ElementRef) { }

    ngAfterContentInit(): void {
        const items$ = this.items.changes.pipe(
            map(data => data._results as DropdownItemDirective[])
        );

        this.selection$ = items$.pipe(
            map(items => items.map(item => item.selected)),
            switchMap(events => merge(...events)),
        );

        items$.pipe(
            map(items => items.map(item => item.navigate)),
            switchMap(events => merge(...events)),
        ).subscribe(shift => this.shiftFocus(shift));
    }

    /** shift the focus in the dropdown item children */
    shiftFocus(shift: number) {
        const items = this.items.toArray();
        const index = _.findIndex(items, item => item.focused.value);
        const newIndex = (index + shift) % items.length;
        items[newIndex].focus();
    }

    /** close user dropdown when the user clicks or focuses elsewhere */
    private observeFocusLost(): Observable<Event> {
        // observable of the next click
        // timer(0) is used to avoid the opening click event being registered
        const clicks$ = timer(0).pipe(
            switchMap(() => fromEvent(document, 'click')),
        );

        // observable of the dropdown losing focus

        const focusOutOfDropdown = (event: FocusEvent) =>
            _.isNull(event.relatedTarget) ||
            (event.relatedTarget as Element).parentElement.id !== 'userDropdown';

        const focusOut$ = fromEvent<FocusEvent>(
            this.elementRef.nativeElement,
            'focusout'
        ).pipe(
            filter(focusOutOfDropdown),
        );

        // when either of these happens, close the dropdown
        return merge(clicks$, focusOut$).pipe(
            take(1)
        );
    }

}
