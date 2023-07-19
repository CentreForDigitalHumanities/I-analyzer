import { Component, OnInit } from '@angular/core';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'ia-delete-search-history',
    templateUrl: './delete-search-history.component.html',
    styleUrls: ['./delete-search-history.component.scss']
})
export class DeleteSearchHistoryComponent {
    faTrash = faTrash;

    showConfirm = false;

    constructor() { }

    deleteHistory() { }

}
