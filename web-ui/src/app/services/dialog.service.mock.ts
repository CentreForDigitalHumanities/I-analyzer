import { Injectable } from "@angular/core";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { DialogEvent } from './dialog.service';

@Injectable()
export class DialogServiceMock {
    public behavior = new BehaviorSubject<DialogEvent>({ status: 'hide' });
}