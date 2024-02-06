
import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import {
    DialogService,
    ManualPageMetaData,
    HighlightService,
} from '../services';
import { actionIcons, navIcons } from '../shared/icons';
import { map } from 'rxjs/operators';

@Component({
    selector: 'ia-manual-navigation',
    templateUrl: './manual-navigation.component.html',
    styleUrls: ['./manual-navigation.component.scss'],
})
export class ManualNavigationComponent implements OnInit {
    navIcons = navIcons;
    actionIcons = actionIcons;

    /**
     * The text to use for highlighting the search results. This differs from the filter text, because additional wildcards are added
     */
    public highlightText: string | undefined;

    private manifest = new Subject<ManualPageMetaData[]>();
    private filterTextSubject = new BehaviorSubject<string>('');

    // eslint-disable-next-line @typescript-eslint/member-ordering
    public filtered = combineLatest([
        this.manifest,
        this.filterTextSubject,
    ]).pipe(
        map(([manifest, filterText]) =>
            Array.from(this.filter(manifest, filterText)),
        )
    );

    constructor(
        private highlightService: HighlightService,
        private dialogService: DialogService
    ) {}

    public get filterText() {
        return this.filterTextSubject.value;
    }
    public set filterText(value: string) {
        this.filterTextSubject.next(value);
    }

    async ngOnInit() {
        this.manifest.next(await this.dialogService.getManifest());
    }

    private *filter(
        pages: ManualPageMetaData[],
        filter: string
    ): Iterable<ManualPageMetaData> {
        if (filter.trim().length === 0) {
            filter = '*';
        }

        // make all terms a wildcard search
        const parts = filter
            .split(' ')
            .filter((part) => part.length)
            .map((part) => (part.slice(-1) !== '*' ? `*${part}*` : part));
        this.highlightText = filter = parts.join(' ');

        // this is a massively over-engineered filter, but as we have this function already anyway: why not?
        // and at least it will be consistent with the highlights which also uses this expression
        const expressions = parts.map((part) =>
            this.highlightService.getQueryExpression(part)
        );

        for (const page of pages) {
            let isMatch = true;
            for (const expression of expressions) {
                expression.lastIndex = 0;
                if (!expression.test(page.title)) {
                    isMatch = false;
                    break;
                }
            }

            if (isMatch) {
                yield page;
            }
        }
    }
}
