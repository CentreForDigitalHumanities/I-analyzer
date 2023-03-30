import { Component, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DialogService, NotificationService } from '../../services';
import * as htmlToImage from 'html-to-image';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { PALETTES } from './../select-color';

@Component({
  selector: 'ia-visualization-footer',
  templateUrl: './visualization-footer.component.html',
  styleUrls: ['./visualization-footer.component.scss']
})
export class VisualizationFooterComponent implements OnInit {
    @Input() manualPage: string;
    @Input() chartElementID: string;
    @Input() imageFileName: string;
    @Input() tableView: boolean; // whether we are viewing the table: hides the palette and image download

    @Output() palette = new BehaviorSubject<string[]>(PALETTES[0]);

    faQuestion = faQuestionCircle;

    constructor(
      private dialogService: DialogService,
      private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
    }

    onRequestImage() {
        const imageFileName = this.imageFileName;
        const node = document.getElementById(this.chartElementID);

        htmlToImage.toPng(node)
          .then((dataUrl) => {
            const img = new Image();
            img.src = dataUrl;
            const anchor = document.createElement('a');
            anchor.href = dataUrl;
            anchor.download = imageFileName || 'chart.png';
            anchor.click();
          })
          .catch((error) => {
            this.notificationService.showMessage('Image creation failed.', error);
          });

    }

    showHelp() {
        this.dialogService.showManualPage(this.manualPage);
    }


}
