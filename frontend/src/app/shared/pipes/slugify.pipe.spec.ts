import { SlugifyPipe } from './slugify.pipe';

describe('SlugifyPipe', () => {
    it('create an instance', () => {
        const pipe = new SlugifyPipe();
        expect(pipe).toBeTruthy();
    });

    it('slugifies strings', () => {
        const pipe = new SlugifyPipe();
        const input = 'tab-General information';
        const output = pipe.transform(input);
        const expected = 'tab-general-information';
        expect(output).toEqual(expected);
    });

    it('slugifies numbers', () => {
        const pipe = new SlugifyPipe();
        const input = 1;
        const output = pipe.transform(input);
        const expected = '1';
        expect(output).toEqual(expected);
    });
});
