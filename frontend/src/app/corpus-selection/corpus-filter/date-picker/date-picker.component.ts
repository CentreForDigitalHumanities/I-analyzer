import { Component, Input, Output } from '@angular/core';
import * as _ from 'lodash';
import { parse } from 'date-fns';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'ia-date-picker',
    templateUrl: './date-picker.component.html',
    styleUrls: ['./date-picker.component.scss'],
    standalone: false
})
export class DatePickerComponent {
    @Input() @Output() subject: BehaviorSubject<Date> = new BehaviorSubject<Date>(undefined);
    @Input() minDate: Date;
    @Input() maxDate: Date;
    @Input() default: Date;
    @Input() unit: 'year'|'date' = 'year';

    constructor() { }

    get dateFormat(): string {
        return this.unit === 'year' ? 'yy' : 'dd-mm-yy';
    }

    formatInput(value: string|Date): Date {
        if (typeof(value) == 'string') {
            const dateFormat = this.unit === 'year' ? 'YYYY' : 'DD-MM-YYYY';
            return parse(value, dateFormat, null, null);
        } else {
            return value;
        }
    }

    set(value: string|Date) {
        const valueAsDate = this.formatInput(value);
        const checkedValue = _.min([_.max([valueAsDate, this.minDate]), this.maxDate]);
        this.subject.next(checkedValue);
    }

}
