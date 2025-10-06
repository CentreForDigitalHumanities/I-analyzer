import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'ia-toggle',
    templateUrl: './toggle.component.html',
    styleUrls: ['./toggle.component.scss'],
    standalone: false
})
export class ToggleComponent {
    @Input() toggleLabel: string;
    @Output() toggled = new EventEmitter<boolean>();
    active = false;

    constructor() { }

    public toggleButton() {
        this.active = !this.active;
        this.toggled.emit(this.active);
    }

}
