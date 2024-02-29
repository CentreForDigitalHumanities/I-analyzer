import {
    AfterContentInit, Component, ContentChildren, ElementRef, EventEmitter, Input, Output,
    QueryList, ViewChildren
} from '@angular/core';
import * as _ from 'lodash';
import { TabPanelDirective } from './tab-panel.directive';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { modulo } from '../../utils/utils';

interface Tab {
    label: string; // display name
    id: string | number;
    icon?: IconDefinition;
};


@Component({
    selector: 'ia-tabs',
    templateUrl: './tabs.component.html',
    styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements AfterContentInit {
    @ViewChildren('tabLink') tabLinks: QueryList<ElementRef>;
    @ContentChildren(TabPanelDirective) tabPanels: QueryList<TabPanelDirective>;

    @Input() activeTab: string | number;
    @Output() tabChange = new EventEmitter<string | number>();

    tabs: Tab[];

    constructor() { }

    ngAfterContentInit(): void {
        this.tabs = this.tabPanels.map(tabPanel => ({
            id: tabPanel.id,
            label: tabPanel.title,
            icon: tabPanel.icon,
        }));

        this.activeTab = this.activeTab || this.tabPanels.first?.id;
    }

    selectTab(tab: Tab) {
        this.activeTab = tab.id;
        this.tabChange.emit(tab.id);
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
        const newIndex = modulo(tabIndex + shift, this.tabs.length);
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
}
