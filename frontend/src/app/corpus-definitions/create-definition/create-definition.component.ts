import { Component, OnInit } from '@angular/core';
import { actionIcons } from '../../shared/icons';

@Component({
    selector: 'ia-create-definition',
    templateUrl: './create-definition.component.html',
    styleUrls: ['./create-definition.component.scss']
})
export class CreateDefinitionComponent implements OnInit {

    actionIcons = actionIcons;

    constructor() { }

    ngOnInit(): void {
    }

}
