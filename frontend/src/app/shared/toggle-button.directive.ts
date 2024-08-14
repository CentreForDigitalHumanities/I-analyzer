import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
    selector: '[iaToggleButton]',
})
export class ToggleButtonDirective {
    @HostBinding('class.is-primary')
    @HostBinding('attr.aria-pressed')
    @Input() active: boolean;

    constructor() { }

}
