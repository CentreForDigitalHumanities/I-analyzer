import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ConfirmModalComponent } from '@shared/confirm-modal/confirm-modal.component';
import { actionIcons } from '@shared/icons';

@Component({
    selector: 'ia-full-data-button',
    templateUrl: './full-data-button.component.html',
    styleUrls: ['./full-data-button.component.scss'],
    standalone: false
})
export class FullDataButtonComponent {
    @Output() requestFullData = new EventEmitter<void>();

    actionIcons = actionIcons;

    constructor() { }


    onConfirm() {
        this.requestFullData.emit();
    }

}
