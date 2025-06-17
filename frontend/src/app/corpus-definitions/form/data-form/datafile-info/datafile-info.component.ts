import { Component, Input } from '@angular/core';
import { CorpusDataFile, DataFileInfo } from '@models/corpus-definition';

@Component({
  selector: 'ia-datafile-info',
  templateUrl: './datafile-info.component.html',
  styleUrl: './datafile-info.component.scss'
})
export class DatafileInfoComponent {
    @Input() currentFileInfo: DataFileInfo;
    @Input() currentDataFile: CorpusDataFile;
}
