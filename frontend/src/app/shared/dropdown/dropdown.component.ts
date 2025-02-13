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
    forwardRef,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { actionIcons } from '../icons';
import { DropdownService } from './dropdown.service';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'ia-dropdown',
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
    providers: [DropdownService,
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DropdownComponent),
            multi: true,
        },
    ],
})
export class DropdownComponent<T> implements OnChanges, AfterViewInit, OnDestroy, ControlValueAccessor  {
    @HostBinding('class') classes = 'dropdown';

    @Input() value: any;
    @Input() disabled: boolean;

    @Output()
    public onChange = new EventEmitter<T>();

    @ViewChild('dropdownTrigger') trigger: ElementRef<HTMLButtonElement>;

    actionIcons = actionIcons;

    private blur$ = new Subject<void>();
    private destroy$ = new Subject<void>();
    private onChangeSubscription?: Subscription;
    private onTouchedSubscription?: Subscription;

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
            this.blur$.next();
        }
    }

    writeValue(value: any) {
        this.dropdownService.selection$.next(value);
    }

    registerOnChange(fn: any): void {
        this.onChangeSubscription?.unsubscribe();
        this.onChangeSubscription = this.dropdownService.selection$.subscribe(fn);
    }

    registerOnTouched(fn: any): void {
        this.onTouchedSubscription?.unsubscribe();
        this.onTouchedSubscription = this.blur$.subscribe(fn);
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
        this.blur$.complete();
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
