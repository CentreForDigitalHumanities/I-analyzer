import { Component, Input, OnInit } from '@angular/core';
import { Corpus } from '../../models';
import { DialogService } from '../../services';
import { Router } from '@angular/router';
import { faInfoCircle, faSearch } from '@fortawesome/free-solid-svg-icons';
import * as _ from 'lodash';

@Component({
  selector: 'ia-corpus-selector',
  templateUrl: './corpus-selector.component.html',
  styleUrls: ['./corpus-selector.component.scss']
})
export class CorpusSelectorComponent implements OnInit {
    @Input() corpus: Corpus;

    infoIcon = faInfoCircle;
    searchIcon = faSearch;

    constructor(private dialogService: DialogService, private router: Router) { }

    get minYear() {
        return this.corpus.minDate.getFullYear();
    }

    get maxYear() {
        return this.corpus.maxDate.getFullYear();
    }

    get languages() {
        return this.corpus.languages.join(', ');
    }

    ngOnInit(): void {
    }

    showMoreInfo(): void {
        this.dialogService.showDescriptionPage(this.corpus);
    }

    navigateToCorpus(event: any): void {
        if (!event.target.classList.contains('moreInfoLink')) {
            this.router.navigate(['/search', this.corpus.name]);
        }
    }

}
