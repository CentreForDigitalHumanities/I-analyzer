import { Component, Input, Output } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'ia-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss']
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

    set(value: string|Date) {
        let valueAsDate: Date;
        if (typeof(value) == 'string') {
            const format = this.unit === 'year' ? 'YYYY' : 'DD-MM-YYYY';
            const m = moment(value, format);
            if (m.isValid()) {
                valueAsDate = m.toDate();
            }
        } else {
            valueAsDate = value;
        }

        this.subject.next(valueAsDate);
    }

}
