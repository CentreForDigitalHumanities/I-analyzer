import { AfterContentInit, Component, ContentChildren, ElementRef, Input, QueryList, ViewChildren } from '@angular/core';
import { Tab } from '../../models/ui';
import { TabPanelComponent } from './tab-panel/tab-panel.component';
import * as _ from 'lodash';

@Component({
    selector: 'ia-tabs',
    templateUrl: './tabs.component.html',
    styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements AfterContentInit {
    @ViewChildren('tabLink') tabLinks: QueryList<ElementRef>;
    @ContentChildren(TabPanelComponent) tabPanels: QueryList<TabPanelComponent>;

    @Input() activeTab: string | number;
    tabs: Tab[];

    constructor() { }

    ngAfterContentInit(): void {
        this.tabs = this.tabPanels.map(tabPanel => ({
            id: tabPanel.id,
            label: tabPanel.title,
            icon: tabPanel.icon,
        }));

        this.activeTab = this.activeTab || this.tabPanels.first?.id;

        this.tabPanels.find(tab => tab.id === this.activeTab)?.init(true);
    }

    selectTab(tab: Tab) {
        this.activeTab = tab.id;
        this.tabPanels?.forEach(tabPanel =>
            tabPanel.active = tabPanel.id === tab.id
        );
    }

    cycleTab(event: KeyboardEvent) {
        const target = event.target as Element;
        const id = target.id;
        const tabIndex = this.tabs.findIndex(tab => this.tabLinkId(tab.id) === id);

        const keyBindings = {
            ArrowLeft: -1,
            ArrowRight: 1,
        };

        const shift = keyBindings[event.key];
        const newIndex = this.modulo(tabIndex + shift, this.tabs.length);
        const newTab = this.tabs[newIndex];
        this.setTabLinkFocus(newTab.id);
        this.selectTab(newTab);
    }

    setTabLinkFocus(id: string | number) {
        this.tabLinks.forEach(tabLink => {
            const element = tabLink.nativeElement;
            const focus = element.id === this.tabLinkId(id);
            element.tabIndex = focus ? 0 : -1;
            if (focus) {
                element.focus();
            }
        });
    }

    tabLinkId(tabId: string | number): string {
        return `tab-${tabId}`;
    }

    private modulo(n: number, d: number): number {
        return ((n % d) + d) % d;
    }
}
