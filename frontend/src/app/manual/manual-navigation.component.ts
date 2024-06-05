
import { Subject } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import {
    DialogService,
    ManualPageMetaData,
} from '../services';
import { actionIcons, navIcons } from '../shared/icons';

@Component({
    selector: 'ia-manual-navigation',
    templateUrl: './manual-navigation.component.html',
    styleUrls: ['./manual-navigation.component.scss'],
})
export class ManualNavigationComponent implements OnInit {
    navIcons = navIcons;
    actionIcons = actionIcons;

    manifest = new Subject<ManualPageMetaData[]>();

    constructor(
        private dialogService: DialogService
    ) {}


    async ngOnInit() {
        this.manifest.next(await this.dialogService.getManifest());
    }
}
