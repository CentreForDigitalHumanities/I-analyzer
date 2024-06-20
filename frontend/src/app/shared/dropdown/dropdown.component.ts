import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    Output,
    OnDestroy,
    HostBinding,
    OnChanges,
    SimpleChanges,
    ViewChild,
    AfterViewInit,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { actionIcons } from '../icons';
import { DropdownService } from './dropdown.service';

@Component({
    selector: 'ia-dropdown',
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
    providers: [DropdownService]
})
export class DropdownComponent<T> implements OnChanges, AfterViewInit, OnDestroy  {
    @HostBinding('class') classes = 'dropdown';

    @Input() value: any;
    @Input() disabled: boolean;

    @Output()
    public onChange = new EventEmitter<T>();

    @ViewChild('dropdownTrigger') trigger: ElementRef<HTMLButtonElement>;

    actionIcons = actionIcons;

    private destroy$ = new Subject<void>();

    constructor(private elementRef: ElementRef, private dropdownService: DropdownService) {
        // don't trigger a lot of events when a user is quickly looping through the options
        // for example using the keyboard arrows
        this.dropdownService.selection$.pipe(
            takeUntil(this.destroy$),
            debounceTime(100),
            distinctUntilChanged(_.isEqual),
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

    @HostListener('focusout', ['$event'])
    onFocusOut(event: FocusEvent) {
        if (_.isNull(event.relatedTarget) ||
            !this.elementRef.nativeElement.contains(event.relatedTarget)
        ) {
            this.dropdownService.open$.next(false);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.value) {
            this.dropdownService.selection$.next(this.value);
        }
    }

    ngAfterViewInit(): void {
        this.dropdownService.menuEscaped$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.trigger.nativeElement.focus();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next(undefined);
        this.destroy$.complete();
    }

    public toggleDropdown() {
        this.dropdownService.open$.next(!this.dropdownService.open$.value);
    }

    focusOnFirstItem(event: KeyboardEvent) {
        event.preventDefault();
        if (this.dropdownService.open$.value) {
            this.dropdownService.focusShift$.next(1);
        }
    }

}
