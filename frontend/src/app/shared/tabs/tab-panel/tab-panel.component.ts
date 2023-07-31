import { Component, Input, OnInit } from '@angular/core';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ia-tab-panel',
    templateUrl: './tab-panel.component.html',
    styleUrls: ['./tab-panel.component.scss']
})
export class TabPanelComponent implements OnInit {
    @Input() id: string | number;
    @Input() title: string;
    @Input() icon: IconDefinition;

    active = false;

    constructor() { }

    ngOnInit(): void {
    }

    init(active: boolean) {
        setTimeout(() =>
            this.active = active
            , 0
        );
    }

}
