import { AfterContentInit, ContentChildren, Directive, ElementRef, HostListener, OnInit, Output, QueryList } from '@angular/core';
import { DropdownItemDirective } from './dropdown-item.directive';
import { filter, map, switchMap, take, tap } from 'rxjs/operators';
import { Subject, fromEvent, merge, timer } from 'rxjs';
import * as _ from 'lodash';

@Directive({
    selector: '[iaDropdownMenu]'
})
export class DropdownMenuDirective implements OnInit, AfterContentInit {
    @ContentChildren(DropdownItemDirective) items: QueryList<DropdownItemDirective>;

    @Output() done = new Subject<void>();

    constructor(private elementRef: ElementRef) { }

    ngOnInit() {
        this.triggerCloseDropdown();
        this.done.subscribe(() => console.log('done!'));
    }


    ngAfterContentInit(): void {
        // this.items.changes.pipe(
        //     map(data => data.first),
        //     tap(data => console.log(data))
        // ).subscribe();

        // this.items.changes.pipe(
        //     map(data => data._results as DropdownItemDirective[]),
        //     map(items => items.map(item => item.selected)),
        //     switchMap(events => merge(...events)),
        // ).subscribe(data =>
        //     console.log(data)
        // );
    }

    /** close user dropdown when the user clicks or focuses elsewhere */
    private triggerCloseDropdown() {
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
        merge(clicks$, focusOut$).pipe(
            take(1)
        ).subscribe(() => this.done.next());
    }

}
