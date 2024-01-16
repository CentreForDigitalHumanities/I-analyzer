import { Component, EventEmitter, Output } from '@angular/core';
import { PALETTES } from '../../../utils/select-color';
import { visualizationIcons } from '../../../shared/icons';

@Component({
    selector: 'ia-palette-select',
    templateUrl: './palette-select.component.html',
    styleUrls: ['./palette-select.component.scss'],
})
export class PaletteSelectComponent {
    @Output() paletteChanged = new EventEmitter<string[]>();
    public palettes = PALETTES;
    public _palette = PALETTES[0];

    visualizationIcons = visualizationIcons;

    constructor() {}

    get palette(): string[] {
        return this._palette;
    }

    set palette(value: string[]) {
        this._palette = value;
        this.paletteChanged.emit(value);
    }
}
