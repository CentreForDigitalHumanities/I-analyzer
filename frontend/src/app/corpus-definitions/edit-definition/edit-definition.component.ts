import { Component, OnInit } from '@angular/core';
import { actionIcons } from '../../shared/icons';

@Component({
    selector: 'ia-edit-definition',
    templateUrl: './edit-definition.component.html',
    styleUrls: ['./edit-definition.component.scss']
})
export class EditDefinitionComponent implements OnInit {

    actionIcons = actionIcons;

    constructor() { }

    ngOnInit(): void {
    }

}
