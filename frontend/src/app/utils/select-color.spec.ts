import { selectColor } from './select-color';

describe('selectColor', () => {
    it('should pick colours from an index', () => {
        const palette = ['red', 'green', 'blue'];
        expect(selectColor(palette, 0)).toBe('red');
        expect(selectColor(palette, 2)).toBe('blue');
    });

    it('should pick a default colour', () => {
        const palette = ['red', 'green', 'blue'];
        expect(selectColor(palette)).toBe('red');
        expect(selectColor(palette, undefined)).toBe('red');

        expect(selectColor()).toBe('#3F51B5');
    });

    it('should roll-over colours', () => {
        const palette = ['red', 'green', 'blue'];
        expect(selectColor(palette, 4)).toBe('green');
    });
});
