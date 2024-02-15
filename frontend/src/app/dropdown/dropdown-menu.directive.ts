import { AfterContentInit, ContentChildren, Directive, HostListener, QueryList } from '@angular/core';
import { DropdownItemDirective } from './dropdown-item.directive';
import { map, switchMap, tap } from 'rxjs/operators';
import { merge } from 'rxjs';

@Directive({
    selector: '[iaDropdownMenu]'
})
export class DropdownMenuDirective implements AfterContentInit {
    @ContentChildren(DropdownItemDirective) items: QueryList<DropdownItemDirective>;

    constructor() { }

    @HostListener('focusout')
    onFocusOut(event) {
        console.log(event);
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

}
