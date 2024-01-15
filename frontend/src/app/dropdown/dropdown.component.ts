import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    Output,
    OnDestroy,
    HostBinding,
} from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as _ from 'lodash';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ia-dropdown',
    templateUrl: './dropdown.component.html',
    styleUrls: ['./dropdown.component.scss'],
})
export class DropdownComponent<T> implements OnDestroy {
    @HostBinding('class') classes = 'control';
    @Input()
    public canDeselect = false;

    @Input()
    public value: T | undefined = undefined;

    @Input()
    public disabled = false;

    @Input()
    public styleClass: string;

    @Input()
    public options: T[] = [];

    @Input()
    public placeholder = '';

    @Input()
    public optionLabel: keyof T | undefined = undefined;

    @Input() icon: any;

    @Output()
    public onChange = new EventEmitter<T>();

    public showDropdown = false;

    dropIcon = faAngleDown;

    private changeSubject = new Subject<T | undefined>();
    private changeSubscription: Subscription;

    private lodash = _;

    constructor(private elementRef: ElementRef) {
        // don't trigger a lot of events when a user is quickly looping through the options
        // for example using the keyboard arrows
        this.changeSubscription = this.changeSubject
            .pipe(debounceTime(100))
            .subscribe((value) => this.onChange.next(value));
    }

    @HostListener('document:click', ['$event'])
    onClickOut(event) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.showDropdown = false;
        }
    }

    @HostListener('window:keydown', ['$event'])
    keyEvent(event: KeyboardEvent) {
        if (this.elementRef.nativeElement.contains(event.target)) {
            let index = this.options.indexOf(this.value);

            if (event.keyCode === KeyCode.Up) {
                event.preventDefault();
                index--;
                if (index < 0) {
                    // default
                    this.select(undefined, false);
                } else {
                    this.select(this.options[index], false);
                }
            }

            if (event.keyCode === KeyCode.Down) {
                event.preventDefault();
                index++;
                if (index !== this.options.length) {
                    this.select(this.options[index], false);
                }
            }
        }
    }

    ngOnDestroy() {
        this.changeSubscription.unsubscribe();
    }

    public toggleDropdown() {
        this.showDropdown = !this.showDropdown;
    }

    public select(option: T | undefined, hide = true) {
        this.value = option;
        if (hide) {
            this.showDropdown = false;
        }
        this.changeSubject.next(option);
    }
}

enum KeyCode {
    Up = 38,
    Down = 40,
}
