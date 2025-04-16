import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';

@Component({
  selector: 'ia-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss']
})
export class DatePickerComponent {
    @Input() value: Date;
    @Input() minDate: Date;
    @Input() maxDate: Date;
    @Input() default: Date;
    @Input() unit: 'year'|'date' = 'year';
    @Output() onChange = new EventEmitter<Date>();

    constructor() { }

    get dateFormat(): string {
        return this.unit === 'year' ? 'yy' : 'dd-mm-yy';
    }

    formatInput(value: string|Date): Date {
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

        return valueAsDate;
    }

    set(value: string|Date) {
        const valueAsDate = this.formatInput(value);
        const checkedValue = _.min([_.max([valueAsDate, this.minDate]), this.maxDate]);
        this.onChange.emit(checkedValue);
    }

}
