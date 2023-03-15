import { Component, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DialogService, NotificationService } from '../../services';
import { jsPDF } from "jspdf";
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

    constructor(private dialogService: DialogService, private notificationService: NotificationService) { }

    ngOnInit(): void {
    }

    onRequestImage() {
        const imageFileName = this.imageFileName;
        const node = document.getElementById(this.chartElementID) as HTMLCanvasElement;
        // const data = node.toDataURL("image/png", 1.0);

        const pdf = new jsPDF('landscape', 'pt', 'a5');
        pdf.addImage(node, 'PNG', 0, 0, 600, 320, 'canvas', 'MEDIUM', 0);
        pdf.setFontSize(12);
        pdf.text("Caption text", 0, 330);
        pdf.save(this.imageFileName);

        // htmlToImage.toPng(node, {backgroundColor: 'white', pixelRatio: 4})
        //   .then((dataUrl) => {
        //     const img = new Image();
        //     img.src = dataUrl;
        //     const anchor = document.createElement('a');
        //     anchor.href = dataUrl;
        //     anchor.download = imageFileName || 'chart.png';
        //     anchor.click();
        //   })
        //   .catch((error) => {
        //     this.notificationService.showMessage('Could not initiate image download', error);
        //   });

    }

    showHelp() {
        this.dialogService.showManualPage(this.manualPage);
    }


}
