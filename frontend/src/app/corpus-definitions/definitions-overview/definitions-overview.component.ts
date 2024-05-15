import { Component, OnInit } from '@angular/core';
import { actionIcons } from '../../shared/icons';

@Component({
    selector: 'ia-definitions-overview',
    templateUrl: './definitions-overview.component.html',
    styleUrls: ['./definitions-overview.component.scss']
})
export class DefinitionsOverviewComponent implements OnInit {
    actionIcons = actionIcons;

    constructor() { }

    ngOnInit(): void {
    }

}
