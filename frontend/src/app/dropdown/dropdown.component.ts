import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    Output,
    OnDestroy,
    HostBinding,
    AfterContentInit,
    ContentChild,
    ContentChildren,
    QueryList,
} from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { actionIcons } from '../shared/icons';
import { DropdownMenuDirective } from './dropdown-menu.directive';
import { DropdownItemDirective } from './dropdown-item.directive';
import { DropdownService } from './dropdown.service';

@Component({
    selector: 'ia-dropdown',
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
    providers: [DropdownService]
})
export class DropdownComponent<T> implements OnDestroy  {
    @HostBinding('class') classes = 'dropdown';

    @ContentChild(DropdownMenuDirective) menu: DropdownMenuDirective;

    @Output()
    public onChange = new EventEmitter<T>();

    actionIcons = actionIcons;

    private destroy$ = new Subject<void>();

    constructor(private elementRef: ElementRef, private dropdownService: DropdownService) {
        // don't trigger a lot of events when a user is quickly looping through the options
        // for example using the keyboard arrows
        this.dropdownService.selection$.pipe(
            takeUntil(this.destroy$),
            debounceTime(100)
        ).subscribe((value) => this.onChange.next(value));
    }

    @HostBinding('class.is-active')
    get isActive(): boolean {
        return this.dropdownService.open$.value;
    }

    @HostListener('document:click', ['$event'])
    onClickOut(event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.dropdownService.open$.next(false);
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    public toggleDropdown() {
        this.dropdownService.open$.next(!this.dropdownService.open$.value);
    }

}
