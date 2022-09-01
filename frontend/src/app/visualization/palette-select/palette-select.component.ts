import { Component, EventEmitter, Output } from '@angular/core';
import { faPalette, faSquare } from '@fortawesome/free-solid-svg-icons';
import { PALETTES } from '../select-color';

@Component({
    selector: 'ia-palette-select',
    templateUrl: './palette-select.component.html',
    styleUrls: ['./palette-select.component.scss']
})
export class PaletteSelectComponent {
    public palettes = PALETTES;
    public _palette = PALETTES[0];

    @Output() paletteChanged = new EventEmitter<string[]>();

    faPalette = faPalette;
    faSquare = faSquare;

    constructor() { }

    get palette(): string[] {
        return this._palette;
    }

    set palette(value: string[]) {
        this._palette = value;
        this.paletteChanged.emit(value);
    }

}
