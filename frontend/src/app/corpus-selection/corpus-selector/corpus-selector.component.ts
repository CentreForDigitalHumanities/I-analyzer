import { Component, Input, OnInit } from '@angular/core';
import { Corpus } from '../../models';
import { DialogService } from '../../services';
import { Router } from '@angular/router';

@Component({
  selector: 'ia-corpus-selector',
  templateUrl: './corpus-selector.component.html',
  styleUrls: ['./corpus-selector.component.scss']
})
export class CorpusSelectorComponent implements OnInit {
    @Input() corpus: Corpus;

    constructor(private dialogService: DialogService, private router: Router) { }

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
