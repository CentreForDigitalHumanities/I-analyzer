import { Component, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jsPDF } from "jspdf";
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

import { DialogService, NotificationService, ParamService } from '../../services';
import { PALETTES } from './../select-color';
import { ActivatedRoute } from '@angular/router';
import { Corpus } from '../../models';

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
    @Input() corpus: Corpus;

    @Output() palette = new BehaviorSubject<string[]>(PALETTES[0]);

    faQuestion = faQuestionCircle;

    constructor(private dialogService: DialogService,
        private paramService: ParamService, private route: ActivatedRoute) { }

    ngOnInit(): void {
    }

    onRequestImage() {
        const node = document.getElementById(this.chartElementID) as HTMLCanvasElement;
        const scaleRatio = node.width / node.height;
        const caption = this.paramService.setCaptionFromParams(this.route.snapshot.queryParamMap, this.corpus)
        const imageHeight = 340;

        const pdf = new jsPDF('landscape', 'pt', 'a5');
        pdf.addImage(node, 'PNG', 5, 0, imageHeight * scaleRatio, imageHeight, 'canvas', 'MEDIUM', 0);
        pdf.setFontSize(8);
        pdf.setTextColor('gray');
        pdf.text(caption, 5, 345, {maxWidth: 590});
        pdf.setFontSize(6);
        pdf.setTextColor('blue');
        pdf.textWithLink(window.location.href, 5, 380, {maxWidth: 590})
        pdf.save(this.imageFileName);

    }

    showHelp() {
        this.dialogService.showManualPage(this.manualPage);
    }


}
