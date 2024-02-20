import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable()
export class DropdownService {
    /** selected value */
    selection$ = new BehaviorSubject<any>(undefined);

    /** whether the menu is open */
    open$ = new BehaviorSubject<boolean>(false);

    /** events where the user has closed the menu with the escape key */
    menuEscaped$ = new Subject<void>();

    /** events where the user shifts focus through arrow navigation */
    focusShift$ = new Subject<number>();
};
