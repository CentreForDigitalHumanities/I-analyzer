import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DropdownService {
    selection$ = new BehaviorSubject<any>(undefined);
    open$ = new BehaviorSubject<boolean>(false);
};
