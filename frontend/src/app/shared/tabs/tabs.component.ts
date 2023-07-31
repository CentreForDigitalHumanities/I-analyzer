import { AfterContentInit, Component, ContentChildren, Input, QueryList } from '@angular/core';
import { Tab } from '../../models/ui';
import { TabPanelComponent } from './tab-panel/tab-panel.component';

@Component({
    selector: 'ia-tabs',
    templateUrl: './tabs.component.html',
    styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements AfterContentInit {
    @ContentChildren(TabPanelComponent) tabPanels: QueryList<TabPanelComponent>;

    activeTab: string | number;
    tabs: Tab[];

    constructor() { }

    ngAfterContentInit(): void {
        this.tabs = this.tabPanels.map(tabPanel => ({
            id: tabPanel.id,
            label: tabPanel.title,
            icon: tabPanel.icon,
        }));

        this.activeTab = this.tabPanels.first?.id;
        this.tabPanels.first?.init(true);
    }

    selectTab(tab: Tab) {
        this.activeTab = tab.id;
        this.tabPanels?.forEach(tabPanel =>
            tabPanel.active = tabPanel.id === tab.id
        );
    }
}
