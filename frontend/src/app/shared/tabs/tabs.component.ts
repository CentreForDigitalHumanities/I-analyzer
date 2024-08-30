import {
    AfterContentInit, Component, ContentChildren, ElementRef, EventEmitter, Input, Output,
    QueryList, ViewChildren
} from '@angular/core';
import * as _ from 'lodash';
import { TabPanelDirective } from './tab-panel.directive';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { modulo } from '@utils/utils';
import { SlugifyPipe } from '@shared/pipes/slugify.pipe';

interface Tab {
    label: string; // display name
    id: string | number;
    elementId: string;
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

    constructor(private slugifyPipe: SlugifyPipe) {}

    ngAfterContentInit(): void {
        this.tabs = this.tabPanels.map(tabPanel => ({
            id: tabPanel.id,
            elementId: this.tabLinkId(tabPanel.id),
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
        const tabIndex = this.tabs.findIndex(tab => tab.elementId === target.id);

        const keyBindings = {
            ArrowLeft: -1,
            ArrowRight: 1,
        };

        const shift = keyBindings[event.key];
        const newIndex = modulo(tabIndex + shift, this.tabs.length);
        const newTab = this.tabs[newIndex];
        this.setTabLinkFocus(newTab.elementId);
        this.selectTab(newTab);
    }

    setTabLinkFocus(elementId: string) {
        this.tabLinks.forEach(tabLink => {
            const element = tabLink.nativeElement;
            const focus = element.id === elementId;
            element.tabIndex = focus ? 0 : -1;
            if (focus) {
                element.focus();
            }
        });
    }

    tabLinkId(tabId: string | number): string {
        const slugifiedId = this.slugifyPipe.transform(tabId);
        return `tab-${slugifiedId}`;
    }
}
