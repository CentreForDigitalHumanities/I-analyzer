import { Component, OnInit } from '@angular/core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { SelectItem } from 'primeng/api';
import { Corpus, Download } from '../models';
import { ApiService, CorpusService } from '../services';

@Component({
    selector: 'ia-download-history',
    templateUrl: './download-history.component.html',
    styleUrls: ['./download-history.component.scss']
})
export class DownloadHistoryComponent implements OnInit {
    corpora: SelectItem[];
    downloads: Download[];

    faDownload = faDownload;

    constructor(private apiService: ApiService, private corpusService: CorpusService) { }

    ngOnInit(): void {
        this.corpusService.get().then((items) => {
            this.corpora = items.map(corpus => ({ 'label': corpus.name, 'value': corpus.name }) );
        }).catch(error => {
            console.log(error);
        });

        this.apiService.downloads()
            .then(result => this.downloads = result)
            .catch(err => console.error(err));
    }

    downloadLink(download: Download): string {
        return '/api/csv/' + download.filename;
    }

}
