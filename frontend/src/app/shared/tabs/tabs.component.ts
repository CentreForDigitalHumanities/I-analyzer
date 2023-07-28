import { Component, Input, OnChanges } from '@angular/core';
import { Tab } from '../../models/ui';

@Component({
    selector: 'ia-tabs',
    templateUrl: './tabs.component.html',
    styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnChanges {
    @Input() tabs: Tab[];

    activeTab: string | number;

    constructor() { }

    ngOnChanges() {
        this.activeTab = this.tabs ? this.tabs[0].id : undefined;
    }

    selectTab(tab: Tab) {
        this.activeTab = tab.id;
    }
}
