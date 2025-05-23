import { Component, Input, OnInit } from '@angular/core';
import { Corpus } from '@models/corpus';
import * as _ from 'lodash';
import { AuthService } from '@services';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { actionIcons } from '@shared/icons';
import { environment } from '@environments/environment';


@Component({
    selector: 'ia-corpus-selection',
    templateUrl: './corpus-selection.component.html',
    styleUrls: ['./corpus-selection.component.scss']
})
export class CorpusSelectionComponent implements OnInit {
    @Input()
    public items: Corpus[];

    filteredItems: Corpus[];

    showManageLink$: Observable<boolean>;

    actionIcons = actionIcons;

    showCorpusFilters: boolean;

    constructor(private authService: AuthService) {
        this.showManageLink$ = this.authService.currentUser$.pipe(
            map((user) => user?.canEditCorpora)
        );
        this.showCorpusFilters = _.get(environment, 'showCorpusFilters', true);
     }

    get displayItems(): Corpus[] {
        if (_.isUndefined(this.filteredItems)) {
            return this.items;
        } else {
            return this.filteredItems;
        }
    }

    ngOnInit() {
    }
}
